# Standard-of-Care Anchor Table — Data-Integrity Redesign Spec

*Analysis and redesign specification for the approved-therapies benchmark table in the drug-pipeline dashboard. Prioritizes traceability and honest uncertainty over density and aesthetics.*

---

## 0. Resolved decisions (locked)

| # | Decision | Consequence |
|---|---|---|
| **Audience** | External — selling to **investors and consultancies**. | The shipped site renders **T0–T2 only**. T3 (correction logs, author to-dos, source-conflict, alternates) is retained in the data but **never rendered on the shipped site**. No runtime "editor mode"; editorial state is a repo/build concern for the editor only. |
| **Verification has two lives** | Editor/build sees the full state vocabulary; the shipped site shows **only** verified-primary vs sourced-unverified + comparability markers. | `needs-verification`, `placeholder`, and `source-conflict` must **not** appear on the shipped site. Any such state on a shipped number is a **build-time bug to fix before shipping**, caught by an integrity check (§3). |
| **Verification fields** | Add `verifiedDate` / `verifiedBy` if not already present. | Where absent, the endpoint defaults to `sourced-unverified` — never assume verified, never fabricate a date. |
| **T0 chip aggregation** | **Per-metric.** Each headline number (efficacy, tolerability) gets its own state dot. | Not worst-state-wins. |
| **Non-comparable assets** | **Excluded from ranking.** Rare-genetic assets (e.g. Imcivree) sit in a separate, clearly labeled "not directly comparable" group below the ranked anchors. | They remain fully present — just outside the comparison ordering. |
| **Platform** | **Desktop and mobile.** | Provenance (T1) needs hover on desktop **and** a real tap/focus popover fallback on touch. |
| **Corrections** | Shipped site shows **only the corrected value** as truth — no `corrected` chip, no before/after log. | Correction history stays in the data (T3) for the editor. |

## 1. Diagnosis — current failures (ranked)
1. The summary row (most-read) carries no verification signal — flattens verified, mislabeled, and unverified into visual parity. Biggest failure.
2. Disqualifying caveats buried in deepest-tier prose (Zepbound nausea 31% is single-arm, presented as pooled).
3. Author to-dos/placeholders render in the same channel as real values.
4. Comparability flagged on the row, not the number; column silently mixes readout weeks/denominators/comparator bases.
5. Known internal contradiction invisible (Foundayo 17.2mg/-11.1% FDA vs 36mg/-12.4% NEJM).
6. Badge semantics inconsistent.
Verdict: keep endpoint granularity; the problem is undifferentiated detail — tier by KIND, don't delete.

## 2. Tiered information model
- **T0** default row: scannable headline + a state signal on every headline number.
- **T1** hover/focus: full provenance for the number under the cursor (state line, citation, locus, basis, dates, link). Keyboard-focus + touch-tap fallback; persistent links stay.
- **T2** expand: endpoint-level values, each with own provenance + state.
- **T3** memory-only: correction history, editorial to-dos, raw/alternate figures, AE-by-dose tables. Never shipped.

## 3. Verification & data-quality state (highest priority)
Two orthogonal axes.
- **Axis A provenance:** `verified-primary` | `sourced-unverified` | `needs-verification` | `placeholder`.
- **Axis B caveats:** `corrected` | `pooling-caveat` | `comparability-caveat` | `source-conflict`.
Editor/build view: full vocabulary; T0 per-metric dot (green verified-primary, amber sourced-unverified, red-outline needs-verification, hollow placeholder) + superscript glyph (Δ corrected, ⚠ pooling, ≠ comparability, ⇄ conflict).
Shipped site: ONLY verified-primary vs sourced-unverified (green vs muted dot) + comparability (≠). `needs-verification`/`placeholder`/`source-conflict` NEVER shipped. Corrections render as corrected value only.
**Build-time integrity check:** script + test scans every shipped T0/T2 endpoint and FAILS if any carries needs-verification/placeholder/source-conflict, with a per-asset report.
Check marks reserved exclusively for verified-primary. Accessibility: never color alone.

## 4. Comparability integrity
1. Extend population badge into explicit indicationClass on every row: general-obesity / obesity+T2D / rare-genetic / pediatric.
2. Canonical column definitions in header; per-cell readout week + comparator basis on hover.
3. Cell-level ≠ marker when a cell's basis diverges from column canonical.
4. One global non-head-to-head disclaimer above the table.
5. Exclude non-comparable (rare-genetic) from ranking; separate labeled group. Never auto-normalize.
6. source-conflict surfaced at point of comparison.

## 5. Memory / presentation split
Full record (per asset) = append-only source of truth: AssetRecord { id, brand, generic, sponsor, target, modality, route, indicationClass, approvals, trials[], endpoints[] }. EndpointRecord { endpointId, label, canonicalMetric, value|range|null, unit, doseArm, population, readoutWeek, comparatorBasis, n, provenance{sourceType,citation,ref,locus,url,retrievedDate,verifiedDate,verifiedBy}, state{verification,caveats[]}, correctionHistory?[] (T3), alternates?[] (T3), editorialNotes?[] (T3 only) }.
Presentation config (separate): columns[{columnId,label,mapsTo[],canonicalDefinition,unit,sigFigs}], tierByEndpoint, rules{t0StateAggregation:'per-metric', forceComparabilityMarkerWhenBasisDiffers, renderPlaceholderAs, missingGlyphs}. Renderer reads record for truth, config for what to show. Corrections append; never overwrite silently.

## 6. Units, precision, missing data
One unit per column (header-declared); consistent sig-figs per column; render source ranges as ranges (no fabricated midpoint). Four distinct empty states, retire catch-all `—`: not-reported `n/r`, not-applicable `n/a`, pending/placeholder (empty + editor flag), suppressed (blank).

## 7-8. Ranked changes + implementation checklist
Ship T0–T2 only; two-view state; build-time integrity check; verifiedDate/verifiedBy (absent→sourced-unverified); per-metric T0 chips; rare-genetic excluded from ranking; corrections show corrected value only; desktop+mobile popover.

## Ground rules (clinical data)
- Never invent/infer/backfill/"clean up" a value.
- Single source of truth = full record; separate presentation config; changing display never touches data.
- Preserve every existing column and sourced endpoint in the data layer; verify counts before/after.
