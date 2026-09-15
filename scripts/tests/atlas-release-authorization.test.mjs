import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { documentBytes, sha256, verifyAuthorization } from '../atlas-release-authorization.mjs';

const NOW = '2026-09-15T10:00:00.000Z';
const START = '2026-09-15T09:00:00.000Z';
const END = '2026-09-15T11:00:00.000Z';
const KEYS = [generateKeyPairSync('ed25519'), generateKeyPairSync('ed25519')];

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-authorization-test-'));
  t.after(() => fs.rmSync(root, { recursive: true }));
  const bundle = Buffer.from('synthetic bundle; not clinical content\n');
  fs.writeFileSync(path.join(root, 'bundle.txt'), bundle);
  fs.writeFileSync(path.join(root, 'rollback.txt'), 'synthetic prior bundle\n');
  const policy = {
    schema_version: 1, expires_at: '2026-09-16T00:00:00.000Z',
    max_approval_age_seconds: 7200, required_artifact_kinds: ['bundle', 'rollback_bundle'],
    distinct_principals: true,
    signers: ['clinical', 'operational'].map((role, index) => ({
      key_id: `${role}-key`, principal_id: `${role}-reviewer`, roles: [role],
      indications: ['parkinsons'], targets: ['synthetic-pages'],
      public_key_pem: KEYS[index].publicKey.export({ type: 'spki', format: 'pem' }),
      not_before: START, expires_at: '2026-09-16T00:00:00.000Z',
    })),
  };
  const trusted = {
    now: NOW, valid_until: END, policy_sha256: sha256(documentBytes(policy)),
    target: 'synthetic-pages', predecessor_sha256: sha256(Buffer.from('previous manifest')),
    qualification_epoch: 1, evidence_watermark: sha256(Buffer.from('evidence cut')),
    fencing_token: 1, revoked_release_ids: [], revoked_approval_ids: [],
    consumed_release_ids: [], revoked_key_ids: [],
  };
  const manifest = {
    schema_version: 1, release_id: 'synthetic-release-1', indication: 'parkinsons',
    target: trusted.target, predecessor_sha256: trusted.predecessor_sha256,
    policy_sha256: trusted.policy_sha256, qualification_epoch: 1,
    evidence_watermark: trusted.evidence_watermark, fencing_token: 1,
    created_at: START, expires_at: END,
    artifacts: ['bundle', 'rollback_bundle'].map((kind, index) => ({
      kind, path: index === 0 ? 'bundle.txt' : 'rollback.txt',
      sha256: sha256(fs.readFileSync(path.join(root, index === 0 ? 'bundle.txt' : 'rollback.txt'))),
    })),
  };
  function approvals(bytes = documentBytes(manifest), mutate = () => {}) {
    return ['clinical', 'operational'].map((role, index) => {
      const approval = {
        schema_version: 1, approval_id: `${role}-approval`, manifest_sha256: sha256(bytes),
        key_id: `${role}-key`, role, issued_at: START, expires_at: END,
      };
      mutate(approval, index);
      const payload = documentBytes(approval);
      return { payload, signature: sign(null, Buffer.concat([Buffer.from('atlas-release-approval-v1\n'), payload]), KEYS[index].privateKey).toString('base64') };
    });
  }
  function input() {
    return { manifestBytes: documentBytes(manifest), policyBytes: documentBytes(policy),
      approvals: approvals(), artifactRoot: root, trusted };
  }
  return { root, bundle, policy, trusted, manifest, approvals, input };
}

function rejects(input, code) {
  assert.throws(() => verifyAuthorization(input), error => error.code === code);
}

test('valid separate role bindings return checked bytes without granting publication', t => {
  const f = fixture(t);
  const before = fs.readdirSync(f.root);
  const result = verifyAuthorization(f.input());
  assert.equal(result.status, 'AUTHORIZATION_BINDINGS_VALID');
  assert.equal(result.publication_authorized, false);
  assert.equal(result.manifest_sha256, sha256(documentBytes(f.manifest)));
  assert.deepEqual(result.artifacts[0].bytes, f.bundle);
  fs.writeFileSync(path.join(f.root, 'bundle.txt'), 'later change');
  assert.deepEqual(result.artifacts[0].bytes, f.bundle);
  assert.deepEqual(fs.readdirSync(f.root), before);
  assert.deepEqual(f.trusted.consumed_release_ids, []);
});

test('manifest byte changes invalidate old signatures', t => {
  const f = fixture(t);
  const input = f.input();
  f.manifest.release_id = 'different-release';
  input.manifestBytes = documentBytes(f.manifest);
  rejects(input, 'APPROVAL_MANIFEST');
});

test('policy substitution cannot replace independently pinned authority', t => {
  const f = fixture(t);
  f.policy.distinct_principals = false;
  rejects(f.input(), 'UNTRUSTED_POLICY');
});

for (const [field, value] of [
  ['target', 'other-target'], ['predecessor_sha256', 'a'.repeat(64)],
  ['qualification_epoch', 2], ['evidence_watermark', 'b'.repeat(64)], ['fencing_token', 2],
]) {
  test(`changed authoritative ${field} rejects signed candidate`, t => {
    const f = fixture(t);
    f.trusted[field] = value;
    rejects(f.input(), `STATE_MISMATCH_${field.toUpperCase()}`);
  });
}

for (const [field, value, code] of [
  ['revoked_release_ids', 'synthetic-release-1', 'RELEASE_REVOKED'],
  ['consumed_release_ids', 'synthetic-release-1', 'RELEASE_CONSUMED'],
  ['revoked_approval_ids', 'clinical-approval', 'APPROVAL_REVOKED'],
  ['revoked_key_ids', 'clinical-key', 'KEY_UNAUTHORIZED'],
]) {
  test(`${field} fails closed`, t => {
    const f = fixture(t);
    f.trusted[field].push(value);
    rejects(f.input(), code);
  });
}

test('missing authoritative state cannot default from the manifest', t => {
  const f = fixture(t);
  delete f.trusted.revoked_release_ids;
  rejects(f.input(), 'TRUSTED_STATE_SCHEMA');
});

test('expired trusted snapshot fails at the exact boundary', t => {
  const f = fixture(t);
  f.trusted.valid_until = NOW;
  rejects(f.input(), 'TRUSTED_STATE_EXPIRED');
});

test('wrong indication rejects otherwise valid signatures', t => {
  const f = fixture(t);
  f.manifest.indication = 'breast';
  rejects(f.input(), 'SIGNER_UNAUTHORIZED_SCOPE');
});

test('one role cannot substitute for the two required approvals', t => {
  const f = fixture(t);
  const input = f.input();
  input.approvals = f.approvals(undefined, (a, i) => { if (i === 1) a.role = 'clinical'; });
  rejects(input, 'APPROVAL_ROLE');
});

test('duplicate envelope cannot count twice', t => {
  const f = fixture(t);
  const input = f.input();
  input.approvals[1] = input.approvals[0];
  rejects(input, 'DUPLICATE_APPROVAL');
});

test('missing approval envelope fails', t => {
  const f = fixture(t);
  const input = f.input();
  input.approvals.pop();
  rejects(input, 'APPROVAL_COUNT');
});

test('missing or empty signature fails with both envelopes present', t => {
  const f = fixture(t);
  const input = f.input();
  delete input.approvals[0].signature;
  rejects(input, 'APPROVAL_ENVELOPE');
  input.approvals[0].signature = '';
  rejects(input, 'SIGNATURE_ENCODING');
});

test('tampered signature fails', t => {
  const f = fixture(t);
  const input = f.input();
  input.approvals[0].signature = Buffer.alloc(64).toString('base64');
  rejects(input, 'SIGNATURE_INVALID');
});

for (const [label, edit, code] of [
  ['expired', a => { a.expires_at = NOW; }, 'APPROVAL_WINDOW'],
  ['future-issued', a => { a.issued_at = END; }, 'APPROVAL_WINDOW'],
  ['wrong key', a => { a.key_id = 'missing'; }, 'KEY_UNAUTHORIZED'],
]) {
  test(`${label} approval fails`, t => {
    const f = fixture(t);
    const input = f.input();
    input.approvals = f.approvals(undefined, edit);
    rejects(input, code);
  });
}

test('policy principal separation is explicit and enforced', t => {
  const f = fixture(t);
  f.policy.signers[1].principal_id = f.policy.signers[0].principal_id;
  f.trusted.policy_sha256 = f.manifest.policy_sha256 = sha256(documentBytes(f.policy));
  rejects(f.input(), 'PRINCIPAL_SEPARATION');
});

test('malformed and duplicate-key JSON fail closed', t => {
  const f = fixture(t);
  for (const bytes of [Buffer.from('{"x":1,"x":2}\n'), Buffer.from('{"x":1e999}\n')]) {
    rejects({ ...f.input(), manifestBytes: bytes }, 'NONCANONICAL_JSON');
  }
  rejects({ ...f.input(), manifestBytes: Buffer.from([0xff]) }, 'INVALID_JSON');
});

test('safe integer and schema constraints reject malformed caller state', t => {
  const f = fixture(t);
  for (const value of [0, -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    f.trusted.fencing_token = value;
    rejects(f.input(), 'INVALID_COUNTER');
  }
});

test('altered artifact bytes and digest fail', t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.root, 'bundle.txt'), 'tampered');
  rejects(f.input(), 'ARTIFACT_DIGEST');
});

test('missing mandatory rollback bytes fail', t => {
  const f = fixture(t);
  f.manifest.artifacts.pop();
  rejects(f.input(), 'ARTIFACT_REQUIRED');
});

test('duplicate artifact paths and kinds fail', t => {
  const f = fixture(t);
  f.manifest.artifacts[1].path = 'bundle.txt';
  rejects(f.input(), 'DUPLICATE_ARTIFACT_PATH');
  f.manifest.artifacts[1].kind = 'bundle';
  rejects(f.input(), 'DUPLICATE_ARTIFACT_KIND');
});

for (const unsafe of ['../bundle.txt', '/tmp/bundle.txt', './bundle.txt', 'sub/../bundle.txt', 'sub\\bundle.txt']) {
  test(`reject artifact path ${unsafe}`, t => {
    const f = fixture(t);
    f.manifest.artifacts[0].path = unsafe;
    rejects(f.input(), 'ARTIFACT_PATH');
  });
}

test('symlinks are rejected even if they resolve to matching bytes', t => {
  const f = fixture(t);
  fs.symlinkSync(path.join(f.root, 'bundle.txt'), path.join(f.root, 'alias'));
  f.manifest.artifacts[0].path = 'alias';
  rejects(f.input(), 'ARTIFACT_SYMLINK');
});

test('signature domain separation rejects another protocol', t => {
  const f = fixture(t);
  const input = f.input();
  input.approvals[0].signature = sign(null, input.approvals[0].payload, KEYS[0].privateKey).toString('base64');
  rejects(input, 'SIGNATURE_INVALID');
});

test('deep JSON is rejected without overflowing the parser validation stack', t => {
  const f = fixture(t);
  const nested = Buffer.from(`${'['.repeat(10000)}0${']'.repeat(10000)}\n`);
  rejects({ ...f.input(), manifestBytes: nested }, 'DOCUMENT_DEPTH');
});

test('aggregate artifact reads are bounded before allocation', t => {
  const f = fixture(t);
  const fd = fs.openSync(path.join(f.root, 'rollback.txt'), 'r+');
  try { fs.ftruncateSync(fd, 100 * 1024 * 1024); } finally { fs.closeSync(fd); }
  rejects(f.input(), 'ARTIFACT_SIZE');
});

test('missing artifact and root return bounded errors without exposing local paths', t => {
  const f = fixture(t);
  rejects({ ...f.input(), artifactRoot: path.join(f.root, 'absent') }, 'ARTIFACT_UNREADABLE');
  f.manifest.artifacts[0].path = 'absent.txt';
  rejects(f.input(), 'ARTIFACT_UNREADABLE');
});

test('document type and size checks precede hashing', t => {
  const f = fixture(t);
  for (const field of ['manifestBytes', 'policyBytes']) {
    for (const value of [undefined, '', Buffer.alloc(1024 * 1024 + 1)]) {
      rejects({ ...f.input(), [field]: value }, 'DOCUMENT_SIZE');
    }
  }
});

test('overlong filesystem names do not disclose the local root', t => {
  const f = fixture(t);
  f.manifest.artifacts[0].path = 'x'.repeat(256);
  assert.throws(() => verifyAuthorization(f.input()), error =>
    error.code === 'ARTIFACT_UNREADABLE' && !error.message.includes(f.root));
});
