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
