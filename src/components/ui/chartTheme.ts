import { useEffect, useState } from 'react';

/* Shared Recharts theming — muted grid, zinc axis ticks, a cool series palette,
   and a glass tooltip style matching the one already used in StockChart. Recolours
   live when the site theme toggles (MutationObserver on <html>.dark). */

export type ChartTheme = {
  dark: boolean;
  grid: string;
  axis: string;
  accent: string;
  /** Ordered cool-tone series palette for multi-series charts. */
  series: string[];
  tooltip: {
    contentStyle: React.CSSProperties;
    labelStyle: React.CSSProperties;
    itemStyle: React.CSSProperties;
    cursor: { fill: string };
  };
};

function isDark() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

function build(dark: boolean): ChartTheme {
  return {
    dark,
    grid: dark ? 'rgba(255,255,255,0.07)' : 'rgba(24,24,27,0.08)',
    axis: dark ? '#8a8a93' : '#71717a',
    accent: dark ? '#818cf8' : '#6366f1',
    series: dark
      ? ['#818cf8', '#34d399', '#fbbf24', '#f472b6', '#22d3ee', '#a78bfa']
      : ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'],
    tooltip: {
      contentStyle: {
        borderRadius: 12,
        border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(24,24,27,0.10)'}`,
        background: dark ? 'rgba(24,24,27,0.95)' : 'rgba(255,255,255,0.97)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        backdropFilter: 'blur(6px)',
        fontSize: 12,
        color: dark ? '#f4f4f5' : '#18181b',
      },
      labelStyle: {
        color: dark ? '#a1a1aa' : '#52525b',
        fontWeight: 600,
        marginBottom: 4,
      },
      itemStyle: { color: dark ? '#e4e4e7' : '#3f3f46' },
      cursor: { fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(24,24,27,0.04)' },
    },
  };
}

export function useChartTheme(): ChartTheme {
  const [dark, setDark] = useState(isDark);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(isDark()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return build(dark);
}
