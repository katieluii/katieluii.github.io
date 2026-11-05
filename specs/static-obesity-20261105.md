# Static obesity landscape (2026-11-05)
Status: approved implementation; protected site release pending.
Goal: retain the existing dashboard without an always-running Railway backend.
Requirements: the page and all three tabs shall read same-origin static JSON only; charts, filters and historical forecast data shall remain available; the page shall identify the source data date and distinguish archival forecasts from current forecasts; a missing snapshot shall show an error without calling Railway.
Acceptance: typecheck/build pass; every fetched JSON asset exists in the built site; all 14 forecast payloads preserved; no obesity Railway URL remains in the built page; visible date comes from source health.last_updated, not export time.
Out of scope: refreshed financial/clinical analysis, automated updates, unrelated Atlas release changes, deleting Railway before the static page is verified live.
Verification cases: Stocks -> preserved stock/forecast series; Pipeline -> 334 existing records; M&A -> preserved firepower/targets; network unavailable after first load -> no Railway request.
Implementation brief: export the currently public API payloads as JSON, switch only the obesity page/components to the static base, preserve interactions and label the archival snapshot.
