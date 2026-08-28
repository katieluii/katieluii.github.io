# Ecosystem knowledge — preview

_A public-safe slice of a running internal note, rebuilt by the Atlas sync._

_Published: the 2 most recent dated entries that carry at least one of the sections below, each reduced to its date, and within each entry only the subsections whose heading matches “target/modality”, “modality trajectory”, “deal climate”, “conference observations”. Not published: the pipeline run-log that heads every entry in the source note, every other subsection, and every earlier entry. Internal record identifiers and workflow labels are removed from the text that is kept._


## 2026-08-27 (entry 1 of 2)

### Target/modality crowding

- **TSLP class expands beyond asthma/atopic disease into a second Type-2 inflammatory indication.** Tezepelumab (AstraZeneca/Amgen) hit both co-primaries in Phase 3 CROSSING in eosinophilic esophagitis (histologic remission + DSQ symptom change wk24, sustained wk52) plus all key secondaries — topline only, ZERO effect sizes or p-values disclosed, so not yet benchmarkable against dupilumab (~59-60% histologic remission wk24) or cendakimab. Third co-primary-positive Ph3 EoE biologic after dupilumab and cendakimab.
- Internal-consistency gap surfaced as a byproduct (landscape hygiene, not a new industry fact): EoE's own `competitive_dynamics.white_space_targets` and `unmet_needs[5]` still assert "TSLP... no active clinical programmes" even though `pipeline_assets` already carries the tezepelumab/CROSSING entry — flagged manual review this cycle, unresolved.
- **RAS(ON) pan-RAS class (daraxonrasib/Rasonque)** — already FDA-approved 2L+ PDAC — is expanding toward 1L via RASolute 303 (NCT07491445). A live CT.gov API v2 re-check this cycle found the registry had drifted from the ETLM: enrollment 760→900, primary endpoint OS-only → dual-primary PFS+OS, and the ETLM's stated NALIRIFOX arm does not exist in the actual arm composition (Arm A daraxonrasib mono / Arm B daraxonrasib+gem/nab-pac / Arm C gem/nab-pac comparator). AUTO_APPLIED as a registry-correction patch; no efficacy number touched.

### Deal climate

- **Gates Foundation put up to $35M (initial $20M tranche) into Flagship's ProFound Therapeutics for preeclampsia/eclampsia target discovery**, applying its ProFoundry proteomics/AI platform to placenta/serum samples — non-profit capital entering a therapeutic area with almost no commercial pipeline in this landscape's tracked scope.
- **CEPI backed Minapharm/ProBioGen's Bundibugyo ebolavirus vaccine with up to $16.5M toward a Phase 1 trial** in Africa (MVA-CR19 platform) — same pattern as the Gates/ProFound entry above: philanthropic/global-health capital funding early clinical work in an area with thin commercial investment.
- No new priced commercial deal touches a tracked asset or sponsor this cycle.

### Conference observations

- None active in today's signal batch. Generate:Biomedicines disclosed early Phase 1 respiratory data at ERS26 after a poster leak — source article itself returned HTTP 403, so the specific disease within "respiratory disease" was never confirmed; no tracked indication overlap established, noted for completeness only.


## 2026-08-27 (entry 2 of 2)

### Target/modality crowding

- **Anti-TSLP class posts two independent positive readouts in one week, spanning three indications.** (1) Tezepelumab (TEZSPIRE, Amgen/AstraZeneca) hit both co-primaries in Phase 3 CROSSING in eosinophilic esophagitis (NCT05583227, histologic remission + DSQ symptom change wk24, sustained wk52) — topline only, zero effect sizes disclosed (first). (2) Generate Biomedicines' GB-0895 posted Phase 1 COPD biomarker data — BEC/FeNO/IL-5/IL-13 reductions sustained ≥6 months from a single dose (N=40, 300/600mg vs placebo) — primary-source-verified this cycle via SEC Form 8-K Exhibit 99.1 (filed 2026-08-25) against CT.gov API v2 NCT07116889 [verified independently: CT.gov API v2 confirms NCT07116889 = "A Study to Investigate GB-0895 in Adults With Mild to Moderate Asthma or COPD", Phase 1, Generate Biomedicines, ACTIVE_NOT_RECRUITING]. GB-0895 is also already in Phase 3 asthma (SOLAIRIA-1/2, NCT07276724/NCT07359846) — so this one asset alone now spans asthma (Ph3) + COPD (Ph1), while tezepelumab spans asthma (approved) + COPD (Ph3, standing BOREAS/NOTUS OLE item) + EoE (Ph3, new). Per the copd analyst's own count, TSLP now has 5 active COPD-class entrants (tezepelumab Ph3, verekitug Ph2b, tilrekimig Ph2/3, WIN378 Ph2, GB-0895 Ph1) — up from a class the EoE config didn't even track as of an earlier cycle (tracked_target_classes gap, still open). landscape-scope caveat: this is a within-landscape entrant count across our 3 tracked TSLP-touching indications (asthma/COPD/EoE), not an industry-wide crowding claim — external anchor (Citeline/CT.gov full-universe pull) not yet done.

### Modality trajectory

- **TSLP class-broadening** — see Target/modality crowding above; two indications' worth of new positive data in one week is this cycle's clearest momentum signal.
- **PD-1xVEGF bispecific (ivonescimab)** — thread continues (see Sponsor activity); still no hard efficacy numbers after 3+ cycles of "class-validating" framing, so momentum is commercial/narrative, not yet benchmark-grade.
- No new modality failure/safety-cooling signal this cycle.

### Deal climate

- Quiet-to-moderate: Moderna raised $2B in convertible senior notes for oncology investment/debt repayment (financing-climate signal, no tracked-asset touch); Redesign Health's shift from venture-studio to venture-firm model was framed as an AI-driven compression of startup-formation cost (structural/observational, no priced deal). No new priced deal touches a tracked asset or sponsor this cycle.

### Conference observations

- **ERS 2026 (Amsterdam, Sep 19-23) embargo break resolved to its source this cycle: an SEC 8-K.** Generate Biomedicines' GB-0895 COPD poster leaked ahead of the conference; last cycle (206) this was logged low-confidence (source article HTTP 403, disease area unconfirmed). This cycle's copd analyst traced it to the company's own Form 8-K (filed 2026-08-25, Item 7.01 Reg FD, CIK 0002100782, Exhibit 99.1 furnishing the full poster text) — closing the identity loop with certainty. This is now the **second time** this file has recorded a pre-conference data leak surfacing first in an EDGAR filing rather than the conference itself (structurally repeatable: an issuer's own Reg FD disclosure obligation forces the data into a public filing before the embargo lifts) — worth treating "check EDGAR 8-Ks for the sponsor" as a standing first move whenever a wire reports a leaked/early conference readout with an unnamed asset.
