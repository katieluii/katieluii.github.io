// Repo-owned SoC presentation profiles. Relocated OUT of the synced ETLM JSON
// (2026-07-02) so a WS9 re-sync can never clobber the display config. Keyed by
// indication code. getProfile() and the build-integrity gate both read from here;
// presentation_profile is stripped from the client bundle on sync.
import type { PresentationProfile } from '../presentationProfile';

export const PROFILE_OVERRIDES: Record<string, PresentationProfile> = {
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
  }
} as unknown as Record<string, PresentationProfile>;
