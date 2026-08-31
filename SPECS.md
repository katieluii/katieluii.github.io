## Atlas Landing Page Copy Refresh   [id: atlas-copy-refresh-2026-08-31 · date: 2026-08-31 · status: done]

### 1. Goal & Why
Refresh the Atlas landing page so the copy sounds concrete and analyst-led rather than generic AI phrasing, and make the Atlas Reader path easier to find.

### 2. Context
Touches the portfolio Atlas page in `src/pages/AtlasDrugDevAnalyst.tsx` and the shared `src/components/atlas/AtlasDataflow.tsx` diagram. The RxClarity offering PDF is used as messaging source material for sharper value-prop language.

### 3. Requirements (EARS)
- THE SYSTEM SHALL remove or rewrite the "Four streams feed one living memory" explanatory copy.
- THE SYSTEM SHALL make the Atlas Reader CTA more prominent on the page.
- THE SYSTEM SHALL update the "What it changes for your team" section using the RxClarity offering themes of live intelligence, monitoring, signal filtering, analysis, and source-linked answers.
- THE SYSTEM SHALL remove visible middle dots/interpuncts from the touched Atlas page copy.

### 4. Acceptance Criteria
- [x] The old "Four streams feed one living memory" paragraph no longer appears.
- [x] The ETLM hub in the dataflow can be clicked to reach `/atlas-reader`.
- [x] Value props use concrete language drawn from the offering PDF themes.
- [x] No visible `·` or `•` remains in `AtlasDrugDevAnalyst.tsx`.

### 5. Out of Scope
No redesign of Atlas Reader pages, no change to Atlas data generation, and no change to the RxClarity PDF.

### 6. Open Questions  [NEEDS CLARIFICATION]
None.

### 7. Implementation Notes
Use existing React/Tailwind patterns. Keep the dataflow hub link optional so other pages are unaffected unless they pass `hubHref`.

### 8. Eval Stub
- success criteria: exact string absence for removed copy and interpuncts; link target check for the ETLM hub.
- [x] case: page source contains "Four streams feed one living memory" -> absent
- [x] case: page source contains visible middle dot/interpunct -> absent
- [x] case: hub link requested -> rendered anchor points to `/atlas-reader`

## Atlas Positioning Correction   [id: atlas-positioning-correction-2026-08-31 · date: 2026-08-31 · status: done]

### 1. Goal & Why
Describe Atlas accurately as an indication-based ETLM deliverable, without implying a connected monitoring dashboard or agent service layered on top.

### 2. Requirements (EARS)
- THE SYSTEM SHALL describe Atlas as producing an Emerging Therapeutic Landscape Map for a defined indication.
- THE SYSTEM SHALL describe analyst review and organised evidence as part of the deliverable.
- THE SYSTEM SHALL use `drug development`, never `drug-development`, in the Atlas page and its subpages.
- THE SYSTEM SHALL replace Atlas-page interpuncts with commas or other natural punctuation.

### 3. Acceptance Criteria
- [x] Atlas landing-page and project metadata no longer claim that Atlas tracks every indication or maintains a connected monitoring layer.
- [x] Atlas value props do not describe agent work or dashboard monitoring.
- [x] No `drug-development` string remains in `src`.
- [x] No `·` or `•` remains in Atlas pages, Atlas components, or Atlas data copy.

### 4. Out of Scope
No changes to Atlas data generation, source coverage, or deliverable content.

### 5. Implementation Notes
The `4173` preview is served from `Projects/_worktrees/kl-portfolio-wsi2`; both that worktree and the main project are kept aligned for touched Atlas files.

### 6. Eval Stub
- success criteria: source scans show no forbidden hyphenation or interpuncts; Atlas metadata describes an indication-based map; the Reader CTA still targets `/atlas-reader`.
