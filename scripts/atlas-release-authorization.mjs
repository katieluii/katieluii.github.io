import { createHash, createPublicKey, verify } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// This module has no signing, approval recording, publication or deployment API.
const ROLES = ['clinical', 'operational'];
const DOMAIN = 'atlas-release-approval-v1\n';
const HASH = /^[a-f0-9]{64}$/;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;
const MAX_DOCUMENT = 1024 * 1024;
const MAX_ARTIFACT = 100 * 1024 * 1024;

export class AuthorizationError extends Error {
  constructor(code) {
    super(code);
    this.name = 'AuthorizationError';
    this.code = code;
  }
}

function requireCondition(condition, code) {
  if (!condition) throw new AuthorizationError(code);
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function documentBytes(value) {
  return Buffer.from(`${canonical(value)}\n`, 'utf8');
}

function readDocument(bytes) {
  requireCondition(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_DOCUMENT, 'DOCUMENT_SIZE');
  let value;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new AuthorizationError('INVALID_JSON');
  }
  const pending = [[value, 0]];
  while (pending.length) {
    const [item, depth] = pending.pop();
    requireCondition(depth <= 32, 'DOCUMENT_DEPTH');
    if (item !== null && typeof item === 'object') {
      for (const child of Object.values(item)) pending.push([child, depth + 1]);
    }
  }
  // Exact canonical bytes exclude duplicate keys, ambiguous encodings and lossy numbers.
  requireCondition(documentBytes(value).equals(bytes), 'NONCANONICAL_JSON');
  return value;
}

function fields(value, keys, code) {
  requireCondition(value !== null && typeof value === 'object' && !Array.isArray(value), code);
  requireCondition(Object.keys(value).sort().join('|') === [...keys].sort().join('|'), code);
}

function timestamp(value) {
  requireCondition(typeof value === 'string', 'INVALID_TIME');
  const parsed = Date.parse(value);
  requireCondition(Number.isFinite(parsed) && new Date(parsed).toISOString() === value, 'INVALID_TIME');
  return parsed;
}

function identifier(value) {
  requireCondition(typeof value === 'string' && ID.test(value), 'INVALID_ID');
}

function digest(value) {
  requireCondition(typeof value === 'string' && HASH.test(value), 'INVALID_DIGEST');
}

function counter(value) {
  requireCondition(Number.isSafeInteger(value) && value >= 1, 'INVALID_COUNTER');
}

function uniqueStrings(value, code, allowEmpty = false) {
  requireCondition(Array.isArray(value) && (allowEmpty || value.length > 0)
    && value.every(item => typeof item === 'string' && item.length > 0)
    && new Set(value).size === value.length, code);
}

function artifactBytes(root, reference, remaining) {
  fields(reference, ['kind', 'path', 'sha256'], 'ARTIFACT_SCHEMA');
  identifier(reference.kind);
  digest(reference.sha256);
  const relative = reference.path;
  requireCondition(typeof relative === 'string' && relative.length <= 1024
    && !relative.includes('\\') && !relative.includes('\0') && !path.isAbsolute(relative)
    && relative.split('/').every(part => part.length > 0 && part !== '.' && part !== '..'), 'ARTIFACT_PATH');
  let current = root;
  const parts = relative.split('/');
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const stat = fs.lstatSync(current);
    requireCondition(!stat.isSymbolicLink(), 'ARTIFACT_SYMLINK');
    requireCondition(index === parts.length - 1 ? stat.isFile() : stat.isDirectory(), 'ARTIFACT_TYPE');
  }
  const fd = fs.openSync(current, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    requireCondition(stat.isFile() && stat.size <= remaining, 'ARTIFACT_SIZE');
    const bytes = fs.readFileSync(fd);
    requireCondition(bytes.length <= remaining && sha256(bytes) === reference.sha256, 'ARTIFACT_DIGEST');
    return { ...reference, bytes };
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Verify authorization bindings in a caller-controlled, non-concurrently-mutated snapshot.
 * `trusted` MUST come from the deployment authority, never from the candidate package.
 * It is not a lease: the deployment adapter must recheck/CAS/consume at the side effect.
 * Evidence qualification and semantic gate results must be verified separately.
 */
export function verifyAuthorization({ manifestBytes, policyBytes, approvals, artifactRoot, trusted }) {
  fields(trusted, ['now', 'valid_until', 'policy_sha256', 'target', 'predecessor_sha256',
    'qualification_epoch', 'evidence_watermark', 'fencing_token', 'revoked_release_ids',
    'revoked_approval_ids', 'consumed_release_ids', 'revoked_key_ids'], 'TRUSTED_STATE_SCHEMA');
  const now = timestamp(trusted.now);
  requireCondition(now < timestamp(trusted.valid_until), 'TRUSTED_STATE_EXPIRED');
  digest(trusted.policy_sha256);
  digest(trusted.evidence_watermark);
  if (trusted.predecessor_sha256 !== null) digest(trusted.predecessor_sha256);
  identifier(trusted.target);
  counter(trusted.qualification_epoch);
  counter(trusted.fencing_token);
  for (const field of ['revoked_release_ids', 'revoked_approval_ids', 'consumed_release_ids', 'revoked_key_ids']) {
    uniqueStrings(trusted[field], 'TRUSTED_REVOCATION_SCHEMA', true);
  }
  requireCondition(Buffer.isBuffer(policyBytes) && policyBytes.length > 0
    && policyBytes.length <= MAX_DOCUMENT, 'DOCUMENT_SIZE');
  requireCondition(sha256(policyBytes) === trusted.policy_sha256, 'UNTRUSTED_POLICY');
  const policy = readDocument(policyBytes);
  fields(policy, ['schema_version', 'expires_at', 'max_approval_age_seconds',
    'required_artifact_kinds', 'distinct_principals', 'signers'], 'POLICY_SCHEMA');
  requireCondition(policy.schema_version === 1 && typeof policy.distinct_principals === 'boolean', 'POLICY_SCHEMA');
  counter(policy.max_approval_age_seconds);
  uniqueStrings(policy.required_artifact_kinds, 'REQUIRED_ARTIFACT_KINDS');
  requireCondition(now < timestamp(policy.expires_at), 'POLICY_EXPIRED');
  requireCondition(Array.isArray(policy.signers) && policy.signers.length > 0, 'SIGNER_POLICY');
  const keys = new Map();
  for (const signer of policy.signers) {
    fields(signer, ['key_id', 'principal_id', 'roles', 'indications', 'targets',
      'public_key_pem', 'not_before', 'expires_at'], 'SIGNER_SCHEMA');
    identifier(signer.key_id);
    identifier(signer.principal_id);
    requireCondition(!keys.has(signer.key_id), 'DUPLICATE_KEY');
    for (const field of ['roles', 'indications', 'targets']) uniqueStrings(signer[field], 'SIGNER_SCOPE');
    requireCondition(signer.roles.every(role => ROLES.includes(role)), 'SIGNER_ROLE');
    requireCondition(timestamp(signer.not_before) < timestamp(signer.expires_at), 'SIGNER_WINDOW');
    requireCondition(typeof signer.public_key_pem === 'string'
      && signer.public_key_pem.startsWith('-----BEGIN PUBLIC KEY-----\n'), 'SIGNER_KEY');
    let key;
    try { key = createPublicKey(signer.public_key_pem); } catch { throw new AuthorizationError('SIGNER_KEY'); }
    requireCondition(key.asymmetricKeyType === 'ed25519', 'SIGNER_ALGORITHM');
    keys.set(signer.key_id, { ...signer, key });
  }

  const manifest = readDocument(manifestBytes);
  const manifestSha = sha256(manifestBytes);
  fields(manifest, ['schema_version', 'release_id', 'indication', 'target', 'predecessor_sha256',
    'policy_sha256', 'qualification_epoch', 'evidence_watermark', 'fencing_token',
    'created_at', 'expires_at', 'artifacts'], 'MANIFEST_SCHEMA');
  requireCondition(manifest.schema_version === 1, 'MANIFEST_SCHEMA');
  identifier(manifest.release_id);
  identifier(manifest.indication);
  const created = timestamp(manifest.created_at);
  const expiry = timestamp(manifest.expires_at);
  requireCondition(created <= now && now < expiry && expiry <= timestamp(policy.expires_at), 'MANIFEST_WINDOW');
  for (const field of ['target', 'predecessor_sha256', 'policy_sha256', 'qualification_epoch', 'evidence_watermark', 'fencing_token']) {
    requireCondition(manifest[field] === trusted[field], `STATE_MISMATCH_${field.toUpperCase()}`);
  }
  requireCondition(!trusted.revoked_release_ids.includes(manifest.release_id), 'RELEASE_REVOKED');
  requireCondition(!trusted.consumed_release_ids.includes(manifest.release_id), 'RELEASE_CONSUMED');

  requireCondition(Array.isArray(approvals) && approvals.length === ROLES.length, 'APPROVAL_COUNT');
  const seenRoles = new Set();
  const seenIds = new Set();
  const principals = new Set();
  for (const envelope of approvals) {
    fields(envelope, ['payload', 'signature'], 'APPROVAL_ENVELOPE');
    requireCondition(Buffer.isBuffer(envelope.payload) && envelope.payload.length <= 16384, 'APPROVAL_SIZE');
    const approval = readDocument(envelope.payload);
    fields(approval, ['schema_version', 'approval_id', 'manifest_sha256', 'key_id', 'role',
      'issued_at', 'expires_at'], 'APPROVAL_SCHEMA');
    requireCondition(approval.schema_version === 1, 'APPROVAL_SCHEMA');
    identifier(approval.approval_id);
    identifier(approval.key_id);
    requireCondition(!seenIds.has(approval.approval_id), 'DUPLICATE_APPROVAL');
    seenIds.add(approval.approval_id);
    requireCondition(ROLES.includes(approval.role) && !seenRoles.has(approval.role), 'APPROVAL_ROLE');
    seenRoles.add(approval.role);
    requireCondition(approval.manifest_sha256 === manifestSha, 'APPROVAL_MANIFEST');
    const signer = keys.get(approval.key_id);
    requireCondition(signer !== undefined && !trusted.revoked_key_ids.includes(approval.key_id), 'KEY_UNAUTHORIZED');
    requireCondition(!trusted.revoked_approval_ids.includes(approval.approval_id), 'APPROVAL_REVOKED');
    requireCondition(signer.roles.includes(approval.role) && signer.indications.includes(manifest.indication)
      && signer.targets.includes(manifest.target), 'SIGNER_UNAUTHORIZED_SCOPE');
    const issued = timestamp(approval.issued_at);
    const approvalExpiry = timestamp(approval.expires_at);
    requireCondition(created <= issued && issued <= now && now < approvalExpiry && approvalExpiry <= expiry
      && now - issued <= policy.max_approval_age_seconds * 1000, 'APPROVAL_WINDOW');
    requireCondition(timestamp(signer.not_before) <= issued && approvalExpiry <= timestamp(signer.expires_at), 'SIGNER_WINDOW');
    requireCondition(typeof envelope.signature === 'string' && /^[A-Za-z0-9+/]{86}==$/.test(envelope.signature), 'SIGNATURE_ENCODING');
    const signature = Buffer.from(envelope.signature, 'base64');
    requireCondition(signature.toString('base64') === envelope.signature
      && verify(null, Buffer.concat([Buffer.from(DOMAIN), envelope.payload]), signer.key, signature), 'SIGNATURE_INVALID');
    principals.add(signer.principal_id);
  }
  requireCondition(!policy.distinct_principals || principals.size === ROLES.length, 'PRINCIPAL_SEPARATION');

  requireCondition(Array.isArray(manifest.artifacts) && manifest.artifacts.length > 0
    && manifest.artifacts.length <= 512, 'ARTIFACT_COUNT');
  uniqueStrings(manifest.artifacts.map(item => item?.kind), 'DUPLICATE_ARTIFACT_KIND');
  uniqueStrings(manifest.artifacts.map(item => item?.path), 'DUPLICATE_ARTIFACT_PATH');
  requireCondition(policy.required_artifact_kinds.every(kind => manifest.artifacts.some(item => item.kind === kind)), 'ARTIFACT_REQUIRED');
  let artifacts;
  try {
    requireCondition(typeof artifactRoot === 'string' && fs.lstatSync(artifactRoot).isDirectory()
      && !fs.lstatSync(artifactRoot).isSymbolicLink(), 'ARTIFACT_ROOT');
    const root = fs.realpathSync(artifactRoot);
    let remaining = MAX_ARTIFACT;
    artifacts = manifest.artifacts.map(reference => {
      const artifact = artifactBytes(root, reference, remaining);
      remaining -= artifact.bytes.length;
      return artifact;
    });
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'ELOOP', 'EACCES', 'EPERM', 'ENAMETOOLONG',
      'EIO', 'ESTALE', 'EMFILE', 'ENFILE'].includes(error.code)) {
      throw new AuthorizationError('ARTIFACT_UNREADABLE');
    }
    throw error;
  }
  return {
    status: 'AUTHORIZATION_BINDINGS_VALID',
    publication_authorized: false,
    manifest_sha256: manifestSha,
    policy_sha256: trusted.policy_sha256,
    trusted_state_sha256: sha256(documentBytes(trusted)),
    release_id: manifest.release_id,
    indication: manifest.indication,
    artifacts,
  };
}
