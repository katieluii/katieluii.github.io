import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateKeyPairSync, sign } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { CODES, preflight, deployWithAuthorization } from '../atlas-release-boundary.mjs';
import { documentBytes, sha256 } from '../atlas-release-authorization.mjs';

// TEST ONLY: all keys/principals are ephemeral synthetic fixture identities.
function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-boundary-test-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const pkg = path.join(root, 'package'), checkout = path.join(root, 'checkout'), authority = path.join(root, 'authority');
  for (const dir of [pkg, checkout, authority, path.join(pkg, 'site'), path.join(pkg, 'rollback')]) fs.mkdirSync(dir);
  const write = (dir, file, value) => fs.writeFileSync(path.join(dir, file), documentBytes(value));
  const read = (dir, file) => JSON.parse(fs.readFileSync(path.join(dir, file)));
  const git = args => execFileSync('git', ['-C', checkout, ...args], { encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git(['init', '-q']); fs.writeFileSync(path.join(checkout, 'source.txt'), 'Synthetic fixture only\n');
  git(['add', 'source.txt']); git(['-c', 'user.name=Synthetic Test', '-c', 'user.email=synthetic@example.invalid', 'commit', '-qm', 'test fixture']);
  const commit = git(['rev-parse', 'HEAD']);
  const keys = [generateKeyPairSync('ed25519'), generateKeyPairSync('ed25519')], authorityKey = generateKeyPairSync('ed25519');
  const now = new Date(), start = new Date(now.getTime() - 60000).toISOString(), end = new Date(now.getTime() + 3600000).toISOString();
  const envelope = (value, key, domain) => {
    const payload = documentBytes(value);
    return { payload_base64: payload.toString('base64'), signature: sign(null, Buffer.concat([Buffer.from(domain), payload]), key).toString('base64') };
  };
  fs.writeFileSync(path.join(authority, 'authority-public-key.pem'), authorityKey.publicKey.export({ format: 'pem', type: 'spki' }));
  const kinds = ['site-manifest', 'qualification', 'rollback-manifest'];
  const policy = { schema_version: 1, expires_at: end, max_approval_age_seconds: 3600, required_artifact_kinds: kinds,
    distinct_principals: true, signers: keys.map((k, i) => ({ key_id: `test-key-${i}`, principal_id: `synthetic-principal-${i}`,
      roles: [i ? 'operational' : 'clinical'], indications: CODES, targets: ['synthetic-target'],
      public_key_pem: k.publicKey.export({ type: 'spki', format: 'pem' }), not_before: start, expires_at: end })) };
  write(authority, 'signer-policy.json', policy);
  const ledger = { version: 1, target: 'synthetic-target', predecessor_sha256: null, fencing_token: 1, consumed_release_ids: [], active: null };
  write(authority, 'ledger.json', ledger);
  const trusted = { now: now.toISOString(), valid_until: end, policy_sha256: sha256(documentBytes(policy)), target: ledger.target,
    predecessor_sha256: null, qualification_epoch: 1, evidence_watermark: 'e'.repeat(64), fencing_token: 1,
    revoked_release_ids: [], revoked_approval_ids: [], consumed_release_ids: [], revoked_key_ids: [] };
  fs.writeFileSync(path.join(pkg, 'site', 'index.html'), 'synthetic qualified site');
  fs.writeFileSync(path.join(pkg, 'rollback', 'index.html'), 'synthetic unpublished fallback');
  const site = { schema_version: 1, source_commit: commit, indications: CODES, files: [{ path: 'index.html', sha256: sha256(Buffer.from('synthetic qualified site')) }] };
  const rollback = { schema_version: 1, mode: 'safe-unpublished', indications: [], reader_compatible: true,
    files: [{ path: 'index.html', sha256: sha256(Buffer.from('synthetic unpublished fallback')) }] };
  write(pkg, 'site-manifest.json', site); write(pkg, 'rollback-manifest.json', rollback);
  const qualification = { schema_version: 1, source_commit: commit, site_manifest_sha256: sha256(documentBytes(site)),
    rollback_manifest_sha256: sha256(documentBytes(rollback)), status: 'PASS', full_detail: ['mm', 'nsclc', 'obesity'], previews: ['breast', 'parkinsons', 'urothelial'],
    checks: Object.fromEntries(['evidence', 'public_private', 'rendered_routes', 'source_links', 'exact_assets', 'rollback_compatibility'].map(k => [k, true])) };
  write(pkg, 'qualification.json', qualification);
  const state = { schema_version: 1, source_commit: commit, issued_at: start, trusted, ledger_sha256: sha256(documentBytes(ledger)),
    site_manifest_sha256: sha256(documentBytes(site)), qualification_sha256: sha256(documentBytes(qualification)), rollback_manifest_sha256: sha256(documentBytes(rollback)) };
  const signState = () => write(authority, 'production-state.json', envelope(state, authorityKey.privateKey, 'atlas-production-state-v1\n'));
  signState();
  const release = { schema_version: 1, release_id: 'synthetic-release', source_commit: commit, indications: {} };
  for (const code of CODES) {
    const manifest = { schema_version: 1, release_id: `synthetic-${code}`, indication: code, target: trusted.target,
      predecessor_sha256: null, policy_sha256: trusted.policy_sha256, qualification_epoch: 1, evidence_watermark: trusted.evidence_watermark,
      fencing_token: 1, created_at: start, expires_at: end, artifacts: kinds.map(kind => ({ kind, path: `${kind}.json`, sha256: sha256(fs.readFileSync(path.join(pkg, `${kind}.json`))) })) };
    const manifestName = `${code}.manifest.json`; write(pkg, manifestName, manifest);
    const approvals = keys.map((k, i) => {
      const name = `${code}.${i}.approval.json`;
      write(pkg, name, envelope({ schema_version: 1, approval_id: `synthetic-${code}-${i}`, manifest_sha256: sha256(documentBytes(manifest)),
        key_id: `test-key-${i}`, role: i ? 'operational' : 'clinical', issued_at: start, expires_at: end }, k.privateKey, 'atlas-release-approval-v1\n'));
      return name;
    });
    release.indications[code] = { manifest: manifestName, approvals };
  }
  write(pkg, 'release.json', release);
  const options = { packageRoot: pkg, checkoutRoot: checkout, authorityRoot: authority, expectedCommit: commit };
  const outcome = snapshot => envelope({ lease: snapshot.lease, source_commit: snapshot.source_commit,
    site_manifest_sha256: snapshot.site_manifest_sha256, status: 'VERIFIED_LIVE', deployment_id: 'synthetic-deployment', verified_at: new Date().toISOString() },
    authorityKey.privateKey, 'atlas-deployment-outcome-v1\n');
  const shortenApprovalWindow = milliseconds => {
    const expiry = new Date(Date.now() + milliseconds).toISOString();
    for (const code of CODES) for (const [i, key] of keys.entries()) {
      const name = `${code}.${i}.approval.json`;
      const value = JSON.parse(Buffer.from(read(pkg, name).payload_base64, 'base64'));
      value.expires_at = expiry;
      write(pkg, name, envelope(value, key.privateKey, 'atlas-release-approval-v1\n'));
    }
    return Date.parse(expiry);
  };
  return { options, pkg, checkout, authority, state, signState, write, read, outcome, shortenApprovalWindow };
}

test('preflight verifies 12 signatures read-only; never grants deployment', t => {
  const f = fixture(t), before = fs.readFileSync(path.join(f.authority, 'ledger.json'));
  const result = preflight(f.options);
  assert.equal(result.verified_role_signatures, 12); assert.equal(result.publication_authorized, false);
  assert.deepEqual(fs.readFileSync(path.join(f.authority, 'ledger.json')), before);
  assert.equal(fs.existsSync(path.join(f.authority, '.release-lock')), false);
});
test('missing or forged per-indication signature fails', t => {
  const f = fixture(t), p = 'obesity.0.approval.json', e = f.read(f.pkg, p);
  e.signature = Buffer.alloc(64).toString('base64'); f.write(f.pkg, p, e);
  assert.throws(() => preflight(f.options), /SIGNATURE_INVALID/);
});
test('whole site extra file and altered rollback bytes fail', t => {
  const f = fixture(t); fs.writeFileSync(path.join(f.pkg, 'site', 'private.json'), 'private');
  assert.throws(() => preflight(f.options), /ARTIFACT_INVENTORY_MISMATCH/);
  fs.unlinkSync(path.join(f.pkg, 'site', 'private.json'));
  fs.writeFileSync(path.join(f.pkg, 'rollback', 'index.html'), 'unsafe changed');
  assert.throws(() => preflight(f.options), /ARTIFACT_BYTES_MISMATCH/);
});
test('candidate cannot substitute signer policy or trusted production state', t => {
  const f = fixture(t), p = f.read(f.authority, 'signer-policy.json'); p.distinct_principals = false;
  f.write(f.authority, 'signer-policy.json', p); assert.throws(() => preflight(f.options), /UNTRUSTED_POLICY/);
  const e = f.read(f.authority, 'production-state.json'); e.signature = Buffer.alloc(64).toString('base64');
  f.write(f.authority, 'production-state.json', e); assert.throws(() => preflight(f.options), /AUTHORITY_SIGNATURE_INVALID/);
});
test('scope, checkout commit and untracked bytes must match', t => {
  const f = fixture(t), r = f.read(f.pkg, 'release.json'); delete r.indications.nsclc; f.write(f.pkg, 'release.json', r);
  assert.throws(() => preflight(f.options), /EXACT_SIX_REQUIRED/);
  assert.throws(() => preflight({ ...f.options, expectedCommit: '0'.repeat(40) }), /SOURCE_COMMIT_MISMATCH/);
  fs.writeFileSync(path.join(f.checkout, 'untracked'), 'dirty'); assert.throws(() => preflight(f.options), /SOURCE_CHECKOUT_DIRTY/);
});
test('stale ledger and candidate-contained authority fail', t => {
  const f = fixture(t), l = f.read(f.authority, 'ledger.json'); l.fencing_token = 2; f.write(f.authority, 'ledger.json', l);
  assert.throws(() => preflight(f.options), /LEDGER_STATE_STALE/);
  assert.throws(() => preflight({ ...f.options, authorityRoot: f.pkg }), /CANDIDATE_CANNOT_SUPPLY_AUTHORITY/);
});
test('deployment uses immutable checked bytes; consumes only signed live outcome', async t => {
  const f = fixture(t);
  const result = await deployWithAuthorization(f.options, async snapshot => {
    assert.equal(f.read(f.authority, 'ledger.json').active.status, 'reserved');
    fs.writeFileSync(path.join(f.pkg, 'site', 'index.html'), 'mutation after snapshot');
    assert.equal(Buffer.from(snapshot.files[0].base64, 'base64').toString(), 'synthetic qualified site');
    assert.throws(() => { snapshot.files[0].base64 = ''; }, TypeError);
    return f.outcome(snapshot);
  });
  assert.equal(result.status, 'DEPLOYED_VERIFIED_AND_CONSUMED');
  const l = f.read(f.authority, 'ledger.json'); assert.equal(l.active, null); assert.equal(l.consumed_release_ids.length, 6);
  assert.equal(l.fencing_token, 2); assert.throws(() => preflight(f.options), /LEDGER_STATE_STALE/);
});
test('unknown upload failure quarantines reservation and blocks retry', async t => {
  const f = fixture(t); await assert.rejects(deployWithAuthorization(f.options, async () => { throw new Error('provider outcome unknown'); }), /provider outcome unknown/);
  assert.equal(f.read(f.authority, 'ledger.json').active.status, 'quarantined');
  await assert.rejects(deployWithAuthorization(f.options, async () => assert.fail('must not upload')), /LEDGER_STATE_STALE/);
});
test('unsigned live-success claims quarantine rather than consume', async t => {
  const f = fixture(t); await assert.rejects(deployWithAuthorization(f.options, async () => ({ status: 'VERIFIED_LIVE' })), /SIGNED_ENVELOPE_REQUIRED/);
  const l = f.read(f.authority, 'ledger.json'); assert.equal(l.active.status, 'quarantined'); assert.deepEqual(l.consumed_release_ids, []);
});
test('concurrent lock refuses upload; stale lock is never silently removed', async t => {
  const f = fixture(t); fs.mkdirSync(path.join(f.authority, '.release-lock'));
  await assert.rejects(deployWithAuthorization(f.options, async () => assert.fail('must not upload')), /EEXIST/);
  assert.equal(fs.existsSync(path.join(f.authority, '.release-lock')), true);
});
test('authority changes during upload quarantine even with signed outcome', async t => {
  const f = fixture(t); await assert.rejects(deployWithAuthorization(f.options, async snapshot => {
    f.state.trusted.fencing_token = 2; f.signState(); return f.outcome(snapshot);
  }), /TRUSTED_STATE_CHANGED_OR_EXPIRED/);
  assert.equal(f.read(f.authority, 'ledger.json').active.status, 'quarantined');
});
test('timeout quarantines uncertain provider outcome', async t => {
  const f = fixture(t); await assert.rejects(deployWithAuthorization({ ...f.options, timeoutMs: 5 }, () => new Promise(() => {})), /UPLOAD_OUTCOME_TIMEOUT/);
  assert.equal(f.read(f.authority, 'ledger.json').active.status, 'quarantined');
});

test('approval expiry during upload quarantines even while production state remains valid', async t => {
  const f = fixture(t), expiry = f.shortenApprovalWindow(300);
  await assert.rejects(deployWithAuthorization(f.options, async snapshot => {
    await new Promise(resolve => setTimeout(resolve, Math.max(0, expiry - Date.now()) + 20));
    assert.ok(Date.now() < Date.parse(f.state.trusted.valid_until));
    return f.outcome(snapshot);
  }), /AUTHORIZATION_WINDOW_EXPIRED/);
  const ledger = f.read(f.authority, 'ledger.json');
  assert.equal(ledger.active.status, 'quarantined');
  assert.deepEqual(ledger.consumed_release_ids, []);
});

test('state revocation queued after reservation prevents upload side effect', async t => {
  const f = fixture(t); let invoked = false;
  queueMicrotask(() => { f.state.trusted.revoked_release_ids.push('synthetic-obesity'); f.signState(); });
  await assert.rejects(deployWithAuthorization(f.options, async snapshot => { invoked = true; return f.outcome(snapshot); }), /TRUSTED_STATE_CHANGED_OR_EXPIRED/);
  assert.equal(invoked, false);
  assert.equal(f.read(f.authority, 'ledger.json').active.status, 'quarantined');
});

test('reserved ledger mutation queued before upload prevents side effect', async t => {
  const f = fixture(t); let invoked = false;
  queueMicrotask(() => { const ledger = f.read(f.authority, 'ledger.json'); ledger.fencing_token += 1; f.write(f.authority, 'ledger.json', ledger); });
  await assert.rejects(deployWithAuthorization(f.options, async snapshot => { invoked = true; return f.outcome(snapshot); }), /LEDGER_UPLOAD_CAS_FAILED/);
  assert.equal(invoked, false);
  const ledger = f.read(f.authority, 'ledger.json');
  assert.equal(ledger.active.status, 'quarantined');
  assert.equal(ledger.fencing_token, 2);
});
