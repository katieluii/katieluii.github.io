export type ProjectTheme = "AI/ML & Automation" | "Bioscience Research" | "Investing" | "Biotech/Biopharma Strategy";
export type ProjectStatus = "Live" | "WIP" | "Archived";

export interface ProjectLinks {
  live?: string;
  pdf?: string;
  posterPdf?: string;
  repo?: string;
}

export interface ProjectSection {
  title: string;
  bullets?: string[];
  images?: Array<{ src: string; alt: string; caption?: string }>;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  themes: ProjectTheme[];
  status: ProjectStatus;
  yearStart: number;
  yearEnd: number;
  summary: string;
  longDescription?: string;
  tags: string[];
  links: ProjectLinks;
  sections?: ProjectSection[];
  hideFromTimeline?: boolean;
  order?: number;
}

export const projects: Project[] = [
  {
    id: "oxford-placement",
    slug: "oxford-placement-research",
    title: "Professional Placement Year @ University of Oxford",
    themes: ["Bioscience Research"],
    status: "Archived",
    yearStart: 2019,
    yearEnd: 2020,
    summary: "Investigated glutamate-related metabolic perturbations in TSC using preclinical iPSC-derived models; focused on astrocytes and mTOR signaling.",
    longDescription: "In the Cader group (Prof Zameel Cader), I developed and benchmarked an in-vitro workflow to study astrocyte biology relevant to tuberous sclerosis complex (TSC), where mTOR pathway dysregulation and astrocyte dysfunction are linked to neurodevelopmental phenotypes (including seizures). The project focused on building the model system first: differentiating human stem cells toward astrocytes using two protocols (a kit-based approach and a serum-driven method), then assessing maturity with immunofluorescence and qRT-PCR using astroglial markers (e.g., GFAP, S100β, EAAT1/EAAT2). Alongside differentiation, I optimised functional assays that let you interrogate pathway state and glutamate metabolism in a way that’s scalable for disease modelling: (1) probing mTORC1 signalling dynamics under nutrient stress by measuring pS6:S6 in astrocytes, and (2) tuning a glutamate uptake assay to compare astrocyte mono-cultures versus neuron-astrocyte co-cultures -- showing faster glutamate clearance in the co-culture context, consistent with neuron-glia functional coupling. This groundwork produces a repeatable platform for testing how metabolic perturbations shift astrocyte function in TSC-relevant systems.",
    tags: ["iPSCs/hESCs", "Astrocytes", "mTOR Pathway", "Tuberous Sclerosis Complex", "Glutamate Metabolism", "In vitro"],
    links: {
      pdf: "/pdfs/oxford-placement-dissertation.pdf",
      posterPdf: "/pdfs/oxford-poster.pdf"
    }
  },
  {
    id: "kcl-masters",
    slug: "kcl-masters-research",
    title: "Master's Research Project @ King's College London",
    themes: ["Bioscience Research"],
    status: "Archived",
    yearStart: 2020,
    yearEnd: 2021,
    summary: "Bioinformatics-driven drug repositioning in Parkinson's disease, focusing on the PARK2/PINK1 pathway and mitochondrial dysfunction.",
    longDescription: "In my Master's project at Prof Susan Duty's lab, I built a targeted drug-repositioning workflow to surface existing, clinically used compounds that could modify Parkinson’s disease (PD) biology by boosting mitochondrial quality control through the PINK1/Parkin (PINK1/PARK2) pathway. Starting from large-scale transcriptional perturbation resources (CMap + LINCS accessed via SPIED3), I designed a stepwise filtering strategy (upregulation strength → BBB suitability → chronic-use safety → clinical utility) to move from dozens of in-silico “hits” to a short, defensible set of candidates. To validate signal beyond gene-expression predictions, I took the finalists into wet-lab testing and quantified PINK1 and Parkin protein changes after treatment using western blotting in MCF-7 cells. The pipeline converged on three repurposing candidates (ethotoin, oxybutynin, sirolimus), each significantly increasing Parkin expression, with sirolimus additionally increasing PINK1 -- creating a practical bridge from bioinformatics screening to experimentally supported hypotheses for neuroprotection in PD models.",
    tags: ["Bioinformatics", "Drug Repositioning", "Parkinson's Disease", "Neurodegeneration", "Mitochondrial Dysfunction", "PARK2(Parkin)/PINK1"],
    links: {
      pdf: "/pdfs/kcl-masters-dissertation.pdf"
    }
  },
  {
    id: "sec13f",
    slug: "sec-13f-tracker",
    title: "SEC 13F Fund Analysis",
    themes: ["Investing", "AI/ML & Automation"],
    status: "Live",
    yearStart: 2024,
    yearEnd: 2024,
    summary: "Interactive dashboard tracking institutional investor holdings from SEC 13F filings with quarter-over-quarter analysis.",
    longDescription: "Analysis of portfolio concentration metrics from SEC EDGAR 13F filings. Visualises fund holdings, concentration levels, and risk indicators across institutional investors. Features automated data pipeline with Python, quarterly updates via GitHub Actions, and interactive React visualization.",
    tags: ["Python", "Pandas", "SEC EDGAR API", "ETL", "XML Parsing"],
    links: {
      live: "/sec-13f"
    }
  },
  {
    id: "trial-recruitment",
    slug: "trial-recruitment-prediction",
    title: "ML-driven Trial Recruitment Prediction",
    themes: ["AI/ML & Automation", "Biotech/Biopharma Strategy"],
    status: "Live",
    yearStart: 2024,
    yearEnd: 2025,
    summary: "Phase-specific ML workflow predicting clinical trial time-to-completion as a proxy for recruitment rate; engineered operational + design features and benchmarked non-linear models.",
    longDescription: "This project builds a phase-specific ML workflow to predict how long a clinical trial will take to reach primary completion, used as a practical proxy for recruitment rate. Using ClinicalTrials.gov data enriched with AACT, I engineered operational and design features (e.g, endpoints, arms, sites, region, therapeutic area) and benchmarked multiple non-linear models to support more scalable, data-driven feasibility estimates. Attached report has been redacted to prevent disclosure of proprietary information.",
    tags: ["ML", "Python", "scikit-learn", "XGBoost", "LightGBM", "Optuna", "PostgreSQL"],
    links: {
      live: "/trial-recruitment",
      pdf: "/pdfs/trial-ML-project.pdf"
    }
  },
    {
    id: "news-digest-agents",
    slug: "news-digest-agents",
    title: "Industry News Digest Agents",
    themes: ["AI/ML & Automation"],
    status: "Live",
    hideFromTimeline: true,
    yearStart: 2026,
    yearEnd: 2026,
    summary:
      "Daily crypto + biopharma news agents with modular ingestion, dedupe + coverage QA gates, and clean HTML email delivery.",
    longDescription:
      "I built two daily news agents that turn noisy domain headlines into a consolidated and comprehensive source-linked morning brief, with further potential for theme-specific specification. Each workflow ingests from curated RSS feeds, dedupes and time-filters items, then uses an LLM summariser to collapse overlapping coverage into a tight set of clickable headlines with timestamps and 1-2 line factual summaries.\n\nFor crypto, a second LLM QA step cross-checks against Google Programmable Search results and flags major missing stories with links. Both workflows generate clean HTML + plain-text email output and deliver via SMTP.",
    tags: [
      "n8n",
      "RSS",
      "LLM Summarization",
      "Prompt Engineering",
      "LLM QA"
    ],
    links: {},
    sections: [
      {
        title: "Biopharma pipeline",
        bullets: [
          "Daily RSS ingestion from FierceBiotech, FiercePharma, Labiotech, Endpoints, and BioCentury",
          "Recency filter keeps only today/yesterday (UTC) to stay current",
          "Deduplicates overlapping coverage before summarization",
          "LLM outputs structured headline items (title, 1-2 line factual summary, source URL/domain, published UTC)",
          "Generates both a skimmable bullets section and a short narrative digest",
          "Builds sanitized HTML + plain-text email and sends via SMTP",
        ],
        images: [
          {
            src: "/images/n8n/biopharma-digest.png",
            alt: "Biopharma news digest workflow",
            caption: "Daily pipeline: RSS → dedupe → LLM summarize → HTML email",
          },
        ],
      },
      {
        title: "Crypto pipeline",
        bullets: [
          "Two-stream ingestion: RSS feeds + Google Programmable Search (CSE) restricted to major outlets (~48h window)",
          "Persistent dedupe (stored IDs) + time-window filter (last ~3 days) to reduce noise",
          "LLM summariser de-duplicates stories and outputs linkable headline bullets with timestamps + short factual summaries",
          "Second LLM QA pass compares digest vs CSE results to estimate coverage and flag missing major headlines (with links)",
          "Assembles clean HTML + plain-text email with sources + “coverage check” section",
          "Sends daily digest via SMTP",
        ],
        images: [
          {
            src: "/images/n8n/crypto-digest.png",
            alt: "Crypto news digest workflow",
            caption: "Multi-source pipeline: RSS + CSE → QA coverage gate → LLM → email",
          },
        ],
      },
    ],
  },
  {
    id: "biotech-fundraising",
    slug: "biotech-fundraising-tracker",
    title: "Biotech Fundraising Tracker",
    themes: ["AI/ML & Automation", "Investing", "Biotech/Biopharma Strategy"],
    status: "Live",
    yearStart: 2025,
    yearEnd: 2026,
    summary:
      "Live tracker of private biotech financing rounds — daily RSS ingestion, Claude Haiku classification, and a filterable deal feed with round-type, therapeutic area, and amount filters.",
    longDescription:
      "I built this tool to continuously monitor private biotech fundraising from five daily RSS sources. Claude Haiku runs a strict inclusion filter to keep only private, therapeutic-asset-centric financings — pre-seed through Series G, venture rounds, convertible notes, debt financing, and NIH/BARDA grants — explicitly excluding public-market transactions (IPOs, shelf offerings), M&A deals, and platform-only raises. Each deal is tagged with therapeutic area, round type, disclosed amount normalised to USD, and lead investor. A FastAPI backend stores all deals in SQLite and serves a filterable feed; a React frontend shows deal cards, a monthly trends chart, and round-type filter chips.",
    tags: ["Python", "Claude API", "FastAPI", "SQLite", "RSS", "React"],
    links: { live: "/biotech-fundraising" },
  },
  {
    id: "clinical-news-monitor",
    slug: "clinical-news-monitor",
    title: "Clinical Development Monitoring Agent",
    themes: ["AI/ML & Automation", "Biotech/Biopharma Strategy"],
    status: "Live",
    order: 1,
    yearStart: 2026,
    yearEnd: 2026,
    summary: "LLM-powered agent that fetches clinical development news from RSS feeds and extracts structured events — data readouts, regulatory decisions, pipeline changes — bucketed by therapeutic area, indication, and sponsor.",
    longDescription: "A Python agent that ingests biopharma news from public RSS feeds (FierceBiotech, BioPharma Dive, STAT, Endpoints), uses LLM to extract structured clinical development events, and stores them in SQLite. Each article is categorised as a data readout, regulatory approval, or pipeline change (with sub-type: added / licensed / dropped / deprioritised), and tagged with therapeutic area, indication, sponsor, and asset name. A FastAPI backend serves the digest with category and TA filters. Designed as a context feed for the investment memo agent (WS4).",
    tags: ["Python", "LLM", "FastAPI", "SQLite", "RSS"],
    links: { live: "/clinical-news" },
  },
 {
    id: "investment-memo-agent",
    slug: "investment-memo-agent",
    title: "Multi-Agent Investment Memo Generation Tool",
    themes: ["AI/ML & Automation", "Investing", "Biotech/Biopharma Strategy"],
    status: "Live",
    order: 2,
    yearStart: 2026,
    yearEnd: 2026,
    summary: "A multi-agent investment memo generation tool for biotech VCs — upload proprietary documents, run six specialist analyst agents, add your own intelligence at human checkpoints, and generate a structured investment memo.",
    longDescription: "A multi-agent investment memo generation tool built for biotech VCs. Six specialised analyst agents — fund-fit, scientific diligence, competitive intelligence, clinical & regulatory, financing & valuation, and IP / freedom-to-operate — combine publicly available biopharma intelligence with your proprietary documents to surface opportunities, risks, and diligence questions. Human checkpoints let analysts inject network intelligence, founder meeting notes, and a structured team assessment before generating a structured Markdown investment memo.",
    tags: ["LLM", "FastAPI", "SQLite", "SQLAlchemy", "Next.js"],
    links: { live: "/investment-memo" },
  },
  {
    id: "obesity-stock-analysis",
    slug: "obesity-stock-analysis",
    title: "Obesity M&A and Competitive Landscape Tracker",
    themes: ["AI/ML & Automation", "Biotech/Biopharma Strategy"],
    status: "Live",
    yearStart: 2025,
    yearEnd: 2026,
    summary: "Competitive landscape tool for the obesity pharma space — stock charts with clinical catalyst overlays, live pipeline from ClinicalTrials.gov, ARIMA forecasting, and M&A dry-powder analysis across 9 companies.",
    longDescription: "I built a full-stack competitive intelligence tool for the GLP-1/obesity pharma space, covering nine companies (Novo Nordisk, Eli Lilly, Viking Therapeutics, Amgen, AstraZeneca, Roche, Structure Therapeutics, Altimmune, Zealand Pharma). Stock Charts tab tracks 3-year price history with SMA-50/200, ARIMA 30-day forecast with confidence intervals, and primary trial completion dates overlaid as catalyst markers -- all sourced live from yfinance and ClinicalTrials.gov. On the Pipeline tab, we see a competitive pipeline pulled directly from ClinicalTrials.gov, filterable by phase and company, linked to each NCT study. The M&A Signals tab shows the balance-sheet dry-powder ranking (net cash, FCF, market cap) to surface which large-caps have the capital to be the next to acquire obesity assets/biotech companies.",
    tags: ["Python", "statsmodels", "Time Series Forecasting", "ARIMA", "FastAPI"],
    links: { live: "/obesity-stocks" },
  },
  {
    id: "conference-catalyst-monitor",
    slug: "conference-catalyst-monitor",
    title: "Biotech Conference Catalyst Monitor",
    themes: ["AI/ML & Automation", "Biotech/Biopharma Strategy"],
    status: "Live",
    order: 3,
    yearStart: 2026,
    yearEnd: 2026,
    summary: "Give it the indications you cover; it tracks the Phase 2/3 trials reading out at ASCO, ESMO, AACR, and ASH for exactly those, attaches each abstract, and extracts the primary-endpoint result plus key efficacy numbers (ORR, mPFS, OS, hazard ratios) — a focused watchlist, not a catch-all.",
    longDescription: "An indication-scoped readout tracker for the four major oncology/hematology congresses (ASCO, ESMO, AACR, ASH). Rather than ingesting every abstract, it takes a coverage list — here, the indications our drug-development analysts follow — and pulls only the Phase 2/3 trials in those indications from ClinicalTrials.gov by primary-completion window. When a meeting releases its programme, the matching abstract is attached to each tracked asset and an LLM extracts the numbers that move the read: whether the primary endpoint was met, plus ORR, mPFS, OS, hazard ratios and p-values. The frontend renders an asset database scoped to your coverage, with the endpoint result and key data surfaced inline and expandable rows for the full abstract.",
    tags: ["Python", "FastAPI", "LLM", "SQLite", "React", "Railway"],
    links: { live: "/conference-catalyst" },
  },
  {
    id: "atlas-drug-dev-analyst",
    slug: "atlas-drug-dev-analyst",
    title: "Atlas — Strategic intelligence for drug development",
    themes: ["AI/ML & Automation", "Biotech/Biopharma Strategy"],
    status: "Live",
    order: 4,
    yearStart: 2026,
    yearEnd: 2026,
    summary: "Atlas tracks every indication in your scope — approvals, pipeline, data readouts, and regulatory moves — and produces deliverables for your teams. You get a decision, not a reading list.",
    longDescription: "Atlas holds a living strategic intelligence layer per indication — the Emerging Therapeutic Landscape Map (ETLM) — built from clinical registries, peer-reviewed literature, trade press, and conference readouts. From that intelligence layer it generates the strategic outputs your team needs, and returns evidence-anchored verdicts to strategic questions with the citations already organised. The output is a decision, not a reading list.",
    tags: ["LLM", "Multi-agent", "Python"],
    links: { live: "/atlas-drug-dev-analyst" },
  },
  {
    id: "atlas-reader",
    slug: "atlas-reader",
    title: "Atlas Reader — sample deliverables",
    themes: ["AI/ML & Automation", "Biotech/Biopharma Strategy"],
    status: "WIP",
    hideFromTimeline: true,
    yearStart: 2026,
    yearEnd: 2026,
    summary: "Redacted preview of what Atlas's deliverables look like — landscape maps, target product profiles, and class-level theses, with cross-links between them.",
    tags: ["React", "Vite", "Markdown"],
    links: { live: "/atlas-reader" },
  },
  {
    id: "ai-biopharma-feed",
    slug: "ai-biopharma-feed",
    title: "AI Deal Monitoring Agent",
    themes: ["AI/ML & Automation", "Investing"],
    status: "Live",
    yearStart: 2025,
    yearEnd: 2026,
    summary: "Live monitor of AI adoption across biopharma — RSS ingestion, LLM relevance filtering, and structured deal/entity extraction surfacing AI partnerships, acquisitions, and platform collaborations.",
    longDescription: "An AI-powered intelligence feed that tracks how AI is being adopted across the biopharma industry. The system ingests RSS from nine biopharma and health-tech sources, applies a LLM-based relevance classifier to discard noise, then runs structured extraction on kept articles to pull out AI application area, deal type, companies involved, and disclosed deal values. A hybrid view lets you browse all AI adoption news or toggle to deals-only and disclosed-value-only views. Built with FastAPI + SQLite on the backend and React on the frontend, with a daily refresh script deployable via Railway cron.",
    tags: ["Python", "FastAPI", "RSS", "SQLite", "LLM Extraction", "React"],
    links: { live: "/ai-biopharma-feed" },
  },
  {
    id: "partner-prioritisation",
    slug: "partner-prioritisation",
    title: "Conference Partner Prioritisation Engine",
    themes: ["AI/ML & Automation", "Biotech/Biopharma Strategy"],
    status: "WIP",
    order: 5,
    yearStart: 2026,
    yearEnd: 2026,
    summary:
      "Tells a biotech or consultancy which companies to prioritise meeting at a partnering conference (BIO, JPM, BioEquity) — scoring every attending company against the client's own positioning, then drafting tailored outreach in a client portal.",
    longDescription:
      "Partnering conferences put thousands of companies in one place, and the platform's own AI matchmaker is generic. This engine builds the prioritisation matrix from company profiles instead: it takes a client's positioning from the public domain (their website), pulls the conference's attending-company list, and scores each company against what the client is actually looking for. Scoring is two-tier and deterministic — hard MUST filters (partner type, therapeutic-area fit, deal type) gate the universe, then weighted PREFER rules (stage fit, strategic complementarity, BD appetite, financial capacity) produce a 0–100 fit score, so every rank comes with a readable rationale rather than a black-box number. The same engine reshapes itself per client: for a therapeutic-agnostic drug-development consultancy it drops the disease filters and rewards an early-clinical stage band instead. On a real run it pulled all 1,654 BIO 2026 exhibitors live, classified each from its public blurb, and surfaced ~90 priority early-clinical biotechs from the noise. The output is a client-facing portal: a priority-list tab, a live re-ranking control (edit your purpose or the levers and the list re-scores in-browser), and a card per company with the rank rationale plus an editable first-touch outreach draft to approve, edit and send.",
    tags: ["Python", "Claude API", "Scoring Engine", "Web Scraping", "JavaScript", "Outreach", "BD"],
    links: { live: "/partner-prioritisation" },
  },
  {
    id: "pharma-landscape",
    slug: "pharma-landscape",
    title: "Bellwether — AI-Native Pharma Equity Research",
    themes: ["Biotech/Biopharma Strategy", "Investing"],
    status: "Live",
    order: 6,
    yearStart: 2026,
    yearEnd: 2026,
    summary:
      "Bellwether is a research system that routes 13 large-cap pharma companies through the valuation model that fits each — earnings/LOE for the majors, asset-NPV for pipeline-led names — normalises the outputs, and surfaces re-rating gaps, patent-cliff exposure and pipeline crowding on one comparable view. Shown as a Q1 2026 reviewed sample run.",
    longDescription:
      "Traditional equity research evaluates pharma companies one at a time, and a $200bn major can't be valued the way a clinical-stage biotech is. Bellwether makes them comparable: a deterministic classifier routes each name to the valuation model that fits it — a loss-of-exclusivity / earnings / comps engine for revenue-generating majors, an asset-NPV analysis for pre-commercial, pipeline-led names — then normalises the outputs into one decision view. Across the 13 largest names it pulls the latest reported quarter, decomposes each portfolio into an A–E franchise mix (core growth → mature/LOE-exposed → future pipeline), scores momentum, valuation and the freshest dated catalyst, and assembles a comparable landscape: who faces a patent cliff and when, the three modalities the field is crowding into (obesity/incretins, ADCs & radiopharmaceuticals, PD-1/VEGF bispecifics), and where valuation sits against momentum. Every claim carries a dated-source provenance tag, and sourced facts are kept distinct from model-generated conclusions. The case study foregrounds the outcome and one name traced end-to-end; the full landscape is a fixed, reviewed Q1 2026 sample run. Directional and educational — not investment advice.",
    tags: ["Equity Research", "Valuation Modelling", "Patent Cliff", "Data Visualisation", "Provenance"],
    links: { live: "/pharma-landscape" },
  },
];

export function getUniqueStartYears(): number[] {
  const years = new Set<number>();
  projects.forEach(p => years.add(p.yearStart));
  return Array.from(years).sort((a, b) => b - a);
}

export function getUniqueThemes(): ProjectTheme[] {
  const themes = new Set<ProjectTheme>();
  projects.forEach(p => p.themes.forEach(t => themes.add(t)));
  return Array.from(themes);
}

export function filterProjectsByTheme(theme: ProjectTheme | null): Project[] {
  const visible = projects.filter(p => !p.hideFromTimeline);
  if (theme === null) return visible;
  return visible.filter(p => p.themes.includes(theme));
}

export function filterProjectsByStatus(status: ProjectStatus | null, projectList: Project[]): Project[] {
  if (status === null) return projectList;
  return projectList.filter(p => p.status === status);
}

export function groupProjectsByYear(projectList: Project[]): Map<number, Project[]> {
  const grouped = new Map<number, Project[]>();

  projectList.forEach(project => {
    const year = project.yearStart;
    if (!grouped.has(year)) {
      grouped.set(year, []);
    }
    grouped.get(year)!.push(project);
  });

  grouped.forEach((projects, year) => {
    projects.sort((a, b) => {
      const statusOrder = { Live: 0, WIP: 1, Archived: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
        return a.order - b.order;
      }
      return a.title.localeCompare(b.title);
    });
  });

  return grouped;
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find(p => p.slug === slug);
}

export function formatYearRange(yearStart: number, yearEnd: number): string {
  if (yearStart === yearEnd) return yearStart.toString();
  return `${yearStart}–${yearEnd.toString().slice(2)}`;
}
