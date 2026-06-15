# TPP — Obesity — 1L Injectable, BMI ≥30, No T2DM, Post-Tirzepatide-Bar (2026-06-05)

**Segment:** First-line injectable chronic weight management in adults with BMI ≥30 (obesity, no comorbidity-threshold requirement) who have no type 2 diabetes — the core general-obesity segment that tirzepatide (SURMOUNT-1) and semaglutide (STEP-1) were pivoted in. This is the largest addressable patient population in the obesity space and the segment where the commercial and regulatory bar is now set by tirzepatide as de facto US SoC.

---

## Patient segment

- **Inclusion:** Adults ≥18 yr with BMI ≥30 kg/m² (obesity, class I–III); no diagnosis of T2D at enrolment (fasting plasma glucose <126 mg/dL, HbA1c <6.5%); willing to receive weekly or monthly subcutaneous injection. May have prediabetes (HbA1c 5.7–6.4%) or weight-related comorbidities beyond T2D (dyslipidaemia, hypertension, OSA, MASH); no established ASCVD required.
- **Excluded:** Patients with T2D (these enter a separate segment where SURMOUNT-2 / SELECT data apply). Genetic monogenic obesity (handled by MC4R-pathway agents). Prior obesity surgery within 5 years. Prior or current use of a GLP-1R agonist or GIP/GLP-1 dual agonist (this TPP is first-line; treatment-experienced patients are a distinct adjacent segment).
- **Estimated annual treated population (US):** ~3–4 million eligible patients/year in the BMI ≥30 no-T2D segment who seek pharmacotherapy; US adult obesity prevalence ~42% (CDC NHANES), of whom ~60–65% are BMI ≥30 without T2D. Current penetration of branded anti-obesity medicines remains <10% of eligible patients — addressable gap is structural, not a saturated market.
- **EU:** ~30 million adults with BMI ≥30 without T2D; formulary access materially worse than US given no EU equivalent of Medicare coverage expansion and AMNOG-style restrictions tightening post-Germany 2026 reform.
- **Current standard of care in this exact segment:** Weekly subcutaneous tirzepatide (Zepbound, 5→10→15 mg titration over 20 weeks), achieving mean TBWL −20.9% at w72 with 56.7% of patients losing ≥20% body weight (SURMOUNT-1, Jastreboff 2022 NEJM, PMID 35658024). As of June 2026, tirzepatide is now covered by all major US PBMs (event_id 13), removing the access friction that previously sustained semaglutide's market share. Semaglutide 2.4 mg (Wegovy) remains an active alternative at −14.9% TBWL w68 (STEP-1, Wilding 2021 NEJM, PMID 33567185) but faces supply-side pressure following FDA re-inspection failure of Novo Nordisk's Indiana facility (mammalian-hair and water-leak contamination, June 2026, macro.json signal_id 106).

---

## Unmet need — what the current SoC fails to deliver

- **Lean mass / sarcopenia risk (ETLM unmet_need[0]):** Tirzepatide's −20.9% TBWL comes at the cost of ~25–40% of weight lost from fat-free mass. In a 100 kg patient losing 20.9 kg, approximately 5–8 kg is lean tissue. No approved lean-mass-sparing modifier exists. Bimagrumab (Lilly BELIEVE combo, Phase 2) and apitegromab (Scholar Rock Phase 2) are addressing this but are ≥3 years from approval. For older adults or patients with functional concerns, this is a clinically meaningful gap.
- **Weight regain on discontinuation (ETLM unmet_need[1]):** STEP-4 / SURMOUNT-4 show ~67% of lost weight regained within 12 months of stopping weekly incretin. The current label paradigm is chronic indefinite dosing — a cost and adherence problem. No approved maintenance-only protocol exists; SURMOUNT-MAINTAIN and ATTAIN-MAINTAIN trials are running but have not reported for the non-T2D segment.
- **GI tolerability and real-world discontinuation (ETLM unmet_need[4]):** Nausea, vomiting, and diarrhoea drive ~5–10% trial discontinuation and likely 20–30% real-world discontinuation during titration. Monthly dosing (MariTide) is the most clinically plausible near-term tolerability differentiator; the Phase 2 readout is now published (NEJM 2025, PMID 40549887): −16.2% TBWL (treatment-policy estimand, no-T2D) / −19.9% efficacy estimand at 52wk monthly SC, with a reported GI-tolerability profile. The Phase 3 (MARITIME-1) tolerability/durability data remain pending.
- **Efficacy plateau and non-response ceiling (analyst knowledge):** ~9% of SURMOUNT-1 patients achieved <5% TBWL on tirzepatide (non-responder tail). For this segment, no approved or near-approval rescue therapy exists.
- **Cardiovascular outcomes data gap (ETLM unmet_need[8]):** SELECT (semaglutide) is the only positive CVOT in obesity without T2D (MACE HR 0.80, Lincoff 2023 NEJM, PMID 37952131). SURMOUNT-MMO (tirzepatide, NCT05556512, 15,374 patients, active) is pending — absence of tirzepatide MACE data is a residual label and prescriber-confidence gap, particularly for EU regulators and payers post-Germany reform. New assets will need to address the CVOT question or accept that their label will not include CV risk reduction language.
- **Access and reimbursement (ETLM unmet_need[6]):** US Medicare's 1965 statutory carve-out partially persists; MEPA reform pending Congress as of 2025. Even with commercial PBM coverage now universal for tirzepatide, prior auth and step-edit requirements create friction. Any new asset priced above tirzepatide faces a payer hurdle requiring demonstrated superiority — not just non-inferiority.

---

## Efficacy bar — the numbers a new asset must beat

The segment is now calibrated against tirzepatide SURMOUNT-1 as the primary reference. Semaglutide STEP-1 is the secondary reference. A new injectable asset entering 1L in this segment cannot be approved on non-inferiority to semaglutide — FDA will expect a tirzepatide-comparable or better profile, given that tirzepatide is already the marketed SoC.

| Endpoint | Current best-in-class | Asset | Trial | Target for new asset |
|---|---|---|---|---|
| Mean %TBWL at ~w68–72 (primary) | −20.9% | tirzepatide 15 mg | SURMOUNT-1 (NCT04184622) | ≥−22% (statistically superior to sema; non-inferior to tirz) OR ≥−24% if seeking superiority vs tirz |
| ≥20% TBWL responder rate | 56.7% | tirzepatide 15 mg | SURMOUNT-1 | ≥60% (superiority claim vs tirz) OR ≥50% (non-inferior vs tirz with differentiated profile) |
| ≥25% TBWL responder rate | 36.2% | tirzepatide 15 mg | SURMOUNT-1 | ≥40% if pursuing class-leading differentiation |
| Mean %TBWL (triple-agonist ceiling, ~w80) | −28.3% | retatrutide 12 mg | TRIUMPH-1 Ph3 (NCT05929066, topline 2026-05-21) | ≥−28% to match the new triple-agonist class ceiling |
| Waist circumference delta (cm) | −18.5 | tirzepatide | SURMOUNT-1 | ≥−20 cm or non-inferior with superior lean-mass sparing |
| Lean mass loss % of total weight loss | ~30% | tirzepatide (estimated) | SURMOUNT-1 substudies | ≤20% (lean-mass-sparing differentiation axis) |
| Mean %TBWL head-to-head (tirz vs sema, 72wk) | −20.2% tirz vs −13.7% sema | tirzepatide 15 mg | SURMOUNT-5 (head-to-head Ph3b, NEJM 2025) | A new asset's superiority case is now benchmarked against the ESTABLISHED head-to-head: tirzepatide is already proven superior to semaglutide (−20.2% vs −13.7%, tirz superior on primary + all key secondaries, GI-AE discontinuation 2.7% vs 5.6%) |
| MACE 3-pt HR (if CVOT sought) | 0.80 | semaglutide | SELECT (NCT03574597) | HR <0.80 (superiority over SELECT) or at minimum HR <1.0 with narrow CI to secure EU label expansion |
| SURMOUNT-MMO (pending) | ~0.80 expected | tirzepatide | SURMOUNT-MMO (NCT05556512) | New asset entering after ~2027 must model against tirzepatide CVOT data once available |

**Note:** The efficacy bar has materially shifted in 2023–2026. The −14.9% TBWL bar from semaglutide (STEP-1) is no longer competitive for a first-line injectable NDA in this segment. FDA issued draft guidance in 2023 indicating that superiority over placebo remains sufficient for approval, but payer coverage decisions now operationally require head-to-head relevance to tirzepatide. A sponsor entering this segment with −17% TBWL can expect a label but minimal commercial uptake given universal tirzepatide access.

---

## Safety bar — the AE profile to match or improve

| AE | Current SoC rate (any grade) | Current SoC rate (Gr3 / serious) | Acceptable for new asset | Notes |
|---|---|---|---|---|
| Nausea | ~45% (tirzepatide SURMOUNT-1) | ~0.8% serious | ≤35% (any) — meaningful differentiation if achieved | Primary dose-limiting AE during titration; monthly dosing (MariTide) is the leading candidate to reduce this |
| Vomiting | ~25% | ~0.4% serious | ≤18% | Same axis as nausea |
| Diarrhoea | ~30% | ~0.5% | ≤20% | |
| Constipation | ~25% | rare serious | ≤20% | |
| Injection-site reactions | ~4% (tirzepatide) | rare | ≤5% | Monthly dosing formulations must address injection-site tolerability over longer needle exposure |
| Gallbladder disease (cholelithiasis / cholecystitis) | ~1.8% (tirzepatide SURMOUNT-1) | ~0.7% cholecystitis | ≤2% | Class signal; ursodeoxycholic acid co-prescribing context |
| Acute pancreatitis | <0.2% | signal monitored | ≤0.3% | Class surveillance requirement |
| Heart rate increase (tachycardia) | +2.3 bpm (tirzepatide) | n/a | ≤+3 bpm or cardiovascular-neutral | Incretin class effect; monitoring required |
| Lean mass loss | ~30% of weight lost comes from FFM (tirzepatide, substudies) | n/a — not an AE but an efficacy-safety boundary | ≤20% of weight as FFM (if lean-mass-sparing claim sought) | Regulatory precedent for this as a safety signal is not established; payer and clinical differentiation axis |

**Key class-specific notes:**
- No GI mechanism-class signals analogous to oncology ADC AA-pathway risk — the obesity class does not carry an AA-pathway concern.
- Semaglutide's thyroid C-cell tumour rodent signal (label boxed warning) is shared across GLP-1R agonist class; any new GLP-1R-mechanism asset inherits this. Assets with non-GLP-1R mechanisms (Alnylam RNAi, MariTide GIPR-antagonist mechanism) do not carry this label risk.
- SURMOUNT-1 discontinuation due to AEs: 4.3% tirzepatide vs 2.6% placebo — any new asset must meet ≤5% trial discontinuation rate.

---

## Competitive set

### Approved (injectable, 1L, BMI ≥30 no T2D)

- **Tirzepatide (Zepbound)**, Eli Lilly, 1L, TBWL −20.9% w72, universal US PBM access as of June 2026; de facto SoC benchmark
- **Semaglutide 2.4 mg (Wegovy)**, Novo Nordisk, 1L, TBWL −14.9% w68; CV outcomes label (MACE HR 0.80 SELECT); supply risk active June 2026 (manufacturing failure)
- **Liraglutide 3.0 mg (Saxenda)**, Novo Nordisk, 1L, TBWL −8.0% w68; daily injection; generic entry 2024 (Biocon); minimal future pipeline relevance

### Phase 3 / pending readout within 18 months

- **Retatrutide (LY3437943)**, Eli Lilly, TRIUMPH-1 (NCT05929066, n=2,335, COMPLETED), GLP-1/GIP/glucagon triple agonist; **Phase 3 topline announced 2026-05-21** (Lilly investor release / AJMC 2026): up to −28.3% mean TBWL at 80wk (12mg), −25.9% (9mg), −19.0% (4mg) vs −2.2% placebo; ~45% achieved ≥30% loss. This resets the efficacy ceiling to ~28% TBWL — materially above the tirzepatide benchmark and now the highest readout in the field. TRIUMPH-3 (obesity + CV disease) active.
- **Maridebart cafraglutide (MariTide / AMG 133)**, Amgen, MARITIME-1 (NCT06858839, n=3,853, active non-recruiting, non-T2D), GIPR antagonist + GLP-1 RA antibody-peptide conjugate, monthly SC dosing; Ph2 TBWL ~−20% w52; differentiates on dosing frequency. Key Phase 3 readout expected 2027–2028. Potential to be only approved monthly injectable in the space.
- **CagriSema (semaglutide + cagrilintide)**, Novo Nordisk, REDEFINE-T2 (NCT06131437, n=809, head-to-head vs tirzepatide, COMPLETED; awaiting full data), REDEFINE China (NCT05996848, COMPLETED); REDEFINE-1 (NEJM 2025-06-22, ADA 85th Sessions): TBWL −20.4% w68 (treatment-policy, primary) / −22.7% (full-adherence estimand); 40.4% achieved ≥25% (per-protocol). Notably MISSED the pre-specified 25% target. Narrowly exceeds semaglutide on the headline primary; below tirzepatide. If REDEFINE-T2 data show non-inferiority to tirzepatide, this is a NDA-ready profile for Novo Nordisk.
- **Orforglipron (LY3502970)**, Eli Lilly, oral (NOT injectable — separate segment); ATTAIN-1 Ph3 TBWL −12.4% at 36mg/72wk (NEJM Sept 2025), −11.2% pooled, ≥10% loss in 54.6%; ACHIEVE/ATTAIN Ph3 program ongoing. Oral route means it does not compete in the injectable 1L segment directly, but oral + injectable Lilly portfolio will compress the market opportunity for new injectable entrants.
- **Survodutide (BI 456906)**, Boehringer Ingelheim / Zealand, SYNCHRONY-1 (NCT06066528, n=755, COMPLETED), GLP-1/glucagon dual, weekly SC; readout expected 2026. Differentiated MASH/liver-fat benefit; EU commercial headwind from German pricing reform.

### Phase 2 / earlier-stage notable

- **Enicepatide (CT-388)**, Roche (ex-Carmot), GLP-1/GIP dual, Phase 2 (NCT06628362, n=360, active); Phase 3 readiness estimated 2025–2026. Roche's only obesity pipeline asset — if Phase 2 TBWL is competitive, expect a Phase 3 announcement. No advantage over tirzepatide on mechanism.
- **Petrelintide (ZP8396)**, Zealand Pharma, amylin analog monotherapy, Phase 2 (ZUPREME-1, NCT06569355, n=250, COMPLETED); if tolerability-differentiated vs GLP-1 class (lower nausea), could define a new combination standard. Additive to GLP-1 backbone rather than a standalone 1L competitor.
- **Alnylam RNAi obesity (second program)**, Alnylam, Phase 1 (IND filed June 2026, target undisclosed); siRNA/GalNAc mechanism; extended-dosing-interval thesis (quarterly/biannual vs weekly); no TBWL data available. Not a 1L competitor in this cycle — monitor for ADA/ENDO 2026–2027 target disclosure.
- **Pemvidutide (ALT-801)**, Altimmune, GLP-1/glucagon dual, Phase 2 MOMENTUM (NCT05295875, n=391, COMPLETED); lean-mass sparing signal in Phase 2 substudies; MASH co-benefit positioning. Differentiation axis is MASH + body composition, not raw TBWL.

---

## Differentiation axes — where a new asset could win

### 1. Mechanism (novel target / dual MoA / pathway combo)

**Current position:** GLP-1R monotherapy is saturated (semaglutide + 8+ next-gen entrants). GLP-1/GIP dual is tirzepatide-led with CT-388 and VK2735 as fast followers. Triple agonist (GLP-1/GIP/glucagon) is retatrutide's space. None of these mechanisms offers a structural lean-mass or cardiovascular advantage — they are efficacy escalation on the same incretin axis.

**Where a new asset can win:** Non-incretin mechanisms are the true white space in 1L injectable. Amylin monotherapy (petrelintide) is the only near-term example. GIPR-antagonist + GLP-1R agonism (MariTide — GIPR antagonism is mechanistically distinct from GIPR agonism in tirzepatide) offers a potential tolerability and body-composition advantage. RNAi gene silencing (Alnylam) is a 5–7-year horizon. Assets combining anti-myostatin (bimagrumab) with incretin backbone are the only credible lean-mass-sparing approach in Phase 2.

**Competitive set coverage:** Amgen (MariTide) is already addressing GIPR-antagonism axis in Phase 3. Lilly (bimagrumab BELIEVE combo) is addressing myostatin axis in Phase 2. The unaddressed white space is a unimolecular agent with ≥30% lean-mass preservation + ≥22% TBWL — no such asset exists.

### 2. Patient population (biomarker-defined subset / underserved subgroup)

**Current position:** The 1L BMI ≥30 no-T2D segment is the most competitive slice. Adjacent opportunities: (a) post-surgical weight regain, (b) obesity + MASH (survodutide, pemvidutide pursuing), (c) prediabetes conversion prevention (no asset specifically labelled for this), (d) non-responder / partial-responder to existing GLP-1 (eloralintide Phase 3 addresses post-GLP-1 persistent obesity).

**Where a new asset can win:** Defining a biomarker-selected subset (e.g., GIPR-high expressors, GLP-1R variant carriers, elevated fasting amylin concentrations) could enable a smaller, faster pivotal with a superior responder rate. No such biomarker is validated as an enrolment criterion in 2026.

### 3. Durability (treatment-free interval / response durability / discontinuation tolerability)

**Current position:** Weight regain on discontinuation is the single largest unaddressed gap in the field (ETLM unmet_need[1]). No approved agent offers a reduced-frequency maintenance protocol. SURMOUNT-MAINTAIN and ATTAIN-MAINTAIN are addressing this within existing molecules.

**Where a new asset can win:** A monthly or quarterly injectable with durable gene-level mechanism (RNAi) or sustained-release depot formulation that maintains ≥60% of weight loss at 12 months off-drug. No approved or Phase 3 asset has demonstrated this. Monthly MariTide is the closest commercially advanced asset, but durability post-discontinuation data are not yet public.

### 4. Route / convenience (oral vs IV / dosing frequency / outpatient vs hospital)

**Current position:** Weekly subcutaneous is the current standard. Monthly subcutaneous (MariTide Phase 3) is the only credible dosing-frequency differentiator in Phase 3 for an injectable. Oral small-molecule GLP-1 (orforglipron ATTAIN-1 Ph3 −12.4% TBWL at 36mg/72wk, NEJM 2025) does not match injectable tirzepatide efficacy but removes injection entirely.

**Where a new asset can win:** For 1L injectable specifically, monthly dosing is a meaningful adherence and convenience differentiator vs weekly — particularly for patients who are injection-averse or have access to nurse-administered injection settings. Quarterly or less-frequent injectable (RNAi/gene-silencing) is a 5+ year horizon. A new weekly injectable that offers improved GI tolerability profile (≤35% nausea rate vs tirzepatide's ~45%) without sacrificing TBWL could win on the tolerability-convenience axis.

### 5. Combinability (chemo-free regimen / backbone compatibility)

**Current position:** Tirzepatide is becoming the de facto backbone for combination strategies — bimagrumab (Lilly), bremelanotide (Palatin), apitegromab (Scholar Rock) are all running as add-on to tirzepatide or GLP-1 backbone. An asset that functions as an add-on to existing GLP-1 therapy (rather than a standalone 1L) competes in the treatment-experienced segment, not here.

**Where a new asset can win:** Defining the asset as a preferred backbone that tolerates combination (amylin + anti-myostatin; amylin + GLP-1) could differentiate versus tirzepatide's incremental mono-receptor escalation model.

### 6. Cost / payer (real-world access constraints / value-based contracting)

**Current position:** Tirzepatide Zepbound WAC ~$1,060/month; universal PBM coverage achieved June 2026. Any new injectable entering at higher WAC needs to demonstrate superiority data (not non-inferiority) to justify formulary positioning above tirzepatide. A payer-positioned asset at lower WAC than tirzepatide is possible if generic-competitive manufacturing cost allows, but this is a 2030+ scenario for any newly-developed asset.

**Key payer risk:** US Medicare carve-out (1965 SSA) is partially in place — MEPA reform pending. For the 65+ segment of this patient population, formulary access depends on a legislative change that has not passed as of June 2026. An asset with a superior CVOT (beats SELECT MACE HR 0.80) could unlock a CV-risk-reduction indication, which would be separately reimbursable under Medicare Part D cardiovascular guidelines (as semaglutide's 2024 sNDA for CVD risk reduction enabled).

---

## Regulatory and commercial reality

- **Pathway:** For a standard injectable in 1L BMI ≥30 no-T2D, the natural path is standard NDA via 505(b)(1). Fast-track or breakthrough designation is unlikely for a me-better incretin; breakthrough territory exists only for novel mechanisms (RNAi, non-incretin, lean-mass combination) or for specific underserved subgroups. Accelerated approval (AA) pathway is not applicable — surrogate endpoints (TBWL) are accepted as direct clinical endpoints in obesity following the FDA 2023 guidance update.
- **Reference comparator for FDA:** The natural pivotal design is a superiority trial vs placebo with tirzepatide as active comparator (open-label arm or blinded active arm for prescriber benchmarking). A non-inferiority design vs tirzepatide with a novel mechanism claim (e.g., lean-mass preservation + TBWL non-inferiority) is plausible but would require FDA agreement on the NI margin (likely −3% TBWL margin based on prior FDA precedent).
- **Confirmatory trial risk:** No AA-pathway issue in this segment — obesity efficacy trials use direct TBWL endpoints approved as primary. No cardiovascular confirmatory-trial requirement unless a CVOT-based label claim is sought.
- **MACE outcomes data requirement:** FDA does not currently require a completed positive CVOT for obesity drug approval (unlike T2D where EMPA-REG / LEADER set the precedent). However, EU MACE data expectations are tightening post-Germany pricing reform; EU label without CVOT data will face payer restrictions in most EU5 markets.
- **Market size (US + EU):**
  - US treated market: estimated $30–40B TAM by 2030 (consensus sell-side estimates 2025–2026); tirzepatide + semaglutide currently capture >95% of branded prescriptions
  - US BMI ≥30 no-T2D addressable: ~65M adults; if 5% treated at $1,000/month = ~$39B/year theoretical ceiling; realistic penetration 2026–2030 is 8–12% of eligible = $6–12B
  - EU: materially smaller due to reimbursement restrictions; estimated €3–5B by 2030 under current access scenarios; Germany headwind cuts Lilly/BI projections post-pricing reform
- **Payer dynamics:** Following tirzepatide universal PBM coverage (June 2026), the payer floor is set. Any new asset must demonstrate superiority to tirzepatide in at least one payer-visible dimension (TBWL magnitude, tolerability, dosing frequency, CV outcomes, lean-mass preservation) to achieve preferred formulary tier. Step-edit requirements (fail tirzepatide first) are likely for any new entrant at comparable or higher price.
- **Geopolitical risk (China-origin assets):** Mazdutide (Innovent/Lilly), GZR18 (Gan & Lee), VCT220 (Vincentage), efsubaglutide alfa (Shanghai Yinnuo) and HDM1005 (Hangzhou Zhongmei Huadong) are all Chinese-origin assets. BIOSECURE Act / COINS Act exposure applies to any US-China data-sharing arrangement. None of the major China-origin obesity assets currently has a US NDA — but mazdutide's ex-China rights (held by Lilly) will be navigated through Lilly's regulatory infrastructure. New entrants from Chinese sponsors seeking direct US NDA should model BIOSECURE Act compliance costs and data integrity scrutiny.

---

## TPP summary — the brief

A new injectable asset seeking to win in the 1L BMI ≥30 no-T2D segment in 2026 and beyond must clear a TBWL bar of ≥22% at w68–72 — the current tirzepatide benchmark — with a tolerability profile meaningfully better than tirzepatide's ~45% nausea rate or a dosing frequency of monthly or less. Raw efficacy alone at −20–22% TBWL is not differentiating: tirzepatide has universal US PBM access and is the clinical reference comparator against which FDA, payers, and prescribers now benchmark new entrants. The commercial opportunity requires either (a) a superiority TBWL claim (≥−24%, approaching retatrutide's triple-agonist Phase 2 signal) with a credible MACE outcomes programme, or (b) a mechanism-differentiated profile combining TBWL non-inferiority with a lean-mass-preservation claim (≤20% of weight lost from FFM vs ~30% for incretin class) — a gap that bimagrumab and apitegromab are in Phase 2 trying to fill but that no approved or near-NDA asset yet addresses. Monthly dosing (MariTide, Amgen MARITIME-1 readout expected 2027–2028) is the most credible near-term differentiation axis without requiring a new mechanism; any new weekly injectable entering Phase 3 now will face direct head-to-head relevance to both tirzepatide (approved) and MariTide (likely approved by the time the new entrant files). The window for a me-better incretin without a clear differentiation axis (lean mass, CVOT superiority, dosing frequency, or novel mechanism) is closing.

---

## What makes this TPP change next cycle

1. **Retatrutide TRIUMPH-1 full peer-reviewed publication (Eli Lilly):** Phase 3 TOPLINE was announced 2026-05-21 (up to −28.3% mean TBWL at 80wk, 12mg) and has ALREADY reset the efficacy ceiling to ~28%; the efficacy-bar target now reflects this. Next-cycle catalyst is the full peer-reviewed manuscript (estimand detail, responder-rate breakdown, safety) plus TRIUMPH-3 (obesity + CV disease). Updates: confirm/adjust efficacy bar table rows once the full paper provides estimand-level responder data.
2. **Tirzepatide SURMOUNT-MMO MACE readout (Eli Lilly, NCT05556512, ~2027–2028):** If tirzepatide achieves MACE HR <0.80 (matching SELECT), CV outcomes data will become a de facto entry requirement for commercial success in any patient population with elevated CV risk — even within the no-T2D segment where SELECT enrolled ASCVD patients. Updates: Regulatory pathway (CVOT requirement), payer dynamics, and MACE bar table row.
3. **MariTide (maridebart cafraglutide) MARITIME-1 pivotal readout (Amgen, NCT06858839, n=3,853, expected ~2027):** First Phase 3 read for monthly injectable. If superiority vs placebo with TBWL comparable to tirzepatide AND tolerability advantage (nausea <35%), this sets a new convenience / tolerability bar that all future weekly injectables must address. Updates: Competitive set (MariTide moves to Approved), differentiation axis 4 (route/convenience), and safety bar table nausea row.
4. **ADA Scientific Sessions 2026 (June 19–22) — CagriSema REDEFINE-T2 data vs tirzepatide:** REDEFINE-T2 (n=809, head-to-head vs tirzepatide, COMPLETED) results expected at or shortly after ADA 2026. The field already has a published head-to-head benchmark — SURMOUNT-5 (tirzepatide vs semaglutide, NEJM 2025: −20.2% vs −13.7%, tirz superior). REDEFINE-T2 would be the first head-to-head pitting a CHALLENGER (CagriSema) directly against tirzepatide; if CagriSema achieves non-inferiority to tirzepatide at a lower nausea rate, it becomes the first challenger to clear the tirzepatide head-to-head bar. Updates: Competitive set (CagriSema from Phase 3 to near-approved), efficacy bar (new active comparator benchmark), and patient segment (payer will potentially require CagriSema trial also for step-edit purposes).

---

*Sources: ETLM obesity.json (last_updated 2026-06-04, analyst_session_id S51-obesity); skill_context_obesity.json (generated 2026-06-05); obesity_analyst_review_2026-06-05.json; ws12-obesity-knowledge.md (2026-06-05 cycles 1–4); SURMOUNT-1 Jastreboff 2022 NEJM PMID 35658024; STEP-1 Wilding 2021 NEJM PMID 33567185; SELECT Lincoff 2023 NEJM PMID 37952131; retatrutide TRIUMPH-1 Ph3 topline 2026-05-21 (Lilly/AJMC, NCT05929066); SURMOUNT-5 NEJM 2025 (NEJMoa2416394); orforglipron ATTAIN-1 NEJM 2025 (NEJMoa2511774); CagriSema REDEFINE-1 NEJM 2025-06-22; MariTide Ph2 NEJM 2025 (PMID 40549887); WS12 landscape events event_id 12, 13; macro.json signal_id 106.*
