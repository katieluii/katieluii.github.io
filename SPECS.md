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

## WS21 Clinical Trial Analyst project card   [id: ws21-clinical-trial-analyst-card-2026-08-31 · date: 2026-08-31 · status: done]

**Superseded for navigation and status by `ws21-live-application-link-2026-08-31` below.** This first pass treated WS21 as a metadata-only project and relied on a stale checkpoint; the application and frozen registry already existed.

### 1. Goal & Why
Add WS21 as a separate portfolio project within Dove so the site distinguishes the clinical trial analyst from the existing recruitment-duration predictor.

### 2. Context
The portfolio currently lists only `trial-recruitment` under Dove. WS21 ships four evidence-gated answers for a selected indication or therapeutic area and phase: endpoints, recurring eligibility criteria, an enrolment range, and duration consumed from the existing predictor. The WS21 repository still records open strata sign-off, audit, and second-labeller work.

### 3. Requirements (EARS)
- THE SYSTEM SHALL list WS21 as a project separate from the trial recruitment predictor.
- THE SYSTEM SHALL identify WS21 as part of Dove.
- THE SYSTEM SHALL describe WS21 as an analyst layer that benchmarks trial design and consumes the existing duration predictor.
- THE SYSTEM SHALL expose a project-detail route using the existing standard project-page renderer.
- WHILE WS21's open publish gates remain unresolved, THE SYSTEM SHALL label the project `WIP`.
- IF a trial group has insufficient evidence, THEN the project copy SHALL say that the analyst refuses to answer rather than guesses.

### 4. Acceptance Criteria
- [x] `/projects` shows a distinct `Clinical Trial Analyst` card.
- [x] Filtering `/projects?suite=D` shows both the trial recruitment predictor and WS21.
- [x] `/projects/clinical-trial-analyst` renders the summary, three evidence-based sections, and a related-project link to the duration predictor.
- [x] The Dove home row links to the filtered two-project view.
- [x] The existing `/trial-recruitment` route and project record are unchanged.
- [x] Type-check and production build pass.

### 5. Out of Scope
No custom WS21 dashboard, no deployment of the WS21 API, no change to the recruitment predictor, no claim that the open WS21 sign-off and audit work is complete, and no GitHub push or Pages deployment.

### 6. Open Questions
None. `WIP` is the staging status for this pass; switching it to `Live` is a publication decision after the open WS21 gates are reviewed.

### 7. Implementation Notes
Add one `Project` object to `src/data/projects.ts`. Add its id to Dove's `madeOf` list in `src/data/suite.ts`, broaden the Dove role and job copy, and point the Dove row to `/projects?suite=D`. Extend `StandardProjectPage` with an optional related-project link; no custom WS21 component or route declaration is needed.

### 8. Eval Stub
- success criteria: exact project and suite membership checks, route render check, forbidden-copy scan, TypeScript pass, and production build pass.
- [x] case: resolve Dove's `madeOf` list -> returns two known projects.
- [x] case: filter projects by suite `D` -> returns `trial-recruitment` and `clinical-trial-analyst`.
- [x] case: resolve slug `clinical-trial-analyst` -> returns the WS21 project record.
- [x] case: scan new reader-facing copy -> no em dash, middle dot, `drug-development`, prospective-enrolment claim, or unsupported completion claim.

### 9. Optimized implementation prompt
```xml
<role>You are implementing the WS21 project card in Katie Lui's portfolio.</role>
<context>The React and TypeScript portfolio stores project metadata in src/data/projects.ts, suite membership in src/data/suite.ts, and renders metadata-only projects through StandardProjectPage. WS21 is distinct from the existing trial recruitment predictor and remains WIP while its open gates are unresolved.</context>
<task>Add a separate Clinical Trial Analyst project, associate it with Dove, broaden Dove's copy to describe both tools, and preserve the existing recruitment page.</task>
<acceptance_criteria>The Dove-filtered index contains both projects; the WS21 detail route renders through the standard page; it links to the live duration predictor without implying WS21 is live; type-check and build pass.</acceptance_criteria>
<constraints>Use evidence-backed WS21 claims. Keep reader-facing copy free of em dashes, middle dots, and the string drug-development. Do not add a custom dashboard, alter the predictor, commit, push, or deploy.</constraints>
```

## WS21 card live-application correction   [id: ws21-live-application-link-2026-08-31 · date: 2026-08-31 · status: done]

### 1. Goal & Why
Make the WS21 project card open the built Clinical Trial Analyst application rather than presenting the project as a text-only portfolio page.

### 2. Context
The WS21 repository already contains a complete FastAPI application and interactive frontend backed by a committed precomputed artifact. The application serves 1,547 cells and 9,411 answers without the local corpus or WSi checkout. Its Railway image builds, but the production container currently fails to start, so no verified public URL is available yet.

### 3. Requirements (EARS)
- WHEN `VITE_WS21_APP_URL` is configured, THE SYSTEM SHALL make the WS21 project card open that application URL.
- WHEN `VITE_WS21_APP_URL` is configured, THE SYSTEM SHALL label the WS21 project and Dove as `Live`.
- IF `VITE_WS21_APP_URL` is absent, THEN THE SYSTEM SHALL keep the WS21 card on its internal project page and label WS21 `WIP` and Dove `Preview`.
- THE SYSTEM SHALL preserve the existing recruitment predictor as a separate Dove project.
- THE SYSTEM SHALL use the real WS21 application on localhost for preview verification.
- WHEN the card describes its Duration answer, THE SYSTEM SHALL identify WSi v5 as the separately validated upstream predictor.

### 4. Acceptance Criteria
- [x] A build with `VITE_WS21_APP_URL=http://127.0.0.1:8021` renders the WS21 project as `Live`.
- [x] The Dove-filtered project index resolves WS21 to `http://127.0.0.1:8021`.
- [x] Opening the resolved URL shows the interactive WS21 application, not the standard prose page.
- [x] The application returns four answer cards for the flagship P3 Oncology/Solid Tumours cell.
- [x] A build without `VITE_WS21_APP_URL` does not ship a localhost URL.
- [x] The card identifies WSi v5 and its 80% duration interval without claiming that it wins every individual metric.

### 5. Out of Scope
No duplicate React rewrite of the WS21 interface inside the portfolio, no iframe, no Railway redeploy, and no production URL claim until the failed Railway runtime is repaired and verified with a real cell.

### 6. Open Questions
None for localhost. The production value of `VITE_WS21_APP_URL` remains blocked on the Railway runtime fix.

### 7. Implementation Notes
Read the optional URL from Vite environment metadata in `src/data/projects.ts`. Use it for the WS21 `links.live` target and status. The existing project page remains the fallback when the URL is absent.

### 8. Eval Stub
- success criteria: environment-on and environment-off builds, exact resolved URL checks, route health, and a real-cell response with all four cards.
- [x] case: environment on -> WS21 is `Live` and resolves to `http://127.0.0.1:8021`.
- [x] case: environment off -> WS21 is `WIP` and contains no localhost URL.
- [x] case: flagship cell request -> endpoints, criteria, enrolment, and duration all answer.

## Public WS21 application route   [id: public-ws21-application-route · date: 2026-09-02 · status: approved]

### 1. Goal & Why

Make the public Clinical Trial Analyst project open the real interactive WS21
application. The prose-only fallback hides the product Katie reviewed: endpoints,
eligibility criteria, enrolment range and Duration.

### 2. Context

The portfolio already supports `VITE_WS21_APP_URL`, but the public build leaves it
unset because the WS21 Railway service has not started successfully. GitHub Pages
cannot execute the FastAPI backend or serve WS21's 9,411 precomputed API answers by
itself. The existing deployment contract is therefore: repair WS21 on Railway,
verify a real answer, configure the verified URL in the portfolio build, and retain
the prose page only as an outage fallback.

### 3. Requirements (EARS)

1. THE SYSTEM SHALL expose the complete WS21 interface at a public HTTPS URL.
2. WHEN a user opens the Clinical Trial Analyst project from Dove, THE SYSTEM SHALL take the user to the complete WS21 interface.
3. WHEN the WS21 interface answers a supported cell, THE SYSTEM SHALL show endpoints, eligibility criteria, enrolment range and WSi v5 Duration.
4. IF the deployed WS21 backend cannot answer the flagship cell, THEN THE SYSTEM SHALL retain the portfolio fallback and SHALL NOT label the application Live.
5. WHILE the public app URL is configured, THE SYSTEM SHALL exclude localhost URLs from the production bundle.

### 4. Acceptance Criteria

- [x] The WS21 Railway deployment completes successfully.
- [x] `/api/health` reports precomputed mode, matching fingerprints, WSi `4efab3d`, 1,547 cells and 9,411 answers.
- [x] P3 Oncology/Solid Tumours returns all four answer cards, including Duration 40.5 months with a 25.0-56.1 month interval.
- [x] The portfolio production build contains the verified HTTPS URL and no localhost WS21 URL.
- [ ] Opening Dove's Clinical Trial Analyst project reaches the interactive application rather than the prose-only page.

### 5. Out of Scope

- Rewriting the WS21 interface in React inside the portfolio.
- Duplicating the 105 MB answer artifact in GitHub Pages.
- Changing WSi v5, the WS21 evidence model, or the four answer contracts.
- Calling the deployment Live before a real supported cell answers publicly.

### 6. Open Questions

None. Katie explicitly confirmed the public project should expose the built WS21
application, not the metadata fallback.

### 7. Implementation Notes

Repair the existing `ws21-clinical-trial-analyst` Railway service first. Prefer
the existing precomputed deployment contract over a second hosting architecture.
After verification, set the portfolio production build's `VITE_WS21_APP_URL` to
the public HTTPS URL and promote the exact tested commit to `main`.

### 8. Eval Stub

- success criteria: exact public health stamp, field presence on a real cell, exact Duration values, HTTPS link in the built portfolio, and zero localhost URLs.
- [x] case: public `/api/health` -> precomputed, fingerprints match, zero gaps.
- [x] case: public flagship cell -> endpoints, criteria, enrolment and Duration objects are present.
- [x] case: public portfolio bundle -> verified WS21 HTTPS URL present, `127.0.0.1:8021` absent.
- [ ] case: public Dove click -> interactive WS21 application loads.

### Implementation Prompt

```xml
<role>You are repairing and publishing the existing WS21 Clinical Trial Analyst application.</role>
<context>WS21 already serves a complete frontend and 9,411 precomputed answers through FastAPI. The portfolio already accepts VITE_WS21_APP_URL. The current public route is a prose fallback because Railway has no verified running WS21 deployment.</context>
<task>Diagnose and repair the existing Railway service, verify health plus a real flagship answer, configure the verified HTTPS URL in the portfolio production build, and publish the exact tested portfolio commit.</task>
<acceptance_criteria>The public app exposes all four WS21 answer cards; health stamps WSi 4efab3d with matching fingerprints and zero gaps; the portfolio routes Clinical Trial Analyst to that app and contains no localhost URL.</acceptance_criteria>
<constraints>Reuse the existing precomputed serving contract. Keep the prose page as the fail-closed fallback. Preserve the WSi v5 and WS21 answer contracts.</constraints>
```
