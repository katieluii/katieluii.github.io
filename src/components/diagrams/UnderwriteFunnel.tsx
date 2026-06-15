import type { ReactNode } from 'react';
import { ConnectorV } from '../shared/craft';
import type { Underwrite } from '../../data/workWithMe';

/* ── Shared diligence-funnel diagram ──────────────────────────────────────────
   The WS4 underwrite architecture: input modules → agents → IC memo → pipeline
   wrapper. Rendered on TWO pages with different design systems:
     • variant="warm" — the /work-with-me/investors sales page (oxblood + Fraunces,
       paper canvas). Reproduces the original look exactly.
     • variant="cool" — the /investment-memo showcase page (zinc + dark mode, indigo
       accent), inside ProjectPageLayout.
   Returns a fragment — each page supplies its own <section> wrapper (warm adds the
   reveal animation + TwoModeStrip + CTA; those stay page-level / sales-only). */

type Variant = 'warm' | 'cool';

// warm (work-with-me) palette
const BG = '#FAF7F1';
const ACCENT = '#6E2433'; // oxblood
const INK = 'rgba(27,26,23,1)';
const INK_BODY = 'rgba(27,26,23,0.72)';
const INK_META = 'rgba(27,26,23,0.5)';
const HAIR = 'rgba(27,26,23,0.12)';

/* minimal single-weight line icons for the input modules */
function ModuleIcon({ name, color }: { name: 'doc' | 'market' | 'cap' | 'team'; color: string }) {
  const common = {
    width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'doc':
      return (<svg {...common}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></svg>);
    case 'market':
      return (<svg {...common}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>);
    case 'cap':
      return (<svg {...common}><path d="M3 5h18M3 12h18M3 19h18M9 5v14" /></svg>);
    case 'team':
      return (<svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.5M21 20a6 6 0 0 0-4-5.6" /></svg>);
  }
}

export default function UnderwriteFunnel({ data: u, variant = 'warm' }: { data: Underwrite; variant?: Variant }) {
  const warm = variant === 'warm';
  const connectorColor = warm ? INK_META : '#a1a1aa'; // zinc-400
  const iconColor = warm ? ACCENT : '#6366f1';        // indigo-500

  const FlowLabel = ({ children }: { children: ReactNode }) => (
    <div className="flex flex-col items-center py-4" aria-hidden>
      <ConnectorV color={connectorColor} height={30} />
      {warm ? (
        <span className="mt-2 text-[11px] uppercase" style={{ color: INK_META, letterSpacing: '0.1em' }}>{children}</span>
      ) : (
        <span className="mt-2 text-[11px] uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">{children}</span>
      )}
    </div>
  );

  return (
    <>
      {/* eyebrow */}
      {warm ? (
        <p className="text-[11.5px] font-semibold uppercase" style={{ color: INK_META, letterSpacing: '0.09em' }}>{u.eyebrow}</p>
      ) : (
        <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{u.eyebrow}</h2>
      )}

      {/* lead */}
      {warm ? (
        <p className="mt-5 text-[23px] sm:text-[27px] leading-[1.4] max-w-2xl opsz-auto" style={{ fontFamily: 'var(--d)', fontWeight: 450, color: INK }}>{u.lead}</p>
      ) : (
        <p className="mt-3 text-[19px] sm:text-[22px] leading-snug max-w-2xl font-semibold text-zinc-900 dark:text-zinc-100">{u.lead}</p>
      )}

      {/* tier 1 — input modules */}
      <div className="mt-11 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {u.inputs.map((m) => warm ? (
          <div key={m.label} className="rounded-xl px-4 py-4" style={{ border: `1px solid ${HAIR}` }}>
            <ModuleIcon name={m.icon} color={iconColor} />
            <p className="mt-3 text-[14.5px] font-semibold" style={{ color: INK }}>{m.label}</p>
            <p className="mt-1 text-[12px] leading-[1.4]" style={{ color: INK_META }}>{m.dek}</p>
          </div>
        ) : (
          <div key={m.label} className="rounded-xl px-4 py-4 ring-1 ring-zinc-200/80 dark:ring-white/10 bg-white/80 dark:bg-zinc-800/80">
            <ModuleIcon name={m.icon} color={iconColor} />
            <p className="mt-3 text-[14.5px] font-semibold text-zinc-900 dark:text-zinc-100">{m.label}</p>
            <p className="mt-1 text-[12px] leading-[1.4] text-zinc-500 dark:text-zinc-400">{m.dek}</p>
          </div>
        ))}
      </div>

      <FlowLabel>Feed into</FlowLabel>

      {/* tier 2 — the diligence agents */}
      {warm ? (
        <div className="rounded-xl px-5 py-5" style={{ border: `1px solid ${HAIR}`, background: 'rgba(110,36,51,0.035)' }}>
          <p className="text-[16px] opsz-auto" style={{ fontFamily: 'var(--d)', fontWeight: 500, color: INK }}>{u.agentsLabel}</p>
          <p className="mt-1 text-[13px] leading-[1.5]" style={{ color: INK_META }}>{u.agentsSub}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {u.agents.map((a) => (
              <span key={a} className="text-[12.5px] px-3 py-1.5 rounded-md" style={{ color: INK_BODY, border: `1px solid ${HAIR}`, background: BG }}>{a}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl px-5 py-5 ring-1 ring-indigo-200/70 dark:ring-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/10">
          <p className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-100">{u.agentsLabel}</p>
          <p className="mt-1 text-[13px] leading-[1.5] text-zinc-500 dark:text-zinc-400">{u.agentsSub}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {u.agents.map((a) => (
              <span key={a} className="text-[12.5px] px-3 py-1.5 rounded-md text-zinc-700 dark:text-zinc-300 ring-1 ring-zinc-200 dark:ring-zinc-700 bg-white dark:bg-zinc-900/40">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* optional human-in-the-loop checkpoint (cool/showcase only, via reviewLabel) */}
      {!warm && u.reviewLabel && (
        <div className="flex justify-center pt-4">
          <span className="text-[10.5px] font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            ◆ {u.reviewLabel}
          </span>
        </div>
      )}

      <FlowLabel>Synthesised into</FlowLabel>

      {/* tier 3 — the IC memo (the payoff) */}
      {warm ? (
        <div className="rounded-xl px-6 py-5 flex items-center justify-between gap-4" style={{ background: ACCENT }}>
          <div>
            <p className="text-[19px] opsz-auto" style={{ fontFamily: 'var(--d)', fontWeight: 500, color: '#fff' }}>{u.output.label}</p>
            <p className="mt-0.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.72)' }}>{u.output.dek}</p>
          </div>
          <span className="text-[22px]" style={{ color: 'rgba(255,255,255,0.6)' }} aria-hidden>↳</span>
        </div>
      ) : (
        <div className="rounded-xl px-6 py-5 flex items-center justify-between gap-4 bg-indigo-600">
          <div>
            <p className="text-[19px] font-semibold text-white">{u.output.label}</p>
            <p className="mt-0.5 text-[13px] text-white/70">{u.output.dek}</p>
          </div>
          <span className="text-[22px] text-white/60" aria-hidden>↳</span>
        </div>
      )}

      {/* wrapper — pipeline + deal-page tracking layer */}
      {warm ? (
        <div className="mt-12 pt-10" style={{ borderTop: `1px solid ${HAIR}` }}>
          <p className="text-[16px] leading-[1.6] max-w-xl" style={{ color: INK_BODY }}>{u.wrapper}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {u.wrapperTags.map((t) => (
              <span key={t} className="text-[12.5px] px-3 py-1.5 rounded-md" style={{ color: INK_BODY, border: `1px solid ${HAIR}` }}>{t}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-12 pt-10 border-t border-zinc-200/80 dark:border-white/10">
          <p className="text-[15px] leading-[1.6] max-w-xl text-zinc-600 dark:text-zinc-400">{u.wrapper}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {u.wrapperTags.map((t) => (
              <span key={t} className="text-[12.5px] px-3 py-1.5 rounded-md text-zinc-600 dark:text-zinc-400 ring-1 ring-zinc-200 dark:ring-zinc-700">{t}</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
