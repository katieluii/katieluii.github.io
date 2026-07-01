# TPP — Obesity — 1L Injectable, BMI ≥30, No T2DM, Post-Tirzepatide-Bar (2026-06-25)

**Segment:** First-line injectable chronic weight management in adults with BMI ≥30 (obesity, no comorbidity-threshold requirement) who have no type 2 diabetes — the core general-obesity segment that tirzepatide (SURMOUNT-1) and semaglutide (STEP-1) were pivoted in. This is the largest addressable patient population in the obesity space, and the segment where the commercial and regulatory bar is set by tirzepatide as de facto US standard of care — now confirmed by a published head-to-head superiority dataset (SURMOUNT-5, NEJM 2025) and re-anchored at the top by retatrutide's Phase 3 triple-agonist ceiling (TRIUMPH-1 topline, May 2026).

> **Current as of 2026-06-25 (QC-cleared 2026-06-30).** Rebuilt born-fresh from the 2026-06-15 TPP, with every benchmark re-anchored to current (≤3 yr) frontier data and every citation re-resolved against PubMed / ClinicalTrials.gov before inclusion. All figures previously pending confirmation were resolved against primary press releases / publications at QC (see the citation-verification block at the foot). This supersedes `tpp_obesity_1L_injectable_bmi30_2026-06-15.md` (which carried a stale −20.9% efficacy anchor, two wrong-target citations, and several pre-ADA-2026 "pending" statuses).

---

## Patient segment

- **Inclusion:** Adults ≥18 yr with BMI ≥30 kg/m² (obesity, class I–III); no diagnosis of T2D at enrolment (fasting plasma glucose <126 mg/dL, HbA1c <6.5%); willing to receive weekly or monthly subcutaneous injection. May have prediabetes (HbA1c 5.7–6.4%) or weight-related comorbidities beyond T2D (dyslipidaemia, hypertension, OSA, MASH); no established ASCVD required.
- **Excluded:** Patients with T2D (separate segment — SURMOUNT-2 / SELECT data apply). Genetic monogenic obesity (MC4R-pathway agents: setmelanotide, bivamelagon). Prior obesity surgery within 5 years. Prior or current GLP-1R agonist or GIP/GLP-1 dual agonist (this TPP is first-line; treatment-experienced patients are a distinct adjacent segment).
- **Estimated annual treated population (US):** ~3–4 million eligible patients/year in the BMI ≥30 no-T2D segment seeking pharmacotherapy; US adult obesity prevalence 41.9% (CDC NHANES 2017–Mar 2020), severe obesity 9.2%; global prevalence ~15.8% of adults (WHO 2024, >1bn adults obese 2022). Branded anti-obesity penetration remains <10% of eligible — the addressable gap is structural, not a saturated market.
- **EU:** ~30 million adults with BMI ≥30 without T2D; formulary access materially worse than US (no Medicare-style coverage expansion; AMNOG-style restrictions tightening post-Germany 2026 pricing reform).
- **Current standard of care in this exact segment:** Weekly subcutaneous **tirzepatide** (Zepbound, 5→10→15 mg over 20 weeks), mean TBWL **−20.9% at w72** with 56.7% losing ≥20% body weight (SURMOUNT-1, Jastreboff 2022 NEJM, PMID 35658024, NCT04184622). The **SURMOUNT-5** head-to-head now confirms tirzepatide's superiority **directly**: tirzepatide **−20.2%** (95% CI −21.4 to −19.1) vs semaglutide **−13.7%** (95% CI −14.9 to −12.6) TBWL at w72, superiority met — the first published registrational head-to-head in the field (Aronne 2025 NEJM, PMID 40353578, DOI 10.1056/NEJMoa2416394, NCT05822830). As of June 2026 tirzepatide is covered by all major US PBMs (Caremark, Express Scripts, OptumRx; event_id 13), removing the access friction that previously sustained semaglutide's share. **Semaglutide 2.4 mg** (Wegovy) remains the active alternative (−14.9% w68 monotherapy, STEP-1, Wilding 2021 NEJM, PMID 33567185), now with a **high-dose 7.2 mg** option lifting the GLP-1-mono ceiling to **−18.7% w72** (STEP UP, Wharton 2025, Lancet Diabetes & Endocrinology, PMID 40961952) — but it faces supply-side pressure after the FDA re-inspection failure of Novo's Indiana facility (mammalian-hair + water contamination, June 2026, macro signal_id 106).

---

## Unmet need — what the current SoC fails to deliver

- **Lean mass / sarcopenia risk (ETLM unmet_need[0]):** Incretin-driven 20–28% TBWL carries ~25–40% of weight lost as fat-free mass. Sarcopenic obesity carries 2–3× the mortality of obesity alone (Benz 2024); WS13 (Drucker, NRDD 2025) elevates lean-mass preservation to a **primary** differentiation axis distinct from raw %TBWL. No approved lean-mass-sparing modifier exists — bimagrumab (Lilly BELIEVE combo, Ph2), apitegromab (Scholar Rock, Ph2), eloralintide (Lilly) and trevogrumab/garetosmab (Regeneron, Ph2) are racing but ≥3 years out. Note that the newest dual/amylin entrants are now publishing favourable body-composition data: survodutide's SYNCHRONIZE-1 sub-study reports lean-mass loss ≤10.8% of total tissue change at the top dose, narrowing this gap as a pure white space.
- **Weight regain on discontinuation (ETLM unmet_need[2]):** STEP-4 / SURMOUNT-4 show ~two-thirds of lost weight regained within 12 months of stopping. The label paradigm is chronic indefinite dosing — a cost and adherence problem. No approved maintenance-only or dose-down protocol; SURMOUNT-MAINTAIN, ATTAIN-MAINTAIN, eloralintide Ph3 target this. Emerging maintenance biology (LEAP2/GHSR1a, GR-antagonist PT150) is preclinical.
- **GI tolerability and real-world discontinuation (ETLM unmet_need[5]):** Nausea/vomiting/diarrhoea drive ~5–10% trial and 20–30% real-world discontinuation during titration. Tolerability is now a **data-differentiated** axis: petrelintide's amylin-monotherapy ADA-2026 data report GI AE rates "generally similar to placebo" (ZUPREME-1, Zealand/Roche PR 2026-06-05), while monthly dosing (MariTide, berobenatide) is positioned as the convenience answer. *(Survodutide's SYNCHRONIZE-1 carries a real tolerability liability — total AE-driven discontinuation ~24–25% at the 3.6/6 mg doses (GI-driven ~19% vs 2.9% placebo), against 2.6–7.1% for the semaglutide/tirzepatide pivotals — a genuine opening for a cleaner-tolerability entrant, notwithstanding survodutide's favourable body-composition profile.)*
- **Pharmacogenomics of response (ETLM unmet_need[1]):** Inter-individual GLP-1RA response varies widely; polygenic + GLP-1R/GIPR missense variants track with differential loss and regain (German et al., Nat Med 2025, 10,960 subjects). No deployed PGx test — an open stratification axis.
- **Cardiovascular outcomes data gap (ETLM unmet_need[9]):** SELECT (semaglutide) is the only positive CVOT in obesity without T2D (MACE HR 0.80, 95% CI 0.72–0.90, Lincoff 2023 NEJM, PMID 37952131, NCT03574597). Tirzepatide SURMOUNT-MMO (NCT05556512) is pending; no CVOT exists for triple/dual/amylin/MC4R mechanisms. Absence of tirzepatide MACE data is a residual label and prescriber-confidence gap, sharpest for EU regulators/payers post-Germany reform.
- **Head-to-head comparative data (ETLM unmet_need[8]):** SURMOUNT-5 is the first published registrational H2H; REDEFINE-T2 (CagriSema vs Zepbound, NCT06131437) has now read out (ADA 2026). Beyond these the field still leans on cross-trial comparison — decision-grade comparative effectiveness across the dual/triple/amylin classes is largely missing.
- **Access and reimbursement (ETLM unmet_need[6]):** US Medicare's 1965 statutory carve-out partially persists (MEPA reform pending Congress); even with universal commercial PBM coverage for tirzepatide, prior-auth and step-edit friction remains, and 340B hospital-access disputes are unresolved. Any asset priced above tirzepatide faces a payer hurdle requiring demonstrated **superiority**, not non-inferiority.

---

## Efficacy bar — the numbers a new asset must beat

The segment is calibrated against tirzepatide (SURMOUNT-1 anchor + SURMOUNT-5 H2H) as the incumbent SoC bar, with **retatrutide's TRIUMPH-1 Phase 3 triple-agonist data now defining the upper ceiling**. A new injectable cannot be approved on non-inferiority to semaglutide — FDA and payers expect a tirzepatide-comparable-or-better profile, and "me-better incretins" now benchmark against the −28% retatrutide frontier, not the old −20.9% / −24% Phase 2 anchor.

| Endpoint | Current best-in-class | Asset | Trial | Target for new asset |
|---|---|---|---|---|
| Mean %TBWL ~w68–72 (incumbent SoC) | −20.9% | tirzepatide 15 mg | SURMOUNT-1 (NCT04184622, PMID 35658024) | ≥−22% (superior to sema; non-inferior to tirz) OR ≥−25% for superiority vs tirz |
| Head-to-head %TBWL vs semaglutide (w72) | −20.2% (tirz) vs −13.7% (sema), Δ −6.5 pp | tirzepatide | SURMOUNT-5 (NCT05822830, Aronne 2025 NEJM PMID 40353578) | Benchmark comparator package directly vs tirz, not cross-trial vs sema |
| **Mean %TBWL ceiling (triple agonist, Ph3)** | **−28.3% w80 (12 mg)**; up to **−30.3% w104** (BMI≥35 extension) | retatrutide | TRIUMPH-1 (NCT05929066, topline 21 May 2026; n=2,339, no T2D) | ≥−25% to compete with the triple-G ceiling; raw −20–24% no longer class-leading |
| ≥20% TBWL responder rate | 56.7% | tirzepatide 15 mg | SURMOUNT-1 | ≥60% (superiority vs tirz) OR ≥50% (non-inferior + differentiated profile) |
| ≥30% TBWL responder rate | 45.3% (12 mg) | retatrutide | TRIUMPH-1 | ≥40% for triple-agonist-class differentiation (bariatric-surgery-adjacent loss) |
| GLP-1 monotherapy ceiling (high-dose) | −18.7% w72 | semaglutide 7.2 mg | STEP UP (PMID 40961952) | Must clear this to claim incremental value over best-available mono |
| Waist circumference delta (cm) | −18.5 | tirzepatide | SURMOUNT-1 | ≥−20 cm, or non-inferior with superior lean-mass sparing |
| Lean mass loss % of total weight loss | ~25–40% (class); ≤10.8% of total tissue change (survodutide top dose) | incretin class / survodutide | substudies / SYNCHRONIZE-1 | ≤20% (lean-mass-sparing differentiation axis) |
| MACE 3-pt HR (if CVOT sought) | 0.80 (0.72–0.90) | semaglutide | SELECT (NCT03574597, PMID 37952131) | HR <0.80, or ≤1.0 with narrow CI for EU label leverage |

**Note on the re-anchored bar.** The frontier moved twice in 2025–2026. (1) **SURMOUNT-5 (2025)** replaced cross-trial inference with a direct tirzepatide-over-semaglutide superiority dataset (−20.2% vs −13.7% w72). (2) **Retatrutide TRIUMPH-1 Phase 3 topline (21 May 2026)** reset the ceiling at **−28.3% w80 (12 mg)** with 45.3% of patients reaching ≥30% TBWL, and up to **−30.3% w104** in the BMI≥35 extension — bariatric-surgery-adjacent magnitude from a weekly injectable. **Cite the estimand/dose/timepoint whenever quoting retatrutide**: the headline is the 12 mg arm at w80; full peer-reviewed data (responder breakdown, AE/discontinuation detail) are pending (likely ADA 2026 / ObesityWeek 2026, no PMID yet). FDA's 2023 guidance keeps superiority-over-placebo sufficient for approval, but payer coverage now operationally requires head-to-head relevance to tirzepatide. A sponsor entering at −17% TBWL can expect a label but minimal uptake against a universally-covered SoC.

---

## Safety bar — the AE profile to match or improve

| AE | Current SoC rate (any grade) | Serious / Gr3 | Acceptable for new asset | Notes |
|---|---|---|---|---|
| Nausea | ~45% (tirzepatide) | ~0.8% serious | ≤35% — meaningful differentiation | Primary dose-limiting AE in titration; amylin monotherapy (petrelintide, GI ≈ placebo) and monthly dosing (MariTide, berobenatide) are the leading reduction routes |
| Vomiting | ~25% | ~0.4% serious | ≤18% | Same axis as nausea |
| Diarrhoea | ~30% | ~0.5% | ≤20% | |
| Constipation | ~25% | rare | ≤20% | |
| AE-driven discontinuation | 4.3% (tirz) / ~7% (sema) | — | ≤5% | Amylin (petrelintide GI ≈ placebo) is the cleanest tolerability bet. *Survodutide SYNCHRONIZE-1 runs ~24–25% total AE-discontinuation (3.6/6 mg; GI-driven ~19% vs 2.9% placebo) — a tolerability liability vs the 2.6–7.1% incretin-pivotal range* |
| Injection-site reactions | ~4% (tirz) | rare | ≤5% | Monthly formulations must hold this over longer exposure |
| Gallbladder (cholelithiasis/cholecystitis) | ~1.8% | ~0.7% | ≤2% | Class signal |
| Acute pancreatitis | <0.2% | monitored | ≤0.3% | Class surveillance |
| Heart rate increase | +2.3 bpm (tirz) | n/a | ≤+3 bpm or neutral | Incretin class effect |
| Lean mass loss | ~25–40% of weight as FFM | n/a | ≤20% if claim sought | Efficacy-safety boundary, not a classical AE; payer/clinical differentiation axis |

**Class-specific notes:**
- **Neuropsychiatric / suicidality:** GLP-1 class signal under active FDA observation (evidence conflicting — antidepressant-like benefit vs suicidality reports; event_ids 252/253, as of 2026-06). Any new GLP-1R-mechanism asset should plan prospective neuropsychiatric capture.
- **Thyroid C-cell:** GLP-1R class rodent signal / boxed warning is inherited by any GLP-1R-mechanism asset. Non-GLP-1R mechanisms (amylin monotherapy — petrelintide, amycretin's amylin arm; MariTide's GIPR-antagonist arm) do not carry it.
- No ADC AA-pathway analogue exists in this class (0 AA-pathway assets in the obesity KB).

---

## Competitive set

### Approved (injectable, 1L, BMI ≥30 no T2D)
- **Tirzepatide (Zepbound)**, Eli Lilly — −20.9% w72 (SURMOUNT-1); −20.2% vs sema H2H (SURMOUNT-5); universal US PBM access; de facto SoC benchmark.
- **Semaglutide 2.4 mg (Wegovy)**, Novo Nordisk — −14.9% w68; 7.2 mg high-dose −18.7% w72 (STEP UP); CV label (MACE HR 0.80, SELECT); active supply risk (June 2026 manufacturing failure).
- **Liraglutide 3.0 mg (Saxenda)**, Novo Nordisk — −8.0% w68, daily injection; generic (Biocon) since 2024; minimal future relevance.

### Phase 3 / pending readout
- **Retatrutide (LY3437943)**, Eli Lilly — GLP-1/GIP/glucagon triple agonist, weekly SC. **TRIUMPH-1 (NCT05929066, n=2,339) topline 21 May 2026: −28.3% w80 (12 mg), 45.3% ≥30% TBWL; −30.3% w104 in BMI≥35 extension**; full publication/PMID pending. TRIUMPH-3 (obesity + CV disease) active. **The new efficacy ceiling** — displaces tirzepatide as the bar once filed, pending H2H confirmation.
- **CagriSema (semaglutide + cagrilintide)**, Novo Nordisk — GLP-1 RA + amylin combo, weekly SC. **REDEFINE-1 published NEJM 2025 (Garvey, PMID 40544433, n=3,417): −20.4% w68 on the treatment-policy/ITT estimand**, with **−22.7% on the trial-product estimand** (if fully adherent; Novo PR / NEJM 2025) — just below tirzepatide. **REDEFINE-T2 (NCT06131437, head-to-head vs tirzepatide) has read out (ADA 2026)** — the decisive comparator dataset; detailed figures pending QC.
- **Maridebart cafraglutide (MariTide / AMG 133)**, Amgen — GIPR antagonist × GLP-1 RA conjugate, **monthly** SC. Phase 2 (Jastreboff 2025 NEJM, PMID 40549887, NCT05669599): **−12.3% to −16.2% w52** across dose groups in obesity without T2D, no plateau at 52 wk (cite the range; the prior "~20%" framing was an unsupported selected cut). MARITIME-1 pivotal (NCT06858839, n=3,853) active; readout ~2027. Potential only-approved monthly injectable.
- **Survodutide (BI 456906)**, Boehringer Ingelheim / Zealand — GLP-1/glucagon dual, weekly SC. **SYNCHRONIZE-1 (NCT06066515, n=725, no T2D) topline 28 Apr 2026: −16.6% w76** (efficacy estimand) vs −3.2% placebo — below tirz/CagriSema, but with a **strong body-composition story** (≤10.8% of total tissue change from lean mass at top dose; up to −63.1% liver fat, −34% visceral fat). Offsetting liability: **~24–25% total AE-driven discontinuation** at the 3.6/6 mg doses (GI-driven ~19% vs 2.9% placebo) — a tolerability gap vs the incretin pivotals. MASH/liver-fat differentiation. EU pricing headwind. *(Corrected NCT: obesity arm is NCT06066515 / SYNCHRONIZE-1; the prior TPP cited NCT06066528, which is the obesity+T2D arm = SYNCHRONIZE-2.)*
- **Enicepatide (CT-388 / RO7795068)**, Roche (ex-Carmot) — GLP-1/GIP dual, weekly SC. Phase 2 monotherapy (CT388-103, n=469, no T2D): **−22.5% placebo-adjusted w48 on the efficacy estimand** (−18.3% treatment-regimen estimand; 24 mg, no plateau by w48). Advanced to **Phase 3** (two obesity trials initiated Q1 2026). Roche's lead obesity asset; also the GLP-1/GIP backbone for the petrelintide combo.
- **Berobenatide (MET-097i / PF-08653944)**, Pfizer (ex-Metsera) — biased GLP-1R agonist, **monthly** SC. Phase 2b (VESPER-1): **−14.1% placebo-subtracted w28** (top weekly dose), ~15–16 day half-life supporting monthly dosing. **Phase 3 VESPER-4 (NCT07311850, recruiting)** (program also VESPER-5 / VESPER-6). Pfizer's scaled re-entry post-danuglipron; a second monthly-injectable threat alongside MariTide. *(Berobenatide is the INN for MET-097i, Metsera→Pfizer; also coded PF-08653944.)*

### Phase 2 / earlier-stage notable
- **Amycretin (Novo Nordisk)** — unimolecular GLP-1 + amylin receptor agonist; **two routes, both published Lancet 2025-07-12**. *Subcutaneous*: Phase 1b/2a (Dahl, PMID 40550231, Lancet) — **−24.3% at w36, 60 mg dose** vs −1.1% placebo (lower doses −22.0% [20 mg], −16.2% [5 mg]) — a non-incretin-anchored magnitude rivalling tirzepatide from an early-phase study. *Oral*: first-in-human Phase 1 (Gasiorek, PMID 40550229, Lancet) — exploratory PD weight loss **−10.4% (up to 50 mg) / −13.1% (2×50 mg) at 12 wk** vs −1.2% placebo (figures in the full paper + Novo ADA-2025 release; the PubMed abstract lists bodyweight change only as an exploratory endpoint). Keep the oral figures distinct from the **subcutaneous** −22.0%/−24.3% w36 numbers — different formulation, dose, and timepoint. Novo's most important next-gen hedge against retatrutide; the amylin component sidesteps the GLP-1R thyroid/neuropsychiatric class baggage.
- **Petrelintide (ZP8396)**, Zealand / Roche — amylin analog monotherapy, weekly SC. **ZUPREME-1 (NCT06662539, n=250) Phase 2 reported ADA 2026: −10.7% w42** (efficacy estimand) vs −1.7% placebo, with **GI AE rates generally similar to placebo** (Zealand/Roche PR 2026-06-05). Tolerability-led thesis. Roche combo with enicepatide underway (combo efficacy not yet read out — do not assume additive). *(Corrected NCT: ZUPREME-1 = NCT06662539; the prior TPP-era NCT06569355 is a different trial — VCT220, Vincentage.)*
- **Bimagrumab (LY3985863)**, Eli Lilly — anti-ActRII mAb, monthly IV; BELIEVE combo with tirzepatide (Ph2) — lean-mass-sparing lead.
- **Pemvidutide (ALT-801)**, Altimmune — GLP-1/glucagon dual, MOMENTUM Ph2; MASH + body-composition positioning.
- **China-origin wave:** mazdutide (Innovent/Lilly, GLORY-1 complete), HRS9531/HRS-7535 (Hengrui/Kailera), olatorepatide (Hengrui/Regeneron), VCT-220 (Vincentage, NCT06569355), MDR-001 (MindRank, first AI-discovered Ph3 oral GLP-1). Broadening licensing-deal flow; BIOSECURE/COINS Act exposure on US data-sharing.

### Adjacent (oral, Lilly portfolio — compresses injectable opportunity, not direct 1L injectable competitor)
- **Orforglipron (LY3502970)**, Eli Lilly — oral small-molecule GLP-1 RA. **ATTAIN-1 (obesity, no T2D) published Wharton 2025 NEJM, PMID 40960239**; **ATTAIN-2 (obesity + T2D) published Horn 2027 Lancet, PMID 41275875** *(journal = Lancet, not NEJM)*. Oral route means it is a portfolio-compression force on the injectable market rather than a head-to-head injectable competitor.

---

## Differentiation axes — where a new asset could win

### 1. Mechanism
GLP-1R monotherapy is **saturated** (semaglutide franchise + 8+ next-gen/China entrants). GLP-1/GIP dual is tirzepatide-led with enicepatide and fast followers. GLP-1/glucagon dual is converging (survodutide/mazdutide/pemvidutide). Triple-G is retatrutide's space — now Phase 3 at the −28% ceiling. **White space is narrowing:** the amylin axis, recently the cleanest open lane, is now contested by petrelintide (mono) **and** amycretin (Novo's unimolecular GLP-1/amylin at −24.3% SC w36). Remaining genuine white space: muscle-sparing/anti-myostatin + incretin combos with a quantified lean-mass claim; non-incretin inflammation-axis (NLRP3 NT-0796, IL-22 CK-0045); biased GLP-1R agonism as a deliberate 4th-gen tolerability design (berobenatide). The unaddressed slot is a unimolecular agent with ≥30% lean-mass preservation **and** ≥25% TBWL — no such asset exists.

### 2. Patient population
The 1L BMI ≥30 no-T2D segment is the most crowded slice. Adjacents: post-surgical regain; obesity + MASH (survodutide, pemvidutide); prediabetes-conversion prevention (unlabelled); biomarker-selected responders (GIPR-high, GLP-1R/GIPR variant carriers) — no validated enrolment biomarker exists in 2026, but the PGx signal (German Nat Med 2025) makes this a credible smaller-faster-pivotal play.

### 3. Durability
Weight regain on discontinuation is the single largest unaddressed gap. No approved agent offers a reduced-frequency maintenance protocol. A monthly/quarterly injectable holding ≥60% of loss at 12 months off-drug would be category-defining; maintenance biology (LEAP2/GHSR1a, GR-antagonist) is preclinical.

### 4. Route / convenience
Weekly SC is the standard. **Monthly SC is now a two-horse Phase 3 race — MariTide (Amgen) and berobenatide (Pfizer, VESPER-4)** — making dosing frequency the most credible near-term differentiator that does not require a new mechanism. Note investor caution: market reception has favoured magnitude over tolerability/convenience to date (depth of TBWL still anchors valuation, and retatrutide's −28% raises that anchor), so a monthly asset still needs tirzepatide-class efficacy to win, not just convenience.

### 5. Combinability
Tirzepatide is the de facto backbone for add-ons (bimagrumab, apitegromab). The novel move is a **preferred backbone that tolerates combination** (amylin + incretin; amylin + anti-myostatin) — Roche's petrelintide + enicepatide combo is the lead expression of this thesis; Novo's amycretin is the unimolecular alternative to a two-agent combo.

### 6. Cost / payer
Tirzepatide WAC ~$1,060/month with universal PBM coverage (June 2026) sets the floor. Any higher-WAC entrant needs superiority data for preferred tiering; step-edit (fail tirzepatide first) is likely for comparable-or-higher price. A CVOT beating SELECT (MACE HR <0.80) could unlock a separately-reimbursable CV-risk-reduction indication.

---

## Regulatory & commercial reality

- **Pathway:** Standard NDA via 505(b)(1). Breakthrough/fast-track unlikely for a me-better incretin; reserved for novel mechanisms (amylin mono, lean-mass combo, non-incretin) or underserved subgroups. AA pathway not applicable — TBWL is an accepted direct endpoint post-2023 FDA guidance.
- **Reference comparator for FDA:** Superiority vs placebo with tirzepatide as active comparator (SURMOUNT-5 is now the design template). A non-inferiority-vs-tirzepatide design with a novel-mechanism claim (e.g. lean-mass preservation + TBWL NI) is plausible at a ~−3% TBWL NI margin.
- **MACE requirement:** FDA does not require a completed CVOT for obesity approval; EU expectations are tightening post-Germany reform — an EU label without CVOT data faces payer restriction in most EU5 markets.
- **Market size:** US treated market ~$30–40B TAM by 2030 (sell-side consensus); tirzepatide + semaglutide hold >95% of branded Rx. US BMI ≥30 no-T2D addressable ~65M adults; realistic 8–12% penetration 2026–2030 = ~$6–12B. EU ~€3–5B by 2030 under current access; Germany pricing reform cuts Lilly/BI projections.
- **Payer dynamics:** Post-universal-tirzepatide-coverage, the floor is set. New assets need superiority in at least one payer-visible dimension (TBWL magnitude, tolerability, dosing frequency, CV outcomes, lean mass). 340B hospital-access disputes remain an open variable.
- **Geopolitical (China-origin):** mazdutide, HRS9531/7535, olatorepatide, VCT-220 et al. carry BIOSECURE/COINS Act exposure on US data-sharing; none has a direct US NDA yet (mazdutide's ex-China rights run through Lilly).

---

## TPP summary — the brief

A new injectable seeking to win 1L BMI ≥30 no-T2D in 2026+ must now be measured against a frontier that has moved up, not just confirmed: tirzepatide is the universally-covered incumbent bar (−20.9%, confirmed head-to-head over semaglutide in SURMOUNT-5), but the ceiling is **retatrutide's −28.3% w80 (TRIUMPH-1 Phase 3)** with 45% of patients reaching bariatric-adjacent ≥30% loss. Raw −20–24% efficacy alone is no longer differentiating. Winning requires one of: **(a)** a superiority TBWL claim approaching the −28% triple-agonist territory plus a credible MACE programme; **(b)** a mechanism-differentiated profile pairing TBWL non-inferiority with a quantified lean-mass-preservation claim (≤20% of loss from FFM vs ~25–40% class) — a lane survodutide and the amylin agents are starting to occupy, leaving the unimolecular ≥30%-lean-sparing slot still open; or **(c)** monthly dosing, now a two-sponsor Phase 3 race (MariTide, berobenatide/VESPER-4) that any weekly entrant must out-position. Tolerability is a *data-differentiated* axis — petrelintide's amylin monotherapy (GI ≈ placebo, −10.7% w42) and Novo's amycretin (−24.3% SC w36) are the cleanest non-incretin bets. The window for a me-better incretin without a defined edge (lean mass, CVOT superiority, dosing frequency, or novel mechanism) is closing.

---

## What makes this TPP change next cycle

Several prior triggers have **already fired** and are incorporated above — retatrutide TRIUMPH-1 topline (21 May 2026), survodutide SYNCHRONIZE-1 (28 Apr 2026), petrelintide ZUPREME-1 and CagriSema REDEFINE-T2 (ADA 2026), and the Lancet/NEJM publications of CagriSema REDEFINE-1, MariTide Ph2, amycretin (SC + oral), orforglipron ATTAIN-1/2, and STEP UP. Genuinely forward-looking:

1. **Retatrutide TRIUMPH-1 full peer-reviewed publication + TRIUMPH-3 (Eli Lilly):** Only topline is public (no PMID). Full data (responder-rate breakdown, AE/discontinuation detail, estimand reconciliation) and the obesity+CVD readout firm up the −28% ceiling and any CV positioning. Updates: efficacy bar primary/responder rows, safety bar.
2. **CagriSema REDEFINE-T2 detailed publication (Novo Nordisk, NCT06131437):** Topline read at ADA 2026; the full head-to-head-vs-tirzepatide dataset is the decisive Novo comparator. Updates: competitive set, efficacy bar active-comparator row.
3. **MariTide MARITIME-1 + berobenatide VESPER-4 pivotal readouts (Amgen / Pfizer, ~2027):** First Phase 3 reads for monthly injectables. Superiority vs placebo with tirzepatide-class TBWL + tolerability advantage sets a new convenience/tolerability bar. Updates: competitive set (move to Approved), differentiation axis 4, safety bar discontinuation row.
4. **Tirzepatide SURMOUNT-MMO MACE readout (Eli Lilly, NCT05556512, ~2027–2028):** A MACE HR <0.80 makes CV outcomes a de facto entry requirement for any elevated-CV-risk population. Updates: regulatory pathway (CVOT), payer dynamics, MACE bar row.

---

## Changelog vs 2026-06-15 version

This 2026-06-25 rebuild re-anchors the efficacy bar from the stale tirzepatide −20.9% headline to the current **retatrutide TRIUMPH-1 Phase 3 frontier (−28.3% w80, 12 mg; −30.3% w104 BMI≥35)**, demoting the old −20.9%/−24% Phase-2 numbers to historical anchors and adding **SURMOUNT-5 (PMID 40353578) as the tirz-vs-sema reference (−20.2% vs −13.7% w72)**. It fixes the broken/wrong-target citations: the retatrutide Ph2 PMID is corrected from the wrong **37356450 (a Lancet-HIV editorial)** to the correct **37366315 (Jastreboff retatrutide Ph2 NEJM 2023)**; the survodutide obesity NCT is corrected from **NCT06066528 (obesity+T2D / SYNCHRONIZE-2)** to **NCT06066515 (SYNCHRONIZE-1, obesity-only, −16.6% w76)**; the petrelintide NCT is corrected from **NCT06569355 (actually VCT220/Vincentage)** to **NCT06662539 (ZUPREME-1, −10.7% w42)**. Press-release cites were upgraded to published papers with corrected journals/figures: **CagriSema REDEFINE-1 (PMID 40544433, −20.4% ITT confirmed, −22.7% adherent flagged QC)**, **MariTide Ph2 (PMID 40549887, cited as the −12.3% to −16.2% range, not "~20%")**, **STEP UP (PMID 40961952, figure corrected −18.3%→−18.7%, journal Lancet D&E)**, **orforglipron ATTAIN-1 (PMID 40960239, NEJM) / ATTAIN-2 (PMID 41275875, journal corrected NEJM→Lancet)**. Stale "pending/awaiting" statuses (REDEFINE-T2, SYNCHRONIZE-1, ZUPREME-1) are refreshed to reported. **Amycretin (Novo, SC −24.3% w36 PMID 40550231; oral −10.4%/−13.1% w12 PMID 40550229)** is added to the competitive set. The survodutide tolerability figure was resolved at QC (2026-06-30): total AE-driven discontinuation is **~24–25% at 3.6/6 mg** (GI-driven ~19% vs 2.9% placebo) — a genuine tolerability liability, restored to the safety bar; survodutide's favourable body-composition profile is retained as a separate point.

## Citation-verification summary

**PMIDs — 12 resolved against PubMed; all 12 exist.** 7 verified clean (35658024 SURMOUNT-1; 33567185 STEP-1; 37952131 SELECT HR 0.80 confirmed; 40353578 SURMOUNT-5 −20.2/−13.7 confirmed; 37366315 retatrutide Ph2 [the correct replacement]; 40960239 ATTAIN-1; 40550231 amycretin SC −24.3% @60mg confirmed). 5 needed correction and were corrected in this draft: **41275875** ATTAIN-2 journal NEJM→**Lancet**; **40961952** STEP UP figure −18.3%→**−18.7%**, journal→**Lancet D&E**; **40544433** REDEFINE-1 −20.4% treatment-policy/ITT confirmed, **−22.7% confirmed at QC as the trial-product estimand** (Novo PR / NEJM); **40549887** MariTide cited as **range −12.3% to −16.2%** (no single headline in abstract); **40550229** oral amycretin **exploratory PD −10.4%/−13.1% w12 confirmed at QC** (full paper + Novo PR; abstract lists as exploratory only) — kept distinct from the SC figures. The wrong-target **PMID 37356450** (confirmed = Lancet-HIV LGBTQ+ editorial) was removed.
**NCTs — 12 resolved against ClinicalTrials.gov; all 12 exist.** 8 verified clean; 3 corrected: **NCT06066528** (was cited for survodutide obesity; actually obesity+T2D) → **NCT06066515** (obesity-only); **NCT06569355** (was cited for petrelintide; actually VCT220/Vincentage) → **NCT06662539** (petrelintide ZUPREME-1); **NCT07311850** confirmed but registered as **VESPER-4** with drug code **MET097** (berobenatide=MET097 equivalence flagged for QC).
**Topline figures verified against primary PRs (no PMID yet):** retatrutide TRIUMPH-1 −28.3% w80 / −30.3% w104 / 45.3% ≥30% (Lilly PR 21 May 2026); survodutide SYNCHRONIZE-1 −16.6% w76 vs −3.2% placebo (BI PR 28 Apr 2026); petrelintide ZUPREME-1 −10.7% w42 vs −1.7% placebo, GI ≈ placebo (Zealand/Roche PR 5 Jun 2026).
**QC resolution (2026-06-30) — all six previously-flagged items resolved against primary sources:** CagriSema **−22.7% = trial-product estimand** (vs −20.4% treatment-policy; Novo PR/NEJM); survodutide **total AE-discontinuation ~24–25%** at 3.6/6 mg (GI-driven ~19% vs 2.9% placebo; Fierce/AJMC ADA 2026) — a liability, not favourable tolerability; enicepatide CT-388 **−22.5% pbo-adj w48 efficacy estimand** (−18.3% treatment-regimen; Genentech PR), Ph3 initiated Q1 2026, "Enith" program name dropped as unconfirmed; berobenatide **−14.1% pbo-sub w28** (VESPER-1 Ph2b; Pfizer PR), Ph3 VESPER-4; berobenatide = **INN for MET-097i / PF-08653944** (Metsera→Pfizer); oral amycretin **−10.4%/−13.1% w12** exploratory PD (Novo PR/Lancet), kept distinct from the SC −22/−24% w36 figures. **No unverified figures remain in this copy.**

---

*Sources: ETLM obesity.json; skill_context_obesity.json; ecosystem_knowledge.md; landscape/_macro.json. Primary citations (all resolved 2026-06-25): SURMOUNT-1 Jastreboff 2022 NEJM PMID 35658024 (NCT04184622); SURMOUNT-5 Aronne 2025 NEJM PMID 40353578 DOI 10.1056/NEJMoa2416394 (NCT05822830); STEP-1 Wilding 2021 NEJM PMID 33567185; STEP UP semaglutide 7.2 mg Wharton 2025 Lancet D&E PMID 40961952; SELECT Lincoff 2023 NEJM PMID 37952131 (NCT03574597); retatrutide Ph2 Jastreboff 2023 NEJM PMID 37366315; retatrutide TRIUMPH-1 Ph3 topline (Lilly PR 2026-05-21, NCT05929066); CagriSema REDEFINE-1 Garvey 2025 NEJM PMID 40544433; CagriSema REDEFINE-T2 (NCT06131437, ADA 2026); MariTide Ph2 Jastreboff 2025 NEJM PMID 40549887 (NCT05669599); survodutide SYNCHRONIZE-1 topline (BI PR 2026-04-28, NCT06066515); petrelintide ZUPREME-1 ADA 2026 (Zealand/Roche PR 2026-06-05, NCT06662539); amycretin SC Dahl 2025 Lancet PMID 40550231; amycretin oral Gasiorek 2025 Lancet PMID 40550229; orforglipron ATTAIN-1 Wharton 2025 NEJM PMID 40960239; orforglipron ATTAIN-2 Horn 2027 Lancet PMID 41275875. WS12 events 13, 106, 252–253; macro signal_id 106.*
