# Atlas release authorization binding verifier

Implementation tranche of the approved Atlas autonomous release workflow (2026-09-13),
requirements 14 and 15. This tranche is not complete platform qualification.

## Acceptance contract

1. The verifier shall require separate clinical and operational signatures binding the exact release-manifest digest.
2. If the manifest, artifact bytes, indication scope, target, policy, expiry, revocation, evidence watermark, epoch, predecessor or fencing token fails validation, then the verifier shall reject the input.
3. The verifier shall obtain policy identity and current authorization state from a separately trusted caller, not the candidate.
4. The verifier shall return the artifact bytes it actually hashed, with their identities, without rereading mutable paths for later consumption.
5. The verifier shall reject ambiguous JSON, invalid signatures, duplicate approval roles, missing required artifacts and unsafe artifact paths.
6. The verifier shall impose bounded document depth, size, artifact count and aggregate artifact bytes.
7. The verifier shall perform no signing, approval recording, consumption, clinical editing or deployment.

## Interface and trust boundary

`scripts/atlas-release-authorization.mjs` exports `verifyAuthorization`.
Signed documents use UTF-8 canonical sorted-key JSON plus one newline; signatures use
Ed25519 over the domain `atlas-release-approval-v1\n` and the exact approval payload.
The payload binds role, key, approval identity, issue/expiry and exact manifest digest.
The manifest binds all artifact hashes and the complete target/state preconditions.

Policy declares signer public keys, principal identities, indication and target scopes,
the maximum approval age, required artifact kinds and whether distinct principals are
required. This implementation does not enroll signers or choose a production policy.
Two distinct roles are always required; principal separation is an explicit policy choice.
Test-only keys are generated in memory and confer no real-world authority.

The trusted adapter supplies current time, an unexpired state snapshot, independently
pinned policy digest, revocations/consumption, epoch, watermark, target predecessor and
fencing token. Supplying candidate-controlled values here voids the trust model.
The artifact directory must be a caller-controlled snapshot with no concurrent mutation.
The verifier rejects symlinks but does not sandbox a concurrently hostile filesystem.

Successful output is `AUTHORIZATION_BINDINGS_VALID`, always with
`publication_authorized: false`. Artifact kinds are required by pinned policy, not
invented by a candidate. Hash binding does not prove evidence truth, clinical freshness,
selector completeness, gate semantics or rollback compatibility.

## Remaining platform integration

Before deployment, a separately tested adapter must validate semantic gates, recheck
authoritative state at the side-effect boundary, atomically consume approvals with target
CAS/fencing, and exercise exact rollback and post-deploy readback. Unknown commit outcomes
must quarantine before retry. Existing platform BLOCKED/FAIL receipts remain unchanged.
No production signer policy or human signatures are created by this tranche.

## Verification

`node --test scripts/tests/atlas-release-authorization.test.mjs`

Synthetic tests cover valid bindings and mutations of every trust/state boundary above.
The returned bytes remain the checked bytes after the original file is subsequently changed.
Independent security and failure-mode reviews supplement the deterministic tests.

## Implementation prompt

<role>Implement the authorization-binding prerequisite to Atlas release qualification.</role>
<task>Enforce the acceptance contract with a pure verifier and synthetic mutation tests.</task>
<constraints>Keep deployment, real signer enrollment, clinical qualification and publication closed. Preserve existing source and candidate files. A passing verifier is not a passing release.</constraints>
