import type { ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';

/* ── WS15 /work-with-me — shared craft layer (frontend-design pass) ── */

/* editorial palette + display face — the single source for the warm cream / oxblood /
   Fraunces system. Used by the WWM audience pages, the Atlas project page, and the shared
   AtlasDataflow diagram so the look can't drift across them. */
export const EDITORIAL = {
  BG: '#FAF7F1',
  ACCENT: '#6E2433', // oxblood — eyebrows, links, CTA, the one accent
  INK: 'rgba(27,26,23,1)',
  INK_BODY: 'rgba(27,26,23,0.72)',
  INK_META: 'rgba(27,26,23,0.5)',
  HAIR: 'rgba(27,26,23,0.12)',
  FRAUNCES: "'Fraunces', Georgia, serif",
} as const;

/* subtle fine-stock grain over the warm canvas */
export function Grain() {
  return <div aria-hidden className="grain-overlay" />;
}

/* scroll-revealed <section> */
export function Reveal({ className = '', children, id }: { className?: string; children: ReactNode; id?: string }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} id={id} className={`reveal ${className}`}>
      {children}
    </section>
  );
}

/* drawn hairline flow connectors — replace the ASCII →/↓ glyphs */
export function ConnectorH({ color }: { color: string }) {
  return (
    <svg width="42" height="12" viewBox="0 0 42 12" fill="none" aria-hidden>
      <path d="M0 6 H35" stroke={color} strokeWidth="1" />
      <path d="M31 2 L37 6 L31 10" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function ConnectorV({ color, height = 40 }: { color: string; height?: number }) {
  return (
    <svg width="12" height={height} viewBox={`0 0 12 ${height}`} fill="none" aria-hidden>
      <path d={`M6 0 V${height - 6}`} stroke={color} strokeWidth="1" />
      <path d={`M2 ${height - 10} L6 ${height - 4} L10 ${height - 10}`} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* render a string with *…* wrapped as a Fraunces italic emphasis */
export function emphasize(text: string): ReactNode {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') ? (
      <em key={i} style={{ fontStyle: 'italic', fontFamily: "'Fraunces', Georgia, serif" }}>
        {part.slice(1, -1)}
      </em>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
