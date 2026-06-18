import React from 'react';

/* WS15 — bespoke domain-native line-art motifs: "the clinical record as ornament".
   The visual grammar of drug development (survival curves, forest plots, a living-
   memory node graph) drawn as minimal line-art. Stroke = currentColor, so callers
   set the oxblood + opacity. Purely decorative — always aria-hidden, subordinate to
   text. Used as faint hero/section atmosphere, never as a foreground element. */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.1,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

type MotifProps = { className?: string; style?: React.CSSProperties };

/* Kaplan–Meier survival curves — two descending step functions with censor ticks. */
export function KMCurve({ className, style }: MotifProps) {
  return (
    <svg viewBox="0 0 180 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <path d="M16 6 V110 H176" stroke="currentColor" strokeWidth={0.7} fill="none" opacity={0.45} />
      <path d="M16 20 H44 V32 H70 V38 H100 V56 H132 V62 H176" {...base} />
      <path d="M16 24 H40 V48 H64 V66 H96 V86 H128 V100 H176" {...base} opacity={0.55} />
      <path d="M57 35 v6 M116 59 v6 M82 47 v6" {...base} strokeWidth={0.9} />
    </svg>
  );
}

/* Forest plot — a vertical line of effect, rows of confidence-interval whiskers
   with centre squares straddling it. The grammar of a meta-analysis. */
export function ForestPlot({ className, style }: MotifProps) {
  const rows = [
    { y: 22, x1: 40, x2: 96, cx: 70 },
    { y: 46, x1: 58, x2: 120, cx: 88 },
    { y: 70, x1: 30, x2: 84, cx: 52 },
    { y: 94, x1: 64, x2: 138, cx: 104 },
  ];
  return (
    <svg viewBox="0 0 160 116" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <path d="M80 6 V110" stroke="currentColor" strokeWidth={0.8} fill="none" strokeDasharray="2 4" opacity={0.5} />
      {rows.map((r) => (
        <g key={r.y}>
          <path d={`M${r.x1} ${r.y} H${r.x2}`} {...base} />
          <path d={`M${r.x1} ${r.y - 3} v6 M${r.x2} ${r.y - 3} v6`} {...base} strokeWidth={0.9} />
          <rect x={r.cx - 3.2} y={r.y - 3.2} width={6.4} height={6.4} fill="currentColor" stroke="none" />
        </g>
      ))}
    </svg>
  );
}

/* Living-memory node graph — a central hub with radiating connections to satellite
   nodes. The ATLAS picture, abstracted to a constellation. */
export function NodeGraph({ className, style }: MotifProps) {
  const cx = 90, cy = 60;
  const sats = [
    [24, 24], [156, 22], [18, 92], [150, 98], [88, 14], [92, 108], [30, 58], [152, 60],
  ];
  return (
    <svg viewBox="0 0 180 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      {sats.map(([x, y], i) => (
        <path key={i} d={`M${cx} ${cy} L${x} ${y}`} {...base} strokeWidth={0.8} opacity={0.55} />
      ))}
      {sats.map(([x, y], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={2.4} fill="currentColor" stroke="none" />
      ))}
      <circle cx={cx} cy={cy} r={7} {...base} />
      <circle cx={cx} cy={cy} r={2.6} fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Bespoke glyph set — a custom line-art icon family in the same hand as the
   motifs (not off-the-shelf). 24×24, currentColor, single weight. Keyed by
   semantic name from workWithMe.ts. ─────────────────────────────────────────── */
const g = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
const GLYPHS: Record<string, React.ReactNode> = {
  // disease target — concentric rings + crosshair
  indication: (<><circle cx="12" cy="12" r="8" {...g} /><circle cx="12" cy="12" r="3.4" {...g} /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><path d="M12 1.5v2.6M12 19.9v2.6M1.5 12h2.6M19.9 12h2.6" {...g} /></>),
  // living memory — central node with satellites
  memory: (<><path d="M12 12 4.5 5.5M12 12l7.5-6M12 12 5 19M12 12l7 6.5" {...g} strokeWidth={1} /><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" /><circle cx="4.5" cy="5.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="19.5" cy="6" r="1.5" fill="currentColor" stroke="none" /><circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" /><circle cx="19" cy="18.5" r="1.5" fill="currentColor" stroke="none" /></>),
  // defensible artifact — document with a rising data line + check
  artifact: (<><path d="M6 3h8l4 4v14H6z" {...g} /><path d="M14 3v4h4" {...g} /><path d="M8.5 17c1.4 0 1.6-4 3.5-4 1.2 0 1.6-1.5 3.5-2.5" {...g} strokeWidth={1.1} /></>),
  // live deal — stacked documents
  deal: (<><path d="M9 3h7l3 3v11h-9z" {...g} /><path d="M16 3v3h3" {...g} /><path d="M14 8v12H5V9l3-1" {...g} /><path d="M8 13h3M8 16h3" {...g} strokeWidth={1.1} /></>),
  // underwrite the science — lens over a curve
  underwrite: (<><circle cx="10.5" cy="10.5" r="6.5" {...g} /><path d="M15.2 15.2 20.5 20.5" {...g} /><path d="M7.5 12c1.2 0 1.3-3.2 3-3.2 1 0 1.3-1.3 2.5-1.8" {...g} strokeWidth={1.1} /></>),
  // IC memo — document with seal
  memo: (<><path d="M6 3h9l3 3v15H6z" {...g} /><path d="M15 3v3h3" {...g} /><path d="M9 10h5M9 13h5" {...g} strokeWidth={1.1} /><circle cx="14.5" cy="17.5" r="2.2" {...g} strokeWidth={1.1} /></>),
  // sourced — a citation bookmark
  sourced: (<><path d="M7 3.5h10v17l-5-4-5 4z" {...g} /><path d="M10 9h4" {...g} strokeWidth={1.1} /></>),
  // human-checked — check inside a ring
  checked: (<><circle cx="12" cy="12" r="8.5" {...g} /><path d="m8.2 12 2.6 2.8 5-6" {...g} /></>),
  // current — a vital-sign / live pulse line
  current: (<><path d="M2.5 12H8l1.8-5.5L13 18l1.8-6H21.5" {...g} /></>),
};
export function Glyph({ name, size = 22, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  const node = GLYPHS[name];
  if (!node) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={style}>
      {node}
    </svg>
  );
}

/* Dose–response sigmoid — an S-curve with a few plotted points. */
export function DoseResponse({ className, style }: MotifProps) {
  return (
    <svg viewBox="0 0 160 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <path d="M16 6 V108 H152" stroke="currentColor" strokeWidth={0.7} fill="none" opacity={0.45} />
      <path d="M16 98 C56 98 60 26 100 26 C128 26 132 20 152 18" {...base} />
      {[[30, 96], [64, 84], [82, 52], [104, 28], [134, 20]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.4} fill="currentColor" stroke="none" />
      ))}
    </svg>
  );
}
