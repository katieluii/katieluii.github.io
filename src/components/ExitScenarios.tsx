import { useState, useMemo } from 'react';
import { Plus, Trash2, Star, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type PrefType = 'common' | 'non-part' | 'part-capped' | 'part-uncapped' | 'pari-passu';
type ExitType = 'M&A' | 'IPO' | 'Secondary';

interface ShareClass {
  id: string;
  name: string;
  shares: number;
  entryPrice: number;  // £ per share
  prefType: PrefType;
  prefMultiple: number;
  partCap: number;     // total return cap multiple (for part-capped only)
  isUs: boolean;
}

interface ClassResult {
  id: string;
  name: string;
  shares: number;
  investM: number;
  prefAmountM: number;
  tookPref: boolean;
  prefPayoffM: number;
  proRataM: number;
  totalM: number;
  pctOfExit: number;
  moic: number;
  irr: number;
  isUs: boolean;
  isFounder: boolean;
}

interface WaterfallOut {
  classes: ClassResult[];
  fundM: number;
  founderM: number;
  fundMOIC: number;
  fundIRR: number;
  fundProRataM: number;
  prefStackM: number;
  insufficient: boolean;
  sumOk: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function fmtM(n: number, d = 1): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1000) return `${sign}£${(abs / 1000).toFixed(d)}B`;
  if (abs >= 0.1) return `${sign}£${abs.toFixed(d)}M`;
  return `${sign}£${(abs * 1000).toFixed(0)}K`;
}
function fmtMOIC(n: number) { return isFinite(n) && n > 0 ? `${n.toFixed(2)}×` : '—'; }
function fmtIRR(n: number) { return isFinite(n) ? `${(n * 100).toFixed(1)}%` : '—'; }
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }
function fmtShares(n: number) { return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n.toLocaleString(); }

function moicTextCls(m: number) {
  if (m >= 3) return 'text-emerald-600 dark:text-emerald-400 font-bold';
  if (m >= 2) return 'text-green-600 dark:text-green-400 font-bold';
  if (m >= 1) return 'text-amber-600 dark:text-amber-400 font-semibold';
  return 'text-red-600 dark:text-red-400 font-semibold';
}

function scenarioBorder(m: number) {
  if (m >= 2) return 'border-emerald-200 dark:border-emerald-800/40';
  if (m >= 1) return 'border-amber-200 dark:border-amber-700/40';
  return 'border-red-300 dark:border-red-800/40';
}

// ── Waterfall engine ──────────────────────────────────────────────────────────

function calcIRR(moic: number, years: number): number {
  if (years <= 0 || moic <= 0 || !isFinite(moic)) return 0;
  return Math.pow(moic, 1 / years) - 1;
}

function runWaterfall(
  exitM: number,
  classes: ShareClass[],
  holdYears: number,
): WaterfallOut {
  const totalShares = classes.reduce((s, c) => s + c.shares, 0);
  const investM = (c: ShareClass) => (c.shares * c.entryPrice) / 1_000_000;
  const prefM = (c: ShareClass) => investM(c) * c.prefMultiple;

  const partClasses = classes.filter(c => c.prefType === 'part-uncapped' || c.prefType === 'part-capped');
  const nonPartClasses = classes.filter(c => c.prefType === 'non-part');
  const proRataClasses = classes.filter(c => c.prefType === 'common' || c.prefType === 'pari-passu');

  const partPrefTotal = partClasses.reduce((s, c) => s + prefM(c), 0);
  const allPrefTotal = partPrefTotal + nonPartClasses.reduce((s, c) => s + prefM(c), 0);
  const insufficient = exitM <= partPrefTotal;

  // Working copies
  const prefPayoff = new Map<string, number>(classes.map(c => [c.id, 0]));
  const proRata = new Map<string, number>(classes.map(c => [c.id, 0]));
  const tookPref = new Map<string, boolean>(classes.map(c => [c.id, false]));

  if (insufficient) {
    // Distribute pro-rata among all preferred by pref amounts
    for (const c of [...partClasses, ...nonPartClasses]) {
      const share = allPrefTotal > 0 ? prefM(c) / allPrefTotal : 0;
      prefPayoff.set(c.id, share * exitM);
      tookPref.set(c.id, true);
    }
  } else {
    // Step 1: pay participating preferences
    let remaining = exitM;
    for (const c of partClasses) {
      prefPayoff.set(c.id, prefM(c));
      remaining -= prefM(c);
    }

    // Step 2: non-participating — convert or take preference?
    const converted = new Set<string>();
    for (const c of nonPartClasses) {
      const convVal = (c.shares / totalShares) * remaining;
      if (convVal >= prefM(c)) {
        converted.add(c.id);
      } else {
        prefPayoff.set(c.id, prefM(c));
        tookPref.set(c.id, true);
        remaining -= prefM(c);
      }
    }

    // Step 3: pro-rata pool
    const pool = classes.filter(c =>
      c.prefType === 'common' ||
      c.prefType === 'pari-passu' ||
      c.prefType === 'part-uncapped' ||
      c.prefType === 'part-capped' ||
      (c.prefType === 'non-part' && converted.has(c.id))
    );
    const poolShares = pool.reduce((s, c) => s + c.shares, 0);

    if (poolShares > 0 && remaining > 0) {
      let cappedSurplus = 0;
      for (const c of pool) {
        const raw = (c.shares / poolShares) * remaining;
        if (c.prefType === 'part-capped') {
          const cap = investM(c) * c.partCap;
          const headroom = Math.max(0, cap - prefPayoff.get(c.id)!);
          const actual = Math.min(raw, headroom);
          proRata.set(c.id, actual);
          cappedSurplus += raw - actual;
        } else {
          proRata.set(c.id, raw);
        }
      }
      // Redistribute capped surplus to uncapped pool members
      if (cappedSurplus > 0) {
        const uncapped = pool.filter(c => c.prefType !== 'part-capped');
        const uncappedShares = uncapped.reduce((s, c) => s + c.shares, 0);
        if (uncappedShares > 0) {
          for (const c of uncapped) {
            proRata.set(c.id, proRata.get(c.id)! + (c.shares / uncappedShares) * cappedSurplus);
          }
        }
      }
    }
  }

  // Assemble results
  const results: ClassResult[] = classes.map(c => {
    const inv = investM(c);
    const pref = prefPayoff.get(c.id) ?? 0;
    const pr = proRata.get(c.id) ?? 0;
    const total = pref + pr;
    const moic = inv > 0 ? total / inv : 0;
    return {
      id: c.id,
      name: c.name,
      shares: c.shares,
      investM: inv,
      prefAmountM: prefM(c),
      tookPref: tookPref.get(c.id) ?? false,
      prefPayoffM: pref,
      proRataM: pr,
      totalM: total,
      pctOfExit: exitM > 0 ? (total / exitM) * 100 : 0,
      moic,
      irr: calcIRR(moic, holdYears),
      isUs: c.isUs,
      isFounder: c.prefType === 'common' && c.name.toLowerCase().includes('found'),
    };
  });

  const fundResults = results.filter(r => r.isUs);
  const fundM = fundResults.reduce((s, r) => s + r.totalM, 0);
  const fundInv = fundResults.reduce((s, r) => s + r.investM, 0);
  const fundMOIC = fundInv > 0 ? fundM / fundInv : 0;
  const fundIRR = calcIRR(fundMOIC, holdYears);

  const founderM = results.filter(r => r.isFounder).reduce((s, r) => s + r.totalM, 0);

  const fundShares = classes.filter(c => c.isUs).reduce((s, c) => s + c.shares, 0);
  const fundProRataM = totalShares > 0 ? (fundShares / totalShares) * exitM : 0;
  const prefStackM = allPrefTotal;
  const sumCheck = results.reduce((s, r) => s + r.totalM, 0);

  return {
    classes: results,
    fundM, fundMOIC, fundIRR,
    founderM, fundProRataM,
    prefStackM,
    insufficient,
    sumOk: Math.abs(sumCheck - exitM) < 0.01,
  };
}

// ── Shared input ──────────────────────────────────────────────────────────────

function NumInput({
  value, onChange, prefix, suffix, step = 1, min = 0, max, className = '',
}: {
  value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; step?: number; min?: number; max?: number; className?: string;
}) {
  return (
    <div className={`flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors ${className}`}>
      {prefix && <span className="text-xs text-zinc-400 mr-1 flex-shrink-0">{prefix}</span>}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Math.max(min ?? 0, Number(e.target.value) || 0))}
        className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {suffix && <span className="text-xs text-zinc-400 ml-1 flex-shrink-0">{suffix}</span>}
    </div>
  );
}

// ── Default state ─────────────────────────────────────────────────────────────

const DEFAULT_CLASSES: ShareClass[] = [
  { id: uid(), name: 'Founders', shares: 3_000_000, entryPrice: 0.03, prefType: 'common', prefMultiple: 1, partCap: 3, isUs: false },
  { id: uid(), name: 'Round A', shares: 900_000, entryPrice: 1.80, prefType: 'non-part', prefMultiple: 1, partCap: 3, isUs: false },
  { id: uid(), name: 'Round B', shares: 2_750_000, entryPrice: 4.00, prefType: 'part-uncapped', prefMultiple: 1, partCap: 3, isUs: false },
  { id: uid(), name: 'Round C', shares: 2_500_000, entryPrice: 9.00, prefType: 'part-uncapped', prefMultiple: 2, partCap: 3, isUs: false },
  { id: uid(), name: 'Round D', shares: 1_800_000, entryPrice: 45.00, prefType: 'part-uncapped', prefMultiple: 1.5, partCap: 3, isUs: false },
  { id: uid(), name: 'Round E (Our Firm)', shares: 1_200_000, entryPrice: 110.00, prefType: 'part-uncapped', prefMultiple: 1, partCap: 3, isUs: true },
];

const PREF_LABELS: Record<PrefType, string> = {
  'common': 'Common',
  'pari-passu': 'Pari Passu',
  'non-part': 'Non-participating',
  'part-uncapped': 'Participating (uncapped)',
  'part-capped': 'Participating (capped)',
};

// ── Main component ────────────────────────────────────────────────────────────

export default function ExitScenarios() {
  const [classes, setClasses] = useState<ShareClass[]>(DEFAULT_CLASSES);
  const [bearM, setBearM] = useState(250);
  const [baseM, setBaseM] = useState(800);
  const [bullM, setBullM] = useState(2000);
  const [holdYears, setHoldYears] = useState(5);
  const [exitType, setExitType] = useState<ExitType>('M&A');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [copied, setCopied] = useState(false);

  // Waterfall results
  const bear = useMemo(() => runWaterfall(bearM, classes, holdYears), [bearM, classes, holdYears]);
  const base = useMemo(() => runWaterfall(baseM, classes, holdYears), [baseM, classes, holdYears]);
  const bull = useMemo(() => runWaterfall(bullM, classes, holdYears), [bullM, classes, holdYears]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function addClass() {
    setClasses(cs => [...cs, {
      id: uid(), name: '', shares: 0, entryPrice: 0,
      prefType: 'part-uncapped', prefMultiple: 1, partCap: 3, isUs: false,
    }]);
  }
  function removeClass(id: string) { setClasses(cs => cs.filter(c => c.id !== id)); }
  function updateClass<K extends keyof ShareClass>(id: string, field: K, val: ShareClass[K]) {
    setClasses(cs => cs.map(c => c.id === id ? { ...c, [field]: val } : c));
  }
  function toggleUs(id: string) {
    setClasses(cs => cs.map(c => ({ ...c, isUs: c.id === id ? !c.isUs : c.isUs })));
  }

  // ── Memo generation ───────────────────────────────────────────────────────────

  function buildMemo(): string {
    const fund = base.classes.find(r => r.isUs);
    const fundClass = classes.find(c => c.isUs);
    const totalShares = classes.reduce((s, c) => s + c.shares, 0);
    const entryOwnership = fundClass ? (fundClass.shares / totalShares * 100).toFixed(1) : '—';
    const prefImpact = base.fundProRataM - base.fundM;

    const alignFlag = (() => {
      const founderPct = base.founderM > 0 ? (base.founderM / baseM) * 100 : 0;
      if (founderPct >= 15) return 'STRONG';
      if (founderPct >= 5) return 'MODERATE';
      return 'WEAK';
    })();

    const flags: string[] = [];
    if (bear.fundMOIC < 1) flags.push(`Loss scenario at bear exit (${fmtM(bearM)}) — fund MOIC ${fmtMOIC(bear.fundMOIC)}`);
    if (base.fundMOIC < 1.5) flags.push(`Thin returns at base exit — MOIC ${fmtMOIC(base.fundMOIC)} below 1.5× threshold`);
    if (bear.insufficient) flags.push(`Bear exit (${fmtM(bearM)}) insufficient to cover participating preference stack`);
    if (prefImpact > base.fundM * 0.3) flags.push(`Preference stack materially reduces fund proceeds — ${fmtM(prefImpact)} reduction vs pro-rata at base exit`);
    if (flags.length === 0) flags.push('No material flags');

    return `## FINANCING & EXIT SUMMARY — FOR AGENT USE

**Fund Entry:**
- Round: ${fundClass?.name ?? '—'}
- Investment: ${fmtM(fund?.investM ?? 0)}
- Entry price: £${fundClass?.entryPrice?.toFixed(2) ?? '—'}/share
- Ownership (entry / exit-adjusted): ${entryOwnership}% / ${entryOwnership}%
- Liquidation preference: ${fundClass ? PREF_LABELS[fundClass.prefType] : '—'} ${fundClass?.prefMultiple ?? 1}×

**Exit Scenarios:**

| Scenario | Valuation | Fund Proceeds | MOIC | IRR | Hold |
|---|---|---|---|---|---|
| Bear | ${fmtM(bearM)} | ${fmtM(bear.fundM)} | ${fmtMOIC(bear.fundMOIC)} | ${fmtIRR(bear.fundIRR)} | ${holdYears} yrs |
| Base | ${fmtM(baseM)} | ${fmtM(base.fundM)} | ${fmtMOIC(base.fundMOIC)} | ${fmtIRR(base.fundIRR)} | ${holdYears} yrs |
| Bull | ${fmtM(bullM)} | ${fmtM(bull.fundM)} | ${fmtMOIC(bull.fundMOIC)} | ${fmtIRR(bull.fundIRR)} | ${holdYears} yrs |

**Preference Stack Impact (Base Scenario):**
- Total preference claims: ${fmtM(base.prefStackM)}
- Fund proceeds under waterfall: ${fmtM(base.fundM)}
- Fund proceeds if converted pro-rata: ${fmtM(base.fundProRataM)}
- Preference stack reduction vs pro-rata: ${fmtM(Math.max(0, prefImpact))}

**Founder Alignment:**
- Founder take-home at base exit: ${fmtM(base.founderM)} (${fmtPct(baseM > 0 ? base.founderM / baseM * 100 : 0)} of exit)
- Founder take-home at bear exit: ${fmtM(bear.founderM)}
- Alignment flag: ${alignFlag}

**Flags for Agent:**
${flags.map(f => `- ${f}`).join('\n')}`;
  }

  async function copyMemo() {
    const text = buildMemo();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Styles ────────────────────────────────────────────────────────────────────

  const card = 'rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-4 space-y-3';
  const hdr = 'text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400';
  const th = 'pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500';
  const td = 'py-2 text-xs text-zinc-600 dark:text-zinc-400';

  // ── Render ────────────────────────────────────────────────────────────────────

  const scenarios: { key: Scenario; label: string; result: WaterfallOut; exitM: number }[] = [
    { key: 'bear', label: 'Bear', result: bear, exitM: bearM },
    { key: 'base', label: 'Base', result: base, exitM: baseM },
    { key: 'bull', label: 'Bull', result: bull, exitM: bullM },
  ];

  // Key insight (base scenario)
  const prefImpact = base.fundProRataM - base.fundM;
  const insightLine = base.classes.some(r => r.isUs)
    ? `At base exit (${fmtM(baseM)}), the fund returns ${fmtMOIC(base.fundMOIC)} / ${fmtIRR(base.fundIRR)} IRR; the preference stack ${prefImpact > 0 ? `reduces fund proceeds by ${fmtM(prefImpact)} vs. pro-rata conversion` : 'does not reduce fund proceeds vs. pro-rata'}.`
    : null;

  return (
    <div className="space-y-4">

      {/* ── Share class table ─────────────────────────────────────────────────── */}
      <div className={card}>
        <h3 className={hdr}>Liquidation Preference Stack</h3>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
          Enter all share classes as they will be at exit. Star (★) the class(es) held by your fund.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className={`${th} text-left pr-2 w-32`}>Class</th>
                <th className={`${th} text-right pr-2 w-28`}>Shares</th>
                <th className={`${th} text-right pr-2 w-24`}>Entry £/sh</th>
                <th className={`${th} text-right pr-2 w-16`}>Invested</th>
                <th className={`${th} text-left pr-2 w-44`}>Preference Type</th>
                <th className={`${th} text-right pr-2 w-12`}>Mult</th>
                <th className={`${th} text-center w-8`}>★</th>
                <th className="pb-2 w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {classes.map(c => {
                const investM = (c.shares * c.entryPrice) / 1_000_000;
                return (
                  <tr key={c.id}>
                    <td className="py-1.5 pr-2">
                      <input
                        value={c.name}
                        onChange={e => updateClass(c.id, 'name', e.target.value)}
                        placeholder="Class name"
                        className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none placeholder-zinc-300 dark:placeholder-zinc-600"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <NumInput
                        value={c.shares}
                        onChange={v => updateClass(c.id, 'shares', v)}
                        step={100000}
                        className="w-28"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <NumInput
                        value={c.entryPrice}
                        onChange={v => updateClass(c.id, 'entryPrice', v)}
                        prefix="£" step={0.01}
                        className="w-24"
                      />
                    </td>
                    <td className={`${td} text-right pr-2 font-medium text-zinc-500 dark:text-zinc-400`}>
                      {investM < 0.1 ? `£${(investM * 1000).toFixed(0)}K` : fmtM(investM)}
                    </td>
                    <td className="py-1.5 pr-2">
                      <select
                        value={c.prefType}
                        onChange={e => updateClass(c.id, 'prefType', e.target.value as PrefType)}
                        className="text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 outline-none cursor-pointer w-full"
                      >
                        {(Object.entries(PREF_LABELS) as [PrefType, string][]).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 pr-2">
                      {(c.prefType !== 'common' && c.prefType !== 'pari-passu') ? (
                        <NumInput
                          value={c.prefMultiple}
                          onChange={v => updateClass(c.id, 'prefMultiple', v)}
                          step={0.25} min={1}
                          className="w-14"
                        />
                      ) : (
                        <span className="text-xs text-zinc-300 dark:text-zinc-600 pl-2">—</span>
                      )}
                    </td>
                    <td className="py-1.5 text-center">
                      <button
                        onClick={() => toggleUs(c.id)}
                        title={c.isUs ? 'Our firm (click to unmark)' : 'Mark as our firm'}
                        className={`p-1 rounded transition-colors ${c.isUs ? 'text-amber-500' : 'text-zinc-300 dark:text-zinc-600 hover:text-amber-400'}`}
                      >
                        <Star className="w-3.5 h-3.5" fill={c.isUs ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="py-1.5">
                      <button onClick={() => removeClass(c.id)} className="text-zinc-300 dark:text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 dark:border-zinc-700">
                <td colSpan={2} className="pt-2">
                  <button onClick={addClass} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add class
                  </button>
                </td>
                <td className={`${td} text-right pr-2 pt-2 font-semibold`}>Total invested:</td>
                <td className={`${td} text-right pr-2 pt-2 font-semibold text-zinc-700 dark:text-zinc-300`}>
                  {fmtM(classes.reduce((s, c) => s + (c.shares * c.entryPrice) / 1_000_000, 0))}
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Exit assumptions ──────────────────────────────────────────────────── */}
      <div className={card}>
        <h3 className={hdr}>Exit Assumptions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Bear exit</p>
            <NumInput value={bearM} onChange={setBearM} prefix="£" suffix="M" step={50} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Base exit</p>
            <NumInput value={baseM} onChange={setBaseM} prefix="£" suffix="M" step={50} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Bull exit</p>
            <NumInput value={bullM} onChange={setBullM} prefix="£" suffix="M" step={100} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Hold period</p>
            <NumInput value={holdYears} onChange={setHoldYears} suffix="yr" step={1} min={1} max={15} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Exit type</p>
            <select
              value={exitType}
              onChange={e => setExitType(e.target.value as ExitType)}
              className="w-full text-sm text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:border-blue-400 transition-colors"
            >
              {(['M&A', 'IPO', 'Secondary'] as ExitType[]).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Three-scenario summary ────────────────────────────────────────────── */}
      <div className={card}>
        <h3 className={hdr}>Exit Scenario Summary — Fund Returns</h3>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className={`${th} text-left`}></th>
                {scenarios.map(s => (
                  <th key={s.key} className={`${th} text-right`}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <tr>
                <td className={`${td} text-zinc-500`}>Exit valuation</td>
                {scenarios.map(s => (
                  <td key={s.key} className={`${td} text-right font-medium text-zinc-700 dark:text-zinc-300`}>{fmtM(s.exitM)}</td>
                ))}
              </tr>
              <tr>
                <td className={`${td} text-zinc-500`}>Exit type</td>
                {scenarios.map(s => (
                  <td key={s.key} className={`${td} text-right`}>{exitType}</td>
                ))}
              </tr>
              <tr>
                <td className={`${td} text-zinc-500`}>Fund proceeds</td>
                {scenarios.map(s => (
                  <td key={s.key} className={`${td} text-right font-semibold text-zinc-700 dark:text-zinc-300`}>{fmtM(s.result.fundM)}</td>
                ))}
              </tr>
              <tr>
                <td className={`${td} text-zinc-500`}>MOIC</td>
                {scenarios.map(s => (
                  <td key={s.key} className={`${td} text-right ${moicTextCls(s.result.fundMOIC)}`}>{fmtMOIC(s.result.fundMOIC)}</td>
                ))}
              </tr>
              <tr>
                <td className={`${td} text-zinc-500`}>IRR</td>
                {scenarios.map(s => (
                  <td key={s.key} className={`${td} text-right font-medium ${s.result.fundIRR >= 0.25 ? 'text-green-600 dark:text-green-400' : 'text-zinc-600 dark:text-zinc-400'}`}>{fmtIRR(s.result.fundIRR)}</td>
                ))}
              </tr>
              <tr>
                <td className={`${td} text-zinc-500`}>Hold period</td>
                {scenarios.map(() => (
                  <td key="hold" className={`${td} text-right`}>{holdYears} yrs</td>
                ))}
              </tr>
              <tr>
                <td className={`${td} text-zinc-500`}>Founder take-home</td>
                {scenarios.map(s => (
                  <td key={s.key} className={`${td} text-right`}>{s.result.founderM > 0 ? fmtM(s.result.founderM) : '—'}</td>
                ))}
              </tr>
              <tr>
                <td className={`${td} text-zinc-500`}>Return flag</td>
                {scenarios.map(s => {
                  const m = s.result.fundMOIC;
                  const flag = m < 1 ? '⚠ Loss' : m < 1.5 ? '▲ Thin' : '✓ OK';
                  const cls = m < 1 ? 'text-red-600 dark:text-red-400' : m < 1.5 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400';
                  return <td key={s.key} className={`${td} text-right font-semibold ${cls}`}>{flag}</td>;
                })}
              </tr>
              {scenarios.some(s => s.result.insufficient) && (
                <tr>
                  <td className={`${td} text-red-500`} colSpan={4}>
                    ⚠ One or more scenarios: exit proceeds insufficient to cover participating preference stack — common shareholders receive nothing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {insightLine && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700 pt-3 italic leading-relaxed">
            {insightLine}
          </p>
        )}

        {/* Waterfall validation warning */}
        {scenarios.some(s => !s.result.sumOk) && (
          <p className="text-[10px] text-red-500">⚠ Waterfall check failed — proceeds do not sum to exit value. Review preference inputs.</p>
        )}
      </div>

      {/* ── Advanced toggle ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Show full waterfall by share class {showAdvanced ? '▲' : '▼'}
        </button>

        {showAdvanced && scenarios.map(s => (
          <div key={s.key} className={`rounded-xl border p-4 space-y-3 ${scenarioBorder(s.result.fundMOIC)}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                {s.label} scenario — {fmtM(s.exitM)} {exitType}
              </h4>
              {s.result.insufficient && (
                <span className="text-[10px] text-red-500 font-medium px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
                  Preference stack exceeds exit proceeds
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className={`${th} text-left pr-2`}>Shareholder</th>
                    <th className={`${th} text-right pr-2`}>Shares</th>
                    <th className={`${th} text-right pr-2`}>Preference type</th>
                    <th className={`${th} text-right pr-2`}>Pref claim</th>
                    <th className={`${th} text-right pr-2`}>Pref payoff</th>
                    <th className={`${th} text-right pr-2`}>Pro-rata share</th>
                    <th className={`${th} text-right pr-2`}>Total payoff</th>
                    <th className={`${th} text-right pr-2`}>% of exit</th>
                    <th className={`${th} text-right`}>MOIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {s.result.classes.map((r, i) => {
                    const cls = classes[i];
                    return (
                      <tr key={r.id} className={r.isUs ? 'bg-amber-50/60 dark:bg-amber-950/10' : ''}>
                        <td className={`py-2 pr-2 font-medium ${r.isUs ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {r.isUs ? '★ ' : ''}{r.name}
                        </td>
                        <td className={`${td} text-right pr-2`}>{fmtShares(r.shares)}</td>
                        <td className={`${td} text-right pr-2`}>{cls ? PREF_LABELS[cls.prefType] : '—'}</td>
                        <td className={`${td} text-right pr-2`}>
                          {r.prefAmountM > 0 ? fmtM(r.prefAmountM) : '—'}
                        </td>
                        <td className={`${td} text-right pr-2`}>
                          {r.prefPayoffM > 0 ? (
                            <span className={r.tookPref ? 'text-blue-600 dark:text-blue-400' : ''}>
                              {fmtM(r.prefPayoffM)}
                              {r.tookPref ? '' : r.prefAmountM > 0 ? ' (converts)' : ''}
                            </span>
                          ) : r.prefAmountM > 0 ? (
                            <span className="text-zinc-400">→ converts</span>
                          ) : '—'}
                        </td>
                        <td className={`${td} text-right pr-2`}>{r.proRataM > 0 ? fmtM(r.proRataM) : '—'}</td>
                        <td className={`${td} text-right pr-2 font-semibold ${r.isUs ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {fmtM(r.totalM)}
                        </td>
                        <td className={`${td} text-right pr-2`}>{fmtPct(r.pctOfExit)}</td>
                        <td className={`${td} text-right ${moicTextCls(r.moic)}`}>
                          {r.investM > 0 ? fmtMOIC(r.moic) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-zinc-300 dark:border-zinc-600 font-semibold">
                    <td className="py-2 text-xs text-zinc-500 dark:text-zinc-400">Total</td>
                    <td colSpan={5} />
                    <td className="py-2 text-xs text-right pr-2 text-zinc-700 dark:text-zinc-300 font-semibold">{fmtM(s.exitM)}</td>
                    <td className="py-2 text-xs text-right pr-2 text-zinc-500">100%</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Flip analysis for non-participating classes */}
            {classes.some(c => c.prefType === 'non-part') && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Preference flip analysis</p>
                {classes.filter(c => c.prefType === 'non-part').map((c, i) => {
                  const result = s.result.classes.find(r => r.id === c.id);
                  const totalShares = classes.reduce((sum, cl) => sum + cl.shares, 0);
                  const investM = (c.shares * c.entryPrice) / 1_000_000;
                  const prefAmountM = investM * c.prefMultiple;
                  // Flip point: at what exit does pro-rata of remaining (after part prefs) equal preference?
                  // pro-rata_remaining = (shares / total) * (exit - partPrefTotal)
                  // flip when: (shares/total) * (exit - partPref) = pref
                  // exit_flip = pref * total / shares + partPref
                  const partPrefTotal = classes.filter(cl => cl.prefType === 'part-uncapped' || cl.prefType === 'part-capped').reduce((sum, cl) => sum + (cl.shares * cl.entryPrice / 1_000_000) * cl.prefMultiple, 0);
                  const flipM = c.shares > 0 ? prefAmountM * totalShares / c.shares + partPrefTotal : null;
                  const elected = result?.tookPref ? 'takes preference' : 'elects conversion';
                  return (
                    <p key={i} className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {c.name}: {elected} at {fmtM(s.exitM)} exit
                      {flipM !== null ? ` — preference flips to conversion above ${fmtM(flipM)} exit valuation` : ''}.
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Generate Memo Section ─────────────────────────────────────────────── */}
      <div className={card}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className={hdr}>Structured Output — Financing & Valuation Agent</h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
              Copy this block into the Agent 4 (Financing & Valuation) prompt context before generating the memo.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMemo(v => !v)}
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              {showMemo ? 'Hide' : 'Preview'}
            </button>
            <button
              onClick={copyMemo}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy memo section'}
            </button>
          </div>
        </div>

        {showMemo && (
          <pre className="mt-2 p-4 rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-300 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {buildMemo()}
          </pre>
        )}
      </div>
    </div>
  );
}
