// Repo-owned SoC presentation profiles. Relocated OUT of the synced ETLM JSON
// (2026-07-02) so a WS9 re-sync can never clobber the display config. Keyed by
// indication code. getProfile() and the build-integrity gate both read from here;
// presentation_profile is stripped from the client bundle on sync.
import type { PresentationProfile } from '../presentationProfile';

export const PROFILE_OVERRIDES: Record<string, PresentationProfile> = {
  "nhl_dlbcl": {
    "schema_version": 1,
    "curated_by_skill": true,
    "curated_by": "etlm-curator (nhl_dlbcl)",
    "cut_rationale": "DLBCL/NHL efficacy is comparable only WITHIN a class and line, so Target + Line are the read axes that group the field into CD19 CAR-T, CD20xCD3 bispecific, CD79b/CD19 ADC, chemoimmunotherapy, and BTKi/BCL2 orals; the ORR->mPFS->mOS triple shows response depth-> durability->survival. Every registrational trial here is single-arm, so rows are CROSS-TRIAL ONLY and NOT head-to-head (a one-time CAR-T ORR is not comparable to a chemoimmunotherapy ORR). CR -- the value-driving endpoint for CAR-T and bispecifics -- is a data gap (cr_pct keyed on only 2/32 rows), so no CR column is shown rather than render 30 misleading blanks; mOS is blank where OS is immature / not-reached, common in the curative-intent CAR-T and bispecific rows.",
    "headline_table": {
      "source": "approved_therapies",
      "columns": [
        {
          "key": "asset",
          "label": "Asset",
          "from": "field",
          "path": "brand|drug_name|asset_name"
        },
        {
          "key": "sponsor",
          "label": "Sponsor",
          "from": "field",
          "path": "company|sponsor"
        },
        {
          "key": "target",
          "label": "Target",
          "from": "field",
          "path": "target"
        },
        {
          "key": "line",
          "label": "Line / setting",
          "from": "field",
          "path": "indication_line"
        },
        {
          "key": "orr",
          "label": "ORR",
          "align": "right",
          "from": "metric",
          "object": "key_efficacy",
          "match": "orr",
          "pick": "first",
          "format": "pct"
        },
        {
          "key": "mpfs",
          "label": "mPFS",
          "align": "right",
          "from": "metric",
          "object": "key_efficacy",
          "match": "pfs",
          "pick": "first",
          "format": "mo"
        },
        {
          "key": "mos",
          "label": "mOS",
          "align": "right",
          "from": "metric",
          "object": "key_efficacy",
          "match": "median_os",
          "pick": "first",
          "format": "mo"
        },
        {
          "key": "fda",
          "label": "FDA",
          "from": "field",
          "path": "fda_approval_date",
          "format": "yyyy-mm"
        }
      ]
    },
    "caveats": [
      {
        "match_field": "modality",
        "match_regex": "CAR[- ]?T",
        "tag": "cell therapy (single-arm)",
        "why": "One-time autologous CD19 CAR-T; registrational data is single-arm -- comparable only cross-trial, never head-to-head with chemoimmunotherapy or bispecifics."
      },
      {
        "match_field": "modality",
        "match_regex": "bispecific",
        "tag": "T-cell engager (single-arm)",
        "why": "CD20xCD3 T-cell engager; single-arm registrational data -- cross-trial comparison only; OS frequently immature at approval."
      },
      {
        "match_field": "modality",
        "match_regex": "1st[- ]?gen",
        "tag": "superseded",
        "why": "First-generation agent displaced within its class (e.g. 1st-gen covalent BTKi superseded by 2nd-gen / non-covalent BTKi)."
      }
    ],
    "endpoint_glossary": {
      "ORR": "Objective response rate -- depth of response; reported on nearly all rows (29/32).",
      "CR": "Complete response -- the value-driving endpoint for CAR-T and bispecifics; currently keyed on only 2/32 approved rows (analyst data gap), so shown here as context, not as a column.",
      "mPFS": "Median progression-free survival, months (durability); blank where not reported.",
      "mOS": "Median overall survival, months; blank where OS not yet mature / not reached -- common in curative-intent CAR-T and bispecific rows."
    }
  },
  "obesity": {
    "schema_version": 1,
    "curated_by": "build_presentation_profiles.py (template baseline)",
    "headline_table": {
      "source": "approved_therapies_novel",
      "columns": [
        {
          "key": "asset",
          "label": "Asset",
          "from": "field",
          "path": "brand|drug_name|asset_name"
        },
        {
          "key": "sponsor",
          "label": "Sponsor",
          "from": "field",
          "path": "company|sponsor"
        },
        {
          "key": "target",
          "label": "Target",
          "from": "field",
          "path": "target"
        },
        {
          "key": "route",
          "label": "Route",
          "from": "derive",
          "deriver": "route_from_modality"
        },
        {
          "key": "tbwl",
          "label": "TBWL%",
          "align": "right",
          "from": "metric",
          "object": "custom_efficacy",
          "match": "tbwl",
          "pick": "latest_week",
          "format": "pct"
        },
        {
          "key": "nausea",
          "label": "Nausea%",
          "align": "right",
          "from": "metric",
          "object": "custom_safety",
          "match": "nausea",
          "pick": "first",
          "format": "pct"
        },
        {
          "key": "fda",
          "label": "FDA",
          "from": "field",
          "path": "fda_approval_date",
          "format": "yyyy-mm"
        }
      ]
    },
    "collapse": [
      {
        "section": "approved_therapies_legacy",
        "mode": "class_summary",
        "lead": "Pre-incretin oral agents. Efficacy ceiling ~3-8% total body-weight loss versus 15-23% for the incretin class - commercially displaced. Retained relevance: low-cost generics, payer step-therapy, and contraindication / adolescent niches",
        "line_metric": {
          "object": "custom_efficacy",
          "match": "tbwl",
          "pick": "latest_week",
          "format": "pct"
        }
      }
    ],
    "caveats": [
      {
        "match_field": "indication_line",
        "match_regex": "genetic|monogenic|syndrom|hypothalamic|POMC|LEPR|PCSK1|Bardet",
        "tag": "rare genetic",
        "why": "Different population from mass-market incretins; efficacy not directly comparable"
      }
    ],
    "endpoint_glossary": {
      "TBWL%": "Total body-weight loss, on-treatment, latest reported timepoint",
      "Nausea%": "All-grade nausea incidence, pivotal trial"
    }
  },
  "nsclc": {
    "schema_version": 1,
    "curated_by_skill": true,
    "curated_by": "etlm-curator (nsclc)",
    "cut_rationale": "NSCLC is the most biomarker-segmented solid tumor (25 approved across EGFR/ALK/KRAS-G12C/MET/RET/ROS1/NRG1/TROP2 + IO + chemo). Efficacy is comparable only WITHIN a target segment and line, so Target is the primary read axis (sort by it to group segments); the ORR -> mPFS -> mOS triple shows depth -> durability -> survival within each. First-gen TKIs are flagged superseded",
    "headline_table": {
      "source": "approved_therapies",
      "columns": [
        {
          "key": "asset",
          "label": "Asset",
          "from": "field",
          "path": "brand|drug_name|asset_name"
        },
        {
          "key": "sponsor",
          "label": "Sponsor",
          "from": "field",
          "path": "company|sponsor"
        },
        {
          "key": "target",
          "label": "Target",
          "from": "field",
          "path": "target"
        },
        {
          "key": "line",
          "label": "Line / setting",
          "from": "field",
          "path": "indication_line"
        },
        {
          "key": "orr",
          "label": "ORR",
          "align": "right",
          "from": "metric",
          "object": "key_efficacy",
          "match": "orr",
          "pick": "first",
          "format": "pct"
        },
        {
          "key": "mpfs",
          "label": "mPFS",
          "align": "right",
          "from": "metric",
          "object": "key_efficacy",
          "match": "pfs",
          "pick": "first",
          "format": "mo"
        },
        {
          "key": "mos",
          "label": "mOS",
          "align": "right",
          "from": "metric",
          "object": "key_efficacy",
          "match": "median_os",
          "pick": "first",
          "format": "mo"
        },
        {
          "key": "fda",
          "label": "FDA",
          "from": "field",
          "path": "fda_approval_date",
          "format": "yyyy-mm"
        }
      ]
    },
    "caveats": [
      {
        "match_field": "target",
        "match_regex": "1st gen|1st-gen",
        "tag": "superseded",
        "why": "First-generation TKI; displaced within its segment by a next-gen agent (e.g. osimertinib for EGFR)"
      }
    ],
    "endpoint_glossary": {
      "ORR": "Objective response rate (depth of response)",
      "mPFS": "Median progression-free survival, months (durability)",
      "mOS": "Median overall survival, months; blank where OS not yet mature"
    }
  },
  "mm": {
    "schema_version": 1,
    "curated_by_skill": true,
    "curated_by": "etlm-curator (mm)",
    "cut_rationale": "Myeloma is not a one-shot tumour: it is a sequence of lines, and an efficacy number is interpretable only against the line it was earned in. Line / setting is therefore the primary read axis and Target is the secondary one, grouping the field into the IMiD / PI / anti-CD38 backbone that defines frontline (NDMM ORR 76-93%) and the BCMA- and GPRC5D-directed T-cell redirection wave that defines late relapse (4L+ triple-class-exposed ORR 61-74%) - a 93% and a 63% on this page are NOT the same claim. The ORR -> mPFS -> mOS triple reads depth -> durability -> survival within a line. Depth-of-response (>=CR, MRD-negativity) is the endpoint myeloma actually trades on, and it is DELIBERATELY NOT a column: cr / MRD keys are populated on 0 of 19 approved rows (they exist only in the line-level benchmark grid, and only once), so a CR column would render 19 blanks and imply the responses are shallow. Every registrational dataset behind the CAR-T and bispecific rows is cross-trial, never head-to-head. A blank mOS is a statement about follow-up, not about the drug - see the glossary.",
    "headline_table": {
      "source": "approved_therapies",
      "order_by": ["Revlimid", "Velcade", "Darzalex", "Sarclisa", "Carvykti", "Abecma", "Tecvayli", "Talvey", "Elrexfio", "Lynozyfic"],
      "columns": [
        {
          "key": "asset",
          "label": "Asset",
          "from": "field",
          "path": "brand|drug_name|asset_name"
        },
        {
          "key": "sponsor",
          "label": "Sponsor",
          "from": "field",
          "path": "company|sponsor"
        },
        {
          "key": "target",
          "label": "Target",
          "from": "field",
          "path": "target"
        },
        {
          "key": "line",
          "label": "Line / setting",
          "from": "field",
          "path": "indication_line"
        },
        {
          "key": "orr",
          "label": "ORR",
          "align": "right",
          "from": "metric",
          "object": "key_efficacy",
          "match": "orr",
          "pick": "first",
          "format": "pct"
        },
        {
          "key": "mpfs",
          "label": "mPFS",
          "align": "right",
          "from": "metric",
          "object": "key_efficacy",
          "match": "pfs",
          "pick": "first",
          "format": "mo"
        },
        {
          "key": "mos",
          "label": "mOS",
          "align": "right",
          "from": "metric",
          "object": "key_efficacy",
          "match": "median_os",
          "pick": "first",
          "format": "mo"
        },
        {
          "key": "fda",
          "label": "FDA",
          "from": "field",
          "path": "fda_approval_date",
          "format": "yyyy-mm"
        }
      ]
    },
    "caveats": [
      {
        "match_field": "indication_line",
        "match_regex": "withdrawn",
        "tag": "withdrawn",
        "why": "No longer marketed - panobinostat voluntarily withdrawn 2022; melphalan flufenamide withdrawn 2021 after the OCEAN Ph3 OS detriment. Retained as a historical benchmark, not a live comparator."
      },
      {
        "match_field": "modality",
        "match_regex": "CAR[- ]?T",
        "tag": "one-time cell therapy",
        "why": "Autologous BCMA CAR-T: a single infusion after apheresis, bridging and manufacturing, delivered only at REMS-certified centres. Response rates are reported on infused / ITT populations that are not the same denominator as a chronically dosed drug, and OS is typically immature at approval - read against continuous therapy with that in mind."
      },
      {
        "match_field": "modality",
        "match_regex": "bispecific",
        "tag": "T-cell engager (single-arm)",
        "why": "BCMA x CD3 or GPRC5D x CD3 T-cell engager approved on single-arm data in a 4L+ triple-class-exposed population, with step-up dosing, CRS / ICANS and infection risk. Cross-trial comparison only - never head-to-head, and never against a frontline ORR."
      },
      {
        "match_field": "indication_line",
        "match_regex": "off-patent|generic|superseded|historical",
        "tag": "generic backbone",
        "why": "Off-patent or superseded agent. Its number is a combination-backbone figure from an older trial era, so it sets the cost floor and the comparator arm rather than the efficacy frontier."
      }
    ],
    "endpoint_glossary": {
      "ORR": "Overall response rate (>= partial response, IMWG criteria) - populated on 19/19 approved rows, so it is the only endpoint that resolves for the whole table. Comparable only within a line: frontline combinations sit at 76-96%, 4L+ monotherapy at 24-74%.",
      ">=CR / sCR": "Complete or stringent complete response - with MRD, the depth-of-response endpoint myeloma value actually turns on. NOT shown as a column: no approved row carries a CR key (0/19), and it appears once in the line-level benchmark grid (CEPHEUS, >=CR 81.2%, where no labelled ORR exists). Shown as context rather than 19 blank cells; escalated to the analyst as a data gap.",
      "MRD-negativity": "Minimal residual disease negativity at 10^-5 by NGS/NGF - the accelerated-approval-relevant surrogate in NDMM. Also 0/19 on approved rows (present only in benchmark prose, e.g. CEPHEUS 60.9%), so no column.",
      "mPFS": "Median progression-free survival, months; 15/19 rows. Blank where the pivotal analysis did not report a median - either because it was not reached at the data cut (cilta-cel / CARTITUDE-4, linvoseltamab) or because the trial era reported time-to-progression instead (bortezomib / APEX).",
      "mOS": "Median overall survival, months; 11/19 rows. A BLANK IS NOT ABSENT DATA AND NOT A ZERO - in myeloma OS is routinely not reached (NR) or still immature at the reported analysis, which is exactly what you expect of the frontline (daratumumab / MAIA: mOS not reached in the D-Rd arm) and of the recently approved CAR-T and bispecific rows. Read a blank as 'not reached / follow-up too short', and read the mPFS and ORR alongside it."
    }
  },
  "crc": {
    "schema_version": 1,
    "curated_by_skill": true,
    "curated_by": "etlm-curator (crc)",
    "cut_rationale": "mCRC is biomarker-segmented before it is line-segmented, so the read axes are Target (EGFR / BRAF V600E / HER2 / KRAS G12C / PD-1 / VEGF-VEGFR / NTRK-RET) and Line-setting, which carries the MSI-H-dMMR vs MSS and RAS-WT vs RAS-mut split; sort by Target to group the field into comparable segments, because an MSI-H IO ORR and an MSS third-line anti-angiogenic ORR are not the same question. Within a segment the ORR -> mPFS -> mOS triple reads depth -> durability -> survival. Rows are CROSS-TRIAL ONLY: most segment registrations are single-arm or small randomised subsets, so nothing here is head-to-head. Trial is shown as a column because several rows were recently de-conflated (DESTINY-CRC02 not CRC01; CRYSTAL and FIRE-3 split; BEACON re-anchored to the JCO 2021 analysis) and the number is only interpretable against the study that produced it. Pre-2023 approvals are tagged as SoC anchors so the established backbone is visually separable from the 2023+ frontier (BREAKWATER, MOUNTAINEER, Enhertu, CodeBreaK 300, KRYSTAL-1, Fruzaqla, CheckMate 8HW). Perioperative rows are tagged rather than given their own columns: the curative-intent endpoints (pCR, DFS, EFS) are keyed on 0/26 approved rows and live only as prose in efficacy_benchmarks_by_line, so an EFS/DFS/pCR column would render 26 blanks. Two accepted limitations are carried rather than engineered around: efficacy_benchmarks_by_line stores each line/segment as a prose string, so that section renders as text and not as a comparable table; and no safety counterweight column is shown because custom_safety / key_safety resolve on 0/26 approved rows.",
    "headline_table": {
      "source": "approved_therapies",
      "columns": [
        {
          "key": "asset",
          "label": "Asset",
          "from": "field",
          "path": "brand|drug_name|asset_name"
        },
        {
          "key": "sponsor",
          "label": "Sponsor",
          "from": "field",
          "path": "company|sponsor"
        },
        {
          "key": "target",
          "label": "Target",
          "from": "field",
          "path": "target"
        },
        {
          "key": "line",
          "label": "Line / setting",
          "from": "field",
          "path": "indication_line"
        },
        {
          "key": "trial",
          "label": "Pivotal trial",
          "from": "field",
          "path": "trial"
        },
        {
          "key": "orr",
          "label": "ORR",
          "align": "right",
          "from": "metric",
          "object": "key_efficacy",
          "match": "orr",
          "pick": "first",
          "format": "pct"
        },
        {
          "key": "mpfs",
          "label": "mPFS",
          "align": "right",
          "from": "metric",
          "object": "key_efficacy",
          "match": "pfs",
          "pick": "first",
          "format": "mo"
        },
        {
          "key": "mos",
          "label": "mOS",
          "align": "right",
          "from": "metric",
          "object": "key_efficacy",
          "match": "median_os",
          "pick": "first",
          "format": "mo"
        },
        {
          "key": "fda",
          "label": "FDA",
          "from": "field",
          "path": "fda_approval_date",
          "format": "yyyy-mm"
        }
      ]
    },
    "caveats": [
      {
        "match_field": "target",
        "match_regex": "NTRK|RET fusion",
        "tag": "tumour-agnostic (CRC subset)",
        "why": "Approved on a pan-tumour basket, not a CRC-powered trial; the ORR shown is from a small CRC subset of a pooled basket population (NTRK and RET fusions are <1% of CRC), so it is not comparable to a CRC registrational number."
      },
      {
        "match_field": "indication_line",
        "match_regex": "adjuvant|neoadjuvant|periop",
        "tag": "perioperative + metastatic",
        "why": "Also used with curative intent (adjuvant Stage III / neoadjuvant rectal TNT). The ORR / mPFS / mOS shown are the METASTATIC-setting values; the curative-intent endpoints for this row (pCR, DFS, EFS -- e.g. MOSAIC, X-ACT, PRODIGE-23, PROSPECT) are not keyed on the asset record and appear only as prose under efficacy_benchmarks_by_line."
      },
      {
        "match_field": "modality",
        "match_regex": "cytotoxic|fluoropyrimidine|platinum|topoisomerase",
        "tag": "chemo backbone",
        "why": "Cytotoxic backbone rather than a segment-targeted agent; its numbers are the all-comers baseline every biomarker-selected row above is measured against, not a competitor within a segment."
      },
      {
        "match_field": "fda_approval_date",
        "match_regex": "^(19|200|201|202[0-2])",
        "tag": "SoC anchor (pre-2023)",
        "why": "Pre-2023 approval -- an established standard-of-care anchor, not current frontier data. Retained because payer pathways and control arms are still built on these agents; read the 2023+ untagged rows (BREAKWATER, MOUNTAINEER, Enhertu, CodeBreaK 300, KRYSTAL-1, Fruzaqla, CheckMate 8HW) as the moving edge."
      }
    ],
    "endpoint_glossary": {
      "ORR": "Objective response rate, % (depth of response); keyed on 24/26 approved rows. Blank for bevacizumab (backbone add-on, PFS/OS-defined) and oxaliplatin (component, not a standalone regimen).",
      "mPFS": "Median progression-free survival, months (durability); keyed on 24/26 rows.",
      "mOS": "Median overall survival, months; keyed on 22/26 rows -- blank where OS was not reached or was immature at the reported analysis (CheckMate 142, CheckMate 8HW, LIBRETTO-001 CRC subset).",
      "pCR / DFS / EFS": "Pathological complete response, disease-free and event-free survival -- the endpoints that actually govern the perioperative rows. Keyed on 0/26 approved rows, so deliberately NOT shown as columns; they appear as prose under efficacy_benchmarks_by_line (neoadjuvant_rectal_TNT, neoadjuvant_dMMR_colon, neoadjuvant_dMMR_rectal, adjuvant_Stage_III).",
      "MSI-H / dMMR vs MSS": "The primary segmentation of CRC. MSI-H/dMMR (~5% of metastatic) is IO-responsive -- KEYNOTE-177, CheckMate 142/8HW. MSS (~95%) is IO-refractory and is where the anti-EGFR, anti-angiogenic and segment-targeted (BRAF/HER2/KRAS G12C) rows live. Read the two groups as separate markets, never as one ORR ranking.",
      "RAS-WT / RAS-mut": "Anti-EGFR agents (cetuximab, panitumumab, and the EGFR half of the KRAS G12C and HER2 combinations) require RAS wild-type and are preferentially used in left-sided primaries; RAS-mut or right-sided disease routes to a bevacizumab-based backbone."
    }
  },
} as unknown as Record<string, PresentationProfile>;
