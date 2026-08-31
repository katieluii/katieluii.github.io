import { Microscope } from 'lucide-react';
import { ConnectorH, ConnectorV, EDITORIAL } from '../shared/craft';
import { ATLAS_DATAFLOW, type DataflowNode, type DataflowHub } from '../../data/atlas/copy';

/* Shared living-memory dataflow diagram: continuous inputs -> ETLM/ATLAS hub -> deliverables.
   One component, two skins: `portfolio` (zinc cards + dark hub, dark-mode aware) and `editorial`
   (warm cream + single oxblood accent). Content (inputs / outputs) defaults to the canonical
   ATLAS_DATAFLOW so the two pages can't drift; the hub label is intentionally overridable. */

// editorial (warm) tokens: shared single source so the skin can't drift across pages
const { ACCENT, INK, INK_BODY, INK_META, HAIR, FRAUNCES } = EDITORIAL;

interface AtlasDataflowProps {
  theme: 'portfolio' | 'editorial';
  inputs?: DataflowNode[];
  outputs?: DataflowNode[];
  hub?: DataflowHub;
  hubHref?: string;
  inputsLabel?: string;
  outputsLabel?: string;
}

function Connector({ theme }: { theme: 'portfolio' | 'editorial' }) {
  // portfolio inherits currentColor (so dark mode flips it); editorial uses the fixed ink tone
  const color = theme === 'editorial' ? INK_META : 'currentColor';
  return (
    <div
      className={`flex items-center justify-center py-3 sm:py-0 sm:px-2 ${
        theme === 'portfolio' ? 'text-zinc-300 dark:text-zinc-600' : ''
      }`}
      aria-hidden
    >
      <span className="sm:hidden">
        <ConnectorV color={color} height={34} />
      </span>
      <span className="hidden sm:inline">
        <ConnectorH color={color} />
      </span>
    </div>
  );
}

export default function AtlasDataflow({
  theme,
  inputs = ATLAS_DATAFLOW.inputs,
  outputs = ATLAS_DATAFLOW.outputs,
  hub = ATLAS_DATAFLOW.hub,
  hubHref,
  inputsLabel,
  outputsLabel,
}: AtlasDataflowProps) {
  const editorial = theme === 'editorial';
  const inLabel = inputsLabel ?? (editorial ? 'Continuous inputs' : 'Knowledge sources');
  const outLabel = outputsLabel ?? (editorial ? 'What comes out' : 'Strategic deliverables');

  // -- column label --
  const Label = ({ children }: { children: React.ReactNode }) =>
    editorial ? (
      <p className="text-[11px] font-semibold uppercase mb-3" style={{ color: INK_META, letterSpacing: '0.1em' }}>
        {children}
      </p>
    ) : (
      <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-3">
        {children}
      </p>
    );

  // -- a single input/output node --
  const Node = ({ node, kind }: { node: DataflowNode; kind: 'input' | 'output' }) => {
    if (editorial) {
      // plain bullet: name only (matches the sales page's restraint)
      const dotTop = kind === 'output' ? 'mt-[9px]' : '';
      return (
        <li
          className={`flex ${kind === 'output' ? 'items-start' : 'items-center'} gap-2.5 text-[14.5px]`}
          style={{ color: kind === 'output' ? INK : INK_BODY }}
        >
          <span
            className={`inline-block w-1 h-1 rounded-full shrink-0 ${dotTop}`}
            style={{ background: kind === 'output' ? INK_META : ACCENT }}
            aria-hidden
          />
          {node.name}
        </li>
      );
    }
    // portfolio: small card; outputs get a subtle indigo accent (they're the payoff)
    const ring =
      kind === 'output'
        ? 'ring-indigo-200/70 dark:ring-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/10'
        : 'ring-zinc-200/80 dark:ring-white/10 bg-zinc-50/70 dark:bg-zinc-900/40';
    return (
      <li className={`rounded-lg ring-1 ${ring} px-3 py-2`}>
        <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{node.name}</p>
        {node.detail && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{node.detail}</p>
        )}
      </li>
    );
  };

  const Column = ({ label, nodes, kind }: { label: string; nodes: DataflowNode[]; kind: 'input' | 'output' }) => (
    <div className="flex-1">
      <Label>{label}</Label>
      <ul className={editorial ? 'space-y-2' : 'space-y-2'}>
        {nodes.map((n) => (
          <Node key={n.name} node={n} kind={kind} />
        ))}
      </ul>
    </div>
  );

  // -- hub --
  const editorialHub = (
    <div
      className="flex-[1.25] flex flex-col justify-center rounded-xl px-6 py-7 text-center"
      style={{ background: 'rgba(110,36,51,0.045)', border: `1px solid ${HAIR}` }}
    >
      <p
        className="text-[26px] sm:text-[30px] opsz-auto"
        style={{ fontFamily: FRAUNCES, fontWeight: 500, color: ACCENT, letterSpacing: '0.01em' }}
      >
        {hub.name}
      </p>
      <p className="mt-2.5 text-[13.5px] leading-[1.5]" style={{ color: INK_BODY }}>
        {hub.line}
      </p>
    </div>
  );

  const portfolioHubContent = (
    <div className="rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-5 py-5 text-center shadow-md">
      <Microscope className="w-5 h-5 mx-auto mb-2 opacity-80" />
      {hub.badge && (
        <p className="text-[10px] uppercase tracking-widest font-semibold opacity-70">{hub.badge}</p>
      )}
      <p className="text-lg font-bold mt-1">{hub.name}</p>
      <p className="text-[11px] opacity-70 mt-1.5 leading-snug">{hub.line}</p>
      {hubHref && <p className="text-[11px] font-semibold mt-3">Browse deliverables {'->'}</p>}
    </div>
  );

  const Hub = editorial ? (
    hubHref ? (
      <a href={hubHref} className="flex-[1.25] flex flex-col justify-center rounded-xl">
        {editorialHub}
      </a>
    ) : (
      editorialHub
    )
  ) : (
    <div className="flex-[1.25] flex flex-col justify-center">
      {hubHref ? (
        <a
          href={hubHref}
          className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
          aria-label={`Browse Atlas Reader deliverables from ${hub.name}`}
        >
          <div className="transition-transform group-hover:-translate-y-0.5 group-hover:shadow-lg">
            {portfolioHubContent}
          </div>
        </a>
      ) : (
        portfolioHubContent
      )}
    </div>
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-stretch">
      <Column label={inLabel} nodes={inputs} kind="input" />
      <Connector theme={theme} />
      {Hub}
      <Connector theme={theme} />
      <Column label={outLabel} nodes={outputs} kind="output" />
    </div>
  );
}
