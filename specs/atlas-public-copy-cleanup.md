# Atlas public-copy cleanup [id: atlas-public-copy-cleanup · date: 2026-09-14 · status: approved]

## Goal and context
Release the existing six-map refresh without internal workflow prose. Katie authorized
working through this backlog on 2026-09-14. Scope is the existing six-code whitelist,
with full detail still limited to mm, nsclc and obesity.

## Requirements and acceptance
1. WHEN observed workflow clauses are present, the public-copy scrub shall remove only
   process provenance and retain adjacent clinical facts, trial IDs, citations and uncertainty.
2. IF workflow tokens survive, the committed-tree gate shall reject the bundle.
3. The system shall preserve clinical numbers, record identity and existing summary caps.
4. The source drafts shall remain unchanged by this cleanup.
5. The release shall pass mutation tests, public verification, typecheck and build.

## Out of scope
New indications, approval flags, clinical corrections, baseline changes, private audit files.
No open questions for the four observed workflow-clause shapes.

## Eval cases
- Internal asset-index parenthetical + clinical sentence -> clinical sentence retained.
- Dosing rationale + internal record-creation rule -> dosing rationale retained.
- Raw internal token in either key or value -> gate rejects.
- Treatment-cycle wording, citation and NCT -> unchanged.

## Implementation prompt
<role>Maintain Atlas public-copy provenance boundaries.</role>
<context>scripts/sync-atlas-content.py and scripts/tests/test_sync_gates.py govern the release.</context>
<task>Repair the observed clause shapes, add leak-detection tests, regenerate and review the six maps.</task>
<constraints>Preserve clinical meaning and all shared work; publish only reviewed scoped paths.</constraints>
