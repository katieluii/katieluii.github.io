import type { ReactNode, ElementType, CSSProperties } from 'react';
import { useReveal } from '../../hooks/useReveal';

/* ── Shared motion primitives (cool/dark-mode-native, no warm vocabulary) ──
   Thin wrappers over the existing .rise / .reveal CSS + useReveal hook so the
   tool pages get the same reduced-motion-safe motion the /work-with-me pages use. */

/* Scroll-revealed block — fades + slides up the first time it enters the viewport. */
export function Reveal({
  as: As = 'div',
  className = '',
  style,
  children,
  id,
}: {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  id?: string;
}) {
  const ref = useReveal<HTMLElement>();
  return (
    <As ref={ref} id={id} className={`reveal ${className}`} style={style}>
      {children}
    </As>
  );
}

/* On-load staggered rise — for hero elements already in view at load.
   `index` drives a 60ms-per-step cascade. */
export function Rise({
  as: As = 'div',
  index = 0,
  className = '',
  style,
  children,
}: {
  as?: ElementType;
  index?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <As className={`rise ${className}`} style={{ animationDelay: `${index * 60}ms`, ...style }}>
      {children}
    </As>
  );
}
