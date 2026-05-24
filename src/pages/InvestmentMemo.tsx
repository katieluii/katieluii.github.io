import { ExternalLink } from 'lucide-react';
import { getProjectBySlug } from '../data/projects';
import { Pill } from '../components/Pill';
import ProjectPageLayout from '../components/ProjectPageLayout';
import MarketSizingCalculator from '../components/MarketSizingCalculator';
import CapTableHelper from '../components/CapTableHelper';
import ExitScenarios from '../components/ExitScenarios';

const APP_URL = 'https://investment-memo-agent-git-main-katieluiis-projects.vercel.app';

type StepType = 'auto' | 'human' | 'agentic';
type DataTag = { label: string; color: 'blue' | 'purple' | 'amber' | 'green' };

interface FlowStep {
  label: string;
  detail: string;
  type: StepType;
  tags: DataTag[];
}

const FLOW: FlowStep[] = [
  {
    label: 'Create a deal',
    detail: 'Enter company name, asset, indication, development stage, round type, and investment thesis.',
    type: 'human',
    tags: [],
  },
  {
    label: 'Upload & index documents',
    detail: 'Attach pitch deck text, data room summaries, trial synopses, or analyst notes (.txt or .md). Documents are split into ~1,000-character chunks and stored so agents can retrieve relevant passages during analysis.',
    type: 'human',
    tags: [{ label: 'Proprietary docs', color: 'purple' }],
  },
  {
    label: 'Run analysis tools',
    detail: 'Before running agents, build out three quantitative models: a friction-aware market sizing calculator (bottom-up with therapeutic area presets, or top-down), a cap table & dilution modeller with round-by-round ownership projection, and a liquidation waterfall across bear / base / bull exit scenarios.',
    type: 'human',
    tags: [{ label: 'Your assumptions & cap table data', color: 'amber' }],
  },
  {
    label: 'Founding team assessment',
    detail: 'Rate conviction, domain expertise, execution track record, strategic clarity, team cohesion, and openness to input — capturing the qualitative and econometric signals that hard data alone cannot reveal.',
    type: 'human',
    tags: [{ label: 'Founder meeting insights', color: 'amber' }],
  },
  {
    label: 'Run due diligence agents (~3 min)',
    detail: 'Scientific Diligence · Competitive Intelligence · Clinical & Regulatory · Financing & Valuation — four agents draw on publicly available biopharma intelligence and your indexed documents to surface opportunities, risks, and diligence questions.',
    type: 'agentic',
    tags: [
      { label: 'Public biopharma intelligence', color: 'blue' },
      { label: 'Your indexed documents', color: 'purple' },
    ],
  },
  {
    label: 'Review & annotate',
    detail: 'Read each agent\'s analysis as a structured card. Correct errors, inject network intelligence, and add context that agents cannot access.',
    type: 'human',
    tags: [{ label: 'Your notes & corrections', color: 'amber' }],
  },
  {
    label: 'Generate investment memo',
    detail: 'An LLM synthesises all inputs — quantitative models, agent analysis, your annotations, and team assessment — into a structured memo covering executive summary, diligence findings, risk analysis, financing considerations, and recommendation.',
    type: 'agentic',
    tags: [{ label: 'All inputs combined', color: 'green' }],
  },
];

const TAG_STYLES: Record<DataTag['color'], string> = {
  blue:   'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  amber:  'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  green:  'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
};

export default function InvestmentMemo() {
  const project = getProjectBySlug('investment-memo-agent');

  if (!project) {
    return (
      <ProjectPageLayout title="Project not found">
        <p className="text-slate-600 dark:text-zinc-400">That project doesn't exist.</p>
      </ProjectPageLayout>
    );
  }

  const agents = [
    {
      icon: '🔬',
      name: 'Scientific Diligence',
      description: 'Evaluates mechanism of action, clinical and preclinical evidence, and the scientific validity of the asset. Highlights both opportunities and risks.',
    },
    {
      icon: '🏁',
      name: 'Competitive Intelligence',
      description: 'Maps the competitive landscape, assesses market size and patient population, and identifies how the asset differentiates from approved and emerging competitors.',
    },
    {
      icon: '⚖️',
      name: 'Clinical & Regulatory',
      description: 'Analyses the optimal regulatory pathway, draws on FDA and EMA precedent in the indication, and surfaces regulatory opportunities and risks.',
    },
    {
      icon: '💰',
      name: 'Financing & Valuation',
      description: 'Identifies comparable recent financings and M&A transactions, assesses implied valuation, and flags financing opportunities and structural risks.',
    },
  ];

  const roadmap = [
    'PDF pitch deck parsing — extract text automatically on upload',
    'Embeddings and semantic retrieval (RAG) for citation-grounded analysis',
    'Parallel agent execution to reduce turnaround time',
    'Memo export to DOCX and PDF',
    'Live clinical news feed integration as automatic deal context',
  ];

  return (
    <ProjectPageLayout title={project.title} subtitle="Multi-agent · FastAPI · Next.js · SQLite">
      <div className="space-y-10">

        {/* Status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
            {project.yearStart}
          </span>
          <Pill variant={project.status === 'Live' ? 'status-live' : 'status-wip'}>{project.status}</Pill>
          {project.themes.map(t => <Pill key={t} variant="tech">{t}</Pill>)}
        </div>

        {/* Description */}
        <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
          A multi-agent investment memo generation tool built for biotech VCs. The workflow moves through three phases: quantitative analysis (market sizing, cap table modelling, and exit scenario waterfall), a founding team assessment to capture soft signals and econometric inputs, then four specialised DD agents — scientific diligence, competitive intelligence, clinical &amp; regulatory, and financing &amp; valuation — that draw on public biopharma intelligence and your indexed documents. Analysts review and annotate each agent card before An LLM synthesises everything into a structured investment memo.
        </p>

        {/* Open app button */}
        <div className="flex flex-wrap gap-3">
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open App
          </a>
        </div>

        {/* Market Sizing Calculator */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">Market Sizing Calculator</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-500">Build a bottom-up or top-down sizing model for the asset. Adjust inputs to stress-test TAM/SAM/SOM assumptions.</p>
          <MarketSizingCalculator />
        </div>

        {/* Cap Table & Dilution Modeller */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">Cap Table &amp; Dilution Modeller</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-500">
            Upload or enter the founder's cap table, model this round and co-investors, then project ownership across future rounds.
          </p>
          <CapTableHelper />
        </div>

        {/* Exit Scenarios & Waterfall */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">Exit Scenarios &amp; Waterfall</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-500">
            Model the full liquidation waterfall across bear / base / bull exits. Supports non-participating, participating (capped and uncapped), and pari passu preference structures. Generates a structured output block for the Financing &amp; Valuation agent.
          </p>
          <ExitScenarios />
        </div>

        {/* Flow diagram */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">
            How it works
          </h2>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pb-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
              Auto / Agentic
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
              Human checkpoint
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${TAG_STYLES.blue}`}>Public data</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${TAG_STYLES.purple}`}>Proprietary docs</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${TAG_STYLES.amber}`}>Your input</span>
          </div>

          {/* Flow nodes */}
          <div>
            {FLOW.map((step, i) => {
              const isHuman = step.type === 'human';
              const isAgentic = step.type === 'agentic';
              const isLast = i === FLOW.length - 1;
              return (
                <div key={step.label} className="flex gap-3">
                  {/* Left track: dot + connecting line */}
                  <div className="flex flex-col items-center flex-shrink-0 pt-1">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-[#fafafa] dark:ring-offset-[#0b0f14] ${
                      isHuman
                        ? 'bg-amber-400 ring-amber-200 dark:ring-amber-800'
                        : isAgentic
                        ? 'bg-indigo-500 ring-indigo-200 dark:ring-indigo-800'
                        : 'bg-blue-400 ring-blue-200 dark:ring-blue-800'
                    }`} />
                    {!isLast && (
                      <div className="w-px flex-1 mt-1 bg-zinc-200 dark:bg-zinc-700 min-h-[1.5rem]" />
                    )}
                  </div>

                  {/* Step card */}
                  <div className={`flex-1 mb-3 rounded-xl border px-4 py-3 ${
                    isHuman
                      ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/10'
                      : isAgentic
                      ? 'border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/10'
                      : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                  }`}>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{step.label}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isHuman
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : isAgentic
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        {isHuman ? '◆ Human checkpoint' : isAgentic ? '✦ Auto / Agentic' : '● Automated'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 leading-relaxed">{step.detail}</p>
                    {step.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {step.tags.map(tag => (
                          <span key={tag.label} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TAG_STYLES[tag.color]}`}>
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agents */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">The Four Agents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agents.map(a => (
              <div key={a.name} className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">{a.icon} {a.name}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed">{a.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">Roadmap</h2>
          <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 p-4 space-y-1.5">
            {roadmap.map(item => (
              <div key={item} className="flex gap-2 text-sm text-slate-600 dark:text-zinc-400">
                <span className="text-slate-400 dark:text-zinc-600 flex-shrink-0">→</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Technologies */}
        {project.tags.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">Technologies</h2>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map(tag => <Pill key={tag} variant="tech">{tag}</Pill>)}
            </div>
          </div>
        )}

      </div>
    </ProjectPageLayout>
  );
}
