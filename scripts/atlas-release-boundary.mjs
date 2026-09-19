#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createPublicKey, randomUUID, verify } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { documentBytes, sha256, verifyAuthorization } from './atlas-release-authorization.mjs';

export const CODES = ['breast', 'mm', 'nsclc', 'obesity', 'parkinsons', 'urothelial'];
const HASH = /^[a-f0-9]{64}$/;
const fail = code => { throw new Error(code); };
const need = (ok, code) => { if (!ok) fail(code); };
const same = (a, b) => documentBytes(a).equals(documentBytes(b));
const inside = (parent, child) => child === parent || child.startsWith(parent + path.sep);

function directory(value) {
  need(typeof value === 'string' && path.isAbsolute(value), 'ABSOLUTE_ROOT_REQUIRED');
  const real = fs.realpathSync(value);
  need(real === path.resolve(value) && fs.lstatSync(real).isDirectory(), 'ROOT_SYMLINK_OR_TYPE');
  return real;
}
function bytes(root, relative, max = 100 * 1024 * 1024) {
  need(typeof relative === 'string' && !path.isAbsolute(relative) && !relative.includes('\\') &&
    relative.split('/').every(x => x && x !== '.' && x !== '..'), 'UNSAFE_PATH');
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    need(!fs.lstatSync(current).isSymbolicLink(), 'SYMLINK_FORBIDDEN');
  }
  const fd = fs.openSync(current, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    need(stat.isFile() && stat.size <= max, 'FILE_TYPE_OR_SIZE');
    const data = fs.readFileSync(fd);
    need(data.length <= max, 'FILE_SIZE');
    return data;
  } finally { fs.closeSync(fd); }
}
function parse(data) {
  const value = JSON.parse(data.toString('utf8'));
  need(documentBytes(value).equals(data), 'NONCANONICAL_DOCUMENT');
  return value;
}
function signed(envelope, key, domain) {
  need(envelope && typeof envelope.payload_base64 === 'string' && typeof envelope.signature === 'string', 'SIGNED_ENVELOPE_REQUIRED');
  const payload = Buffer.from(envelope.payload_base64, 'base64');
  need(payload.length <= 1024 * 1024 && payload.toString('base64') === envelope.payload_base64, 'PAYLOAD_ENCODING');
  const signature = Buffer.from(envelope.signature, 'base64');
  need(signature.length === 64 && signature.toString('base64') === envelope.signature &&
    verify(null, Buffer.concat([Buffer.from(domain), payload]), key, signature), 'AUTHORITY_SIGNATURE_INVALID');
  return parse(payload);
}
function inventory(root) {
  const result = [];
  function walk(at, prefix = '') {
    for (const item of fs.readdirSync(at, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = prefix + item.name;
      need(!item.isSymbolicLink(), 'SYMLINK_FORBIDDEN');
      if (item.isDirectory()) walk(path.join(at, item.name), rel + '/');
      else { need(item.isFile(), 'UNSUPPORTED_FILE'); result.push(rel); }
    }
  }
  walk(root); return result.sort();
}
function snapshot(root, manifest) {
  need(manifest.schema_version === 1 && Array.isArray(manifest.files) && manifest.files.length > 0, 'SITE_MANIFEST_SCHEMA');
  const names = manifest.files.map(x => x.path);
  need(new Set(names).size === names.length && same([...names].sort(), inventory(root)), 'ARTIFACT_INVENTORY_MISMATCH');
  let total = 0;
  return manifest.files.map(item => {
    need(HASH.test(item.sha256), 'ARTIFACT_HASH');
    const data = bytes(root, item.path); total += data.length;
    need(total <= 100 * 1024 * 1024 && sha256(data) === item.sha256, 'ARTIFACT_BYTES_MISMATCH');
    return { path: item.path, sha256: item.sha256, data };
  });
}
function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024 }).trim();
}

function inspect({ packageRoot, checkoutRoot, authorityRoot, expectedCommit, now = new Date(), operation = 'publish' }) {
  need(['publish', 'safe-unpublished'].includes(operation), 'RELEASE_OPERATION');
  // These roots/commit are supplied by the deployment authority, not release.json.
  const pkg = directory(packageRoot), checkout = directory(checkoutRoot), authority = directory(authorityRoot);
  need(!inside(pkg, authority) && !inside(checkout, authority), 'CANDIDATE_CANNOT_SUPPLY_AUTHORITY');
  need(/^[a-f0-9]{40}$/.test(expectedCommit) && git(checkout, ['rev-parse', 'HEAD']) === expectedCommit, 'SOURCE_COMMIT_MISMATCH');
  need(git(checkout, ['status', '--porcelain', '--untracked-files=all']) === '', 'SOURCE_CHECKOUT_DIRTY');
  const key = createPublicKey(bytes(authority, 'authority-public-key.pem', 16384));
  need(key.asymmetricKeyType === 'ed25519', 'AUTHORITY_ALGORITHM');
  const stateBytes = bytes(authority, 'production-state.json', 1024 * 1024);
  const state = signed(parse(stateBytes), key, 'atlas-production-state-v1\n');
  need(state.schema_version === 1 && state.source_commit === expectedCommit, 'TRUSTED_SOURCE_COMMIT');
  need(Date.parse(state.issued_at) <= now.getTime() && now.getTime() < Date.parse(state.trusted.valid_until), 'TRUSTED_STATE_EXPIRED');
  const ledgerBytes = bytes(authority, 'ledger.json', 1024 * 1024), ledger = parse(ledgerBytes);
  need(sha256(ledgerBytes) === state.ledger_sha256, 'LEDGER_STATE_STALE');
  need(ledger.version === 1 && ledger.target === state.trusted.target && ledger.active === null &&
    ledger.predecessor_sha256 === state.trusted.predecessor_sha256 && ledger.fencing_token === state.trusted.fencing_token &&
    same(ledger.consumed_release_ids, state.trusted.consumed_release_ids), 'LEDGER_STATE_MISMATCH');
  const policyBytes = bytes(authority, 'signer-policy.json', 1024 * 1024);
  const policy = parse(policyBytes);
  let authorizationValidUntil = Math.min(Date.parse(state.trusted.valid_until), Date.parse(policy.expires_at));
  const bundle = parse(bytes(pkg, 'release.json', 1024 * 1024));
  need(bundle.schema_version === 1 && /^[a-zA-Z0-9._-]+$/.test(bundle.release_id) && bundle.source_commit === expectedCommit, 'RELEASE_SCHEMA');
  need((bundle.operation ?? 'publish') === operation, 'RELEASE_OPERATION_BINDING');
  need(same(Object.keys(bundle.indications).sort(), CODES), 'EXACT_SIX_REQUIRED');
  const siteBytes = bytes(pkg, 'site-manifest.json', 1024 * 1024), site = parse(siteBytes);
  const qBytes = bytes(pkg, 'qualification.json', 1024 * 1024), q = parse(qBytes);
  const rollbackBytes = bytes(pkg, 'rollback-manifest.json', 1024 * 1024), rollback = parse(rollbackBytes);
  need(sha256(siteBytes) === state.site_manifest_sha256 && sha256(qBytes) === state.qualification_sha256 &&
    sha256(rollbackBytes) === state.rollback_manifest_sha256, 'UNQUALIFIED_ARTIFACTS');
  need(site.source_commit === expectedCommit && same(site.indications, CODES), 'SITE_SCOPE_OR_COMMIT');
  need(q.schema_version === 1 && q.source_commit === expectedCommit && q.site_manifest_sha256 === sha256(siteBytes) &&
    q.rollback_manifest_sha256 === sha256(rollbackBytes) && q.status === 'PASS' &&
    same(q.full_detail, ['mm', 'nsclc', 'obesity']) && same(q.previews, ['breast', 'parkinsons', 'urothelial']) &&
    ['evidence', 'public_private', 'rendered_routes', 'source_links', 'exact_assets', 'rollback_compatibility'].every(k => q.checks[k] === true), 'QUALIFICATION_INCOMPLETE');
  need((rollback.mode === 'safe-unpublished' && same(rollback.indications, [])) ||
    (rollback.mode === 'approved-six' && same(rollback.indications, CODES)), 'UNSAFE_ROLLBACK_SCOPE');
  need(rollback.reader_compatible === true, 'ROLLBACK_INCOMPATIBLE');
  const siteFiles = snapshot(directory(path.join(pkg, 'site')), site);
  const rollbackFiles = snapshot(directory(path.join(pkg, 'rollback')), rollback);
  const trusted = { ...state.trusted, now: now.toISOString() };
  const releases = [];
  let rollbackIntentBytes;
  if (operation === 'safe-unpublished') {
    need(rollback.mode === 'safe-unpublished', 'ROLLBACK_OPERATION_MODE');
    rollbackIntentBytes = bytes(pkg, 'rollback-intent.json', 32768);
    need(same(parse(rollbackIntentBytes), { schema_version: 1, operation: 'safe-unpublished', source_commit: expectedCommit,
      original_site_manifest_sha256: sha256(siteBytes), rollback_manifest_sha256: sha256(rollbackBytes) }), 'ROLLBACK_INTENT_BINDING');
  }
  for (const code of CODES) {
    const item = bundle.indications[code];
    const manifestBytes = bytes(pkg, item.manifest, 1024 * 1024);
    const manifest = parse(manifestBytes);
    need(manifest.indication === code, 'INDICATION_MANIFEST_MISMATCH');
    const approvals = item.approvals.map(ref => {
      const e = parse(bytes(pkg, ref, 32768));
      return { payload: Buffer.from(e.payload_base64, 'base64'), signature: e.signature };
    });
    const result = verifyAuthorization({ manifestBytes, policyBytes, approvals, artifactRoot: pkg, trusted });
    authorizationValidUntil = Math.min(authorizationValidUntil, Date.parse(manifest.expires_at));
    for (const approval of approvals) {
      const payload = parse(approval.payload);
      // Verifier permits equality at the max-age bound; timestamp precision is milliseconds.
      authorizationValidUntil = Math.min(authorizationValidUntil, Date.parse(payload.expires_at),
        Date.parse(payload.issued_at) + policy.max_approval_age_seconds * 1000 + 1);
    }
    for (const [kind, expected] of [['site-manifest', siteBytes], ['qualification', qBytes], ['rollback-manifest', rollbackBytes]]) {
      const artifact = result.artifacts.find(x => x.kind === kind);
      need(artifact && artifact.bytes.equals(expected), 'INDICATION_WHOLE_SITE_BINDING');
    }
    if (rollbackIntentBytes) {
      const intent = result.artifacts.find(x => x.kind === 'rollback-intent');
      need(intent && intent.bytes.equals(rollbackIntentBytes), 'ROLLBACK_INTENT_NOT_APPROVED');
    }
    releases.push(result.release_id);
  }
  need(new Set(releases).size === CODES.length, 'DUPLICATE_RELEASE_ID');
  return { pkg, authority, key, stateBytes, ledgerBytes, ledger, releases,
    siteFiles: operation === 'safe-unpublished' ? rollbackFiles : siteFiles, rollbackFiles, operation,
    validUntil: Date.parse(state.trusted.valid_until), authorizationValidUntil, releaseId: bundle.release_id, siteHash: operation === 'safe-unpublished' ? sha256(rollbackBytes) : sha256(siteBytes), sourceCommit: expectedCommit };
}
function summary(x) {
  return Object.freeze({ status: 'PREFLIGHT_PASS', publication_authorized: false,
    release_id: x.releaseId, operation: x.operation, source_commit: x.sourceCommit, site_manifest_sha256: x.siteHash,
    indication_count: 6, verified_role_signatures: 12, site_files: x.siteFiles.length,
    rollback_files: x.rollbackFiles.length, requires_atomic_deployment_reservation: true });
}
export function preflight(options) { return summary(inspect(options)); }
export function preflightRollback(options) { return preflight({ ...options, operation: 'safe-unpublished' }); }
export async function deployRollbackWithAuthorization(options, upload) {
  return deployWithAuthorization({ ...options, operation: 'safe-unpublished' }, upload);
}

function atomicWrite(root, name, value) {
  const temporary = path.join(root, `.${name}.${randomUUID()}.tmp`);
  const fd = fs.openSync(temporary, 'wx', 0o600);
  try { fs.writeFileSync(fd, documentBytes(value)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(temporary, path.join(root, name));
  const dirfd = fs.openSync(root, 'r'); try { fs.fsyncSync(dirfd); } finally { fs.closeSync(dirfd); }
}

/** Only an authority-owned deployment process may call this side-effect API.
 * upload receives checked bytes, never paths to files that could subsequently change.
 * It must return an authority-signed independently read-back deployment outcome.
 */
export async function deployWithAuthorization(options, upload) {
  need(typeof upload === 'function', 'TRUSTED_UPLOAD_CALLBACK_REQUIRED');
  const timeoutMs = options.timeoutMs ?? 120000;
  need(Number.isInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 900000, 'UPLOAD_TIMEOUT_INVALID');
  const authority = directory(options.authorityRoot), lock = path.join(authority, '.release-lock');
  fs.mkdirSync(lock, { mode: 0o700 }); // Exclusive, no automatic stale-lock deletion.
  let x, lease;
  try {
    x = inspect({ ...options, now: new Date() });
    need(bytes(authority, 'ledger.json').equals(x.ledgerBytes) && bytes(authority, 'production-state.json').equals(x.stateBytes), 'STATE_CAS_FAILED');
    lease = randomUUID();
    x.ledger.active = { lease, status: 'reserved', release_id: x.releaseId, releases: x.releases,
      site_manifest_sha256: x.siteHash, source_commit: x.sourceCommit };
    atomicWrite(authority, 'ledger.json', x.ledger);
    // Base64 strings preserve the checked snapshot independently of subsequent disk writes.
    const frozen = Object.freeze(x.siteFiles.map(f => Object.freeze({ path: f.path, sha256: f.sha256, base64: f.data.toString('base64') })));
    let timer;
    let outcomeEnvelope;
    try {
      outcomeEnvelope = await Promise.race([
        Promise.resolve().then(() => {
          need(Date.now() < x.authorizationValidUntil, 'AUTHORIZATION_WINDOW_EXPIRED');
          need(bytes(authority, 'production-state.json').equals(x.stateBytes), 'TRUSTED_STATE_CHANGED_OR_EXPIRED');
          need(same(parse(bytes(authority, 'ledger.json')), x.ledger), 'LEDGER_UPLOAD_CAS_FAILED');
          return upload(Object.freeze({ lease, source_commit: x.sourceCommit, authorization_expires_at: new Date(x.authorizationValidUntil).toISOString(),
            site_manifest_sha256: x.siteHash, files: frozen }));
        }),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('UPLOAD_OUTCOME_TIMEOUT')), timeoutMs); }),
      ]);
    } finally { clearTimeout(timer); }
    need(Date.now() < x.authorizationValidUntil, 'AUTHORIZATION_WINDOW_EXPIRED');
    need(Date.now() < x.validUntil && bytes(authority, 'production-state.json').equals(x.stateBytes), 'TRUSTED_STATE_CHANGED_OR_EXPIRED');
    const outcome = signed(outcomeEnvelope, x.key, 'atlas-deployment-outcome-v1\n');
    need(outcome.lease === lease && outcome.source_commit === x.sourceCommit && outcome.site_manifest_sha256 === x.siteHash &&
      outcome.status === 'VERIFIED_LIVE' && typeof outcome.deployment_id === 'string' && outcome.deployment_id.length > 0 &&
      Date.parse(outcome.verified_at) <= Date.now() && Date.now() - Date.parse(outcome.verified_at) < 300000, 'DEPLOYMENT_OUTCOME_UNVERIFIED');
    need(same(parse(bytes(authority, 'ledger.json')), x.ledger), 'LEDGER_CONSUME_CAS_FAILED');
    need(Date.now() < x.authorizationValidUntil, 'AUTHORIZATION_WINDOW_EXPIRED');
    x.ledger.active = null; x.ledger.consumed_release_ids.push(...x.releases);
    x.ledger.predecessor_sha256 = x.siteHash; x.ledger.fencing_token += 1;
    x.ledger.last_deployment = outcome;
    atomicWrite(authority, 'ledger.json', x.ledger);
    return { status: 'DEPLOYED_VERIFIED_AND_CONSUMED', deployment_id: outcome.deployment_id, site_manifest_sha256: x.siteHash };
  } catch (error) {
    if (lease && x) {
      // Never overwrite another process's ledger on failed CAS; preserve the reservation for reconciliation.
      const current = parse(bytes(authority, 'ledger.json'));
      if (current.active?.lease === lease) {
        current.active.status = 'quarantined'; current.active.reason = error.message;
        atomicWrite(authority, 'ledger.json', current);
      }
    }
    throw error;
  } finally { fs.rmdirSync(lock); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    need(process.argv[2] === 'preflight' && process.argv.length === 5, 'USAGE: preflight PACKAGE_ROOT CHECKOUT_ROOT');
    need(process.env.ATLAS_PRODUCTION_AUTHORITY_ROOT, 'MISSING_PRODUCTION_AUTHORITY_ENROLLMENT');
    need(process.env.GITHUB_SHA, 'MISSING_TRUSTED_SOURCE_COMMIT');
    process.stdout.write(JSON.stringify(preflight({ packageRoot: path.resolve(process.argv[3]), checkoutRoot: path.resolve(process.argv[4]),
      authorityRoot: process.env.ATLAS_PRODUCTION_AUTHORITY_ROOT, expectedCommit: process.env.GITHUB_SHA })) + '\n');
  } catch (e) { process.stderr.write(JSON.stringify({ status: 'BLOCKED', publication_authorized: false, reason: e.message }) + '\n'); process.exitCode = 1; }
}
