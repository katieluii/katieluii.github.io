import { useState, useRef } from 'react';
import { Plus, Trash2, Star, Upload } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type HolderType = 'Founder' | 'Investor' | 'Option Pool' | 'Employee' | 'Other';

interface Holder {
  id: string;
  name: string;
  pct: number;
  type: HolderType;
}

interface Participant {
  id: string;
  name: string;
  amountM: number;
  isUs: boolean;
}

interface FutureRound {
  id: string;
  name: string;
  preMoneyM: number;
  raiseM: number;
  optionTopUpPct: number;
}

interface StageRow {
  name: string;
  type: string;
  pct: number;
  amountInvestedM?: number;
  isUs?: boolean;
}

type Stage = StageRow[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function fmtM(n: number, d = 1): string {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(d)}B`;
  return `$${n.toFixed(d)}M`;
}

function fmtPct(n: number): string { return `${n.toFixed(1)}%`; }

function fmtMOIC(n: number): string { return `${n.toFixed(2)}×`; }

function fmtIRR(n: number): string { return `${(n * 100).toFixed(1)}%`; }

function applyRound(
  stage: Stage,
  preM: number,
  raiseM: number,
  optionTopUpPct: number,
  newInvestors: { name: string; amountM: number; isUs?: boolean }[],
): Stage {
  if (preM <= 0 || raiseM <= 0) return stage;
  const postM = preM + raiseM;
  const newInvPct = (raiseM / postM) * 100;
  const dilFactor = (100 - newInvPct - optionTopUpPct) / 100;

  const result: Stage = stage.map(h => ({
    ...h,
    pct: h.type === 'Option Pool'
      ? h.pct * dilFactor + optionTopUpPct
      : h.pct * dilFactor,
  }));

  if (optionTopUpPct > 0 && !stage.some(h => h.type === 'Option Pool')) {
    result.push({ name: 'Option Pool', type: 'Option Pool', pct: optionTopUpPct });
  }

  for (const inv of newInvestors) {
    result.push({
      name: inv.name,
      type: 'Investor',
      pct: (inv.amountM / postM) * 100,
      amountInvestedM: inv.amountM,
      isUs: inv.isUs ?? false,
    });
  }

  return result;
}

function parseCsv(text: string): Holder[] {
  const lines = text.trim().split(/\r?\n/);
  return lines.slice(1).flatMap(line => {
    const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    const name = cols[0];
    const pct = parseFloat(cols[1]);
    if (!name || isNaN(pct)) return [];
    return [{ id: uid(), name, pct, type: 'Investor' as HolderType }];
  });
}

// ─── Shared input ──────────────────────────────────────────────────────────────

function NumInput({
  value, onChange, prefix, suffix, step = 1, min = 0, max, className = '',
}: {
  value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; step?: number; min?: number; max?: number; className?: string;
}) {
  return (
    <div className={`flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors ${className}`}>
      {prefix && <span className="text-xs text-zinc-400 dark:text-zinc-500 mr-1 flex-shrink-0">{prefix}</span>}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Math.max(min, Number(e.target.value) || 0))}
        className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {suffix && <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1 flex-shrink-0">{suffix}</span>}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function CapTableHelper() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [holders, setHolders] = useState<Holder[]>([
    { id: uid(), name: 'Founders', pct: 65, type: 'Founder' },
    { id: uid(), name: 'Seed Investors', pct: 25, type: 'Investor' },
    { id: uid(), name: 'Option Pool', pct: 10, type: 'Option Pool' },
  ]);

  const [preMoneyM, setPreMoneyM] = useState(50);
  const [raiseM, setRaiseM] = useState(15);
  const [optionTopUp, setOptionTopUp] = useState(5);
  const [participants, setParticipants] = useState<Participant[]>([
    { id: uid(), name: 'Our Firm', amountM: 10, isUs: true },
  ]);

  const [futureRounds, setFutureRounds] = useState<FutureRound[]>([]);
  const [yearsToExit, setYearsToExit] = useState(5);
  const [exitVals, setExitVals] = useState([100, 250, 500, 1000]);

  // ── Compute stages ─────────────────────────────────────────────────────────

  const postMoneyM = preMoneyM + raiseM;

  const stage0: Stage = holders.map(h => ({ name: h.name, type: h.type, pct: h.pct }));

  const stage1: Stage = applyRound(
    stage0, preMoneyM, raiseM, optionTopUp,
    participants.map(p => ({ name: p.name, amountM: p.amountM, isUs: p.isUs })),
  );

  const stages: Stage[] = [stage0, stage1];
  let latestStage = stage1;

  for (const fr of futureRounds) {
    latestStage = applyRound(
      latestStage, fr.preMoneyM, fr.raiseM, fr.optionTopUpPct,
      [{ name: `${fr.name} Investors`, amountM: fr.raiseM }],
    );
    stages.push(latestStage);
  }

  // Unique holder names in logical order (first appearance across stages)
  const allNames: string[] = [];
  const seen = new Set<string>();
  for (const stage of stages) {
    for (const h of stage) {
      if (!seen.has(h.name)) { seen.add(h.name); allNames.push(h.name); }
    }
  }

  const stageLabels = ['Pre-round', 'Post-round', ...futureRounds.map(fr => fr.name)];

  // Our firm's investment & latest ownership
  const ourInvested = participants.filter(p => p.isUs).reduce((s, p) => s + p.amountM, 0);
  const ourPctLatest = latestStage.filter(h => h.isUs).reduce((s, h) => s + h.pct, 0);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function addHolder() {
    setHolders(h => [...h, { id: uid(), name: '', pct: 0, type: 'Other' }]);
  }
  function removeHolder(id: string) { setHolders(h => h.filter(x => x.id !== id)); }
  function updateHolder(id: string, field: keyof Holder, value: string | number) {
    setHolders(h => h.map(x => x.id === id ? { ...x, [field]: value } : x));
  }

  function addParticipant() {
    setParticipants(p => [...p, { id: uid(), name: '', amountM: 0, isUs: false }]);
  }
  function removeParticipant(id: string) { setParticipants(p => p.filter(x => x.id !== id)); }
  function updateParticipant(id: string, field: keyof Participant, value: string | number | boolean) {
    setParticipants(p => p.map(x => x.id === id ? { ...x, [field]: value } : x));
  }

  function addFutureRound() {
    const idx = futureRounds.length;
    const names = ['Series A', 'Series B', 'Series C', 'Series D'];
    setFutureRounds(r => [...r, {
      id: uid(),
      name: names[idx] ?? `Round ${idx + 1}`,
      preMoneyM: Math.round(postMoneyM * (3 + idx * 2)),
      raiseM: 30,
      optionTopUpPct: 5,
    }]);
  }
  function removeFutureRound(id: string) { setFutureRounds(r => r.filter(x => x.id !== id)); }
  function updateFutureRound(id: string, field: keyof FutureRound, value: string | number) {
    setFutureRounds(r => r.map(x => x.id === id ? { ...x, [field]: value } : x));
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseCsv(ev.target?.result as string);
      if (parsed.length > 0) setHolders(parsed);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ── Derived checks ─────────────────────────────────────────────────────────

  const totalPct = holders.reduce((s, h) => s + h.pct, 0);
  const totalRoundAmt = participants.reduce((s, p) => s + p.amountM, 0);
  const roundImbalance = Math.abs(totalRoundAmt - raiseM) > 0.1;

  // ── Styles ─────────────────────────────────────────────────────────────────

  const cardCls = 'rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-4 space-y-3';
  const hdrCls = 'text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400';
  const thCls = 'pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-right first:text-left';
  const tdCls = 'py-2 text-xs text-zinc-600 dark:text-zinc-400 text-right';
  const readonlyCls = 'flex items-center rounded-lg border border-zinc-200/50 dark:border-zinc-700/50 bg-zinc-100 dark:bg-zinc-800 px-2.5 h-[34px]';

  return (
    <div className="space-y-4">

      {/* ── Section A: Current cap table ──────────────────────────────────── */}
      <div className={cardCls}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className={hdrCls}>Current Cap Table</h3>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <Upload className="w-3 h-3" /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">CSV format: Name, Ownership % (with header row)</p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className={thCls + ' text-left'}>Shareholder</th>
                <th className={thCls + ' text-left pl-3'}>Type</th>
                <th className={thCls}>Ownership %</th>
                <th className="pb-2 w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {holders.map(h => (
                <tr key={h.id}>
                  <td className="py-1.5 pr-2">
                    <input
                      value={h.name}
                      onChange={e => updateHolder(h.id, 'name', e.target.value)}
                      placeholder="Shareholder name"
                      className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none placeholder-zinc-300 dark:placeholder-zinc-600"
                    />
                  </td>
                  <td className="py-1.5 pl-3 pr-2">
                    <select
                      value={h.type}
                      onChange={e => updateHolder(h.id, 'type', e.target.value)}
                      className="text-xs text-zinc-600 dark:text-zinc-400 bg-transparent outline-none cursor-pointer"
                    >
                      {(['Founder', 'Investor', 'Option Pool', 'Employee', 'Other'] as HolderType[]).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1.5 w-28">
                    <NumInput value={h.pct} onChange={v => updateHolder(h.id, 'pct', v)} suffix="%" step={0.5} />
                  </td>
                  <td className="py-1.5 pl-2">
                    <button onClick={() => removeHolder(h.id)} className="text-zinc-300 dark:text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={addHolder}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add row
          </button>
          <span className={`text-xs font-medium ${Math.abs(totalPct - 100) < 0.5 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
            Total: {fmtPct(totalPct)}
          </span>
        </div>
      </div>

      {/* ── Section B: This round ──────────────────────────────────────────── */}
      <div className={cardCls}>
        <h3 className={hdrCls}>This Round</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Pre-money</p>
            <NumInput value={preMoneyM} onChange={setPreMoneyM} prefix="$" suffix="M" step={5} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Round size</p>
            <NumInput value={raiseM} onChange={setRaiseM} prefix="$" suffix="M" step={1} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Post-money</p>
            <div className={readonlyCls}>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{fmtM(postMoneyM)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Option pool top-up</p>
            <NumInput value={optionTopUp} onChange={setOptionTopUp} suffix="%" step={0.5} min={0} max={20} />
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Investors in This Round</p>
          <div className="space-y-1.5">
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <input
                  value={p.name}
                  onChange={e => updateParticipant(p.id, 'name', e.target.value)}
                  placeholder="Investor name"
                  className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 outline-none placeholder-zinc-300 dark:placeholder-zinc-600 focus:border-blue-400 transition-colors min-w-0"
                />
                <NumInput
                  value={p.amountM}
                  onChange={v => updateParticipant(p.id, 'amountM', v)}
                  prefix="$" suffix="M" step={1}
                  className="w-28 flex-shrink-0"
                />
                <button
                  onClick={() => updateParticipant(p.id, 'isUs', !p.isUs)}
                  title={p.isUs ? 'Our firm (click to unmark)' : 'Mark as our firm'}
                  className={`flex-shrink-0 p-1.5 rounded-lg border transition-colors ${
                    p.isUs
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-500'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600 hover:text-amber-400'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" fill={p.isUs ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => removeParticipant(p.id)} className="flex-shrink-0 text-zinc-300 dark:text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button
              onClick={addParticipant}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add investor
            </button>
            {roundImbalance && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                Investor amounts ({fmtM(totalRoundAmt)}) ≠ round size ({fmtM(raiseM)})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Section C: Future rounds ───────────────────────────────────────── */}
      <div className={cardCls}>
        <div className="flex items-center justify-between gap-2">
          <h3 className={hdrCls}>Future Rounds</h3>
          {futureRounds.length < 4 && (
            <button
              onClick={addFutureRound}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add round
            </button>
          )}
        </div>

        {futureRounds.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">No future rounds modelled yet. Add rounds to see projected dilution.</p>
        ) : (
          <div className="space-y-3">
            {futureRounds.map(fr => {
              const frPost = fr.preMoneyM + fr.raiseM;
              return (
                <div key={fr.id} className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={fr.name}
                      onChange={e => updateFutureRound(fr.id, 'name', e.target.value)}
                      className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 bg-transparent outline-none flex-1"
                    />
                    <button onClick={() => removeFutureRound(fr.id)} className="text-zinc-300 dark:text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Pre-money</p>
                      <NumInput value={fr.preMoneyM} onChange={v => updateFutureRound(fr.id, 'preMoneyM', v)} prefix="$" suffix="M" step={10} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Raise</p>
                      <NumInput value={fr.raiseM} onChange={v => updateFutureRound(fr.id, 'raiseM', v)} prefix="$" suffix="M" step={5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Post-money</p>
                      <div className={readonlyCls}>
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{fmtM(frPost)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Pool top-up</p>
                      <NumInput value={fr.optionTopUpPct} onChange={v => updateFutureRound(fr.id, 'optionTopUpPct', v)} suffix="%" step={0.5} min={0} max={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section D: Ownership summary ───────────────────────────────────── */}
      <div className={cardCls}>
        <h3 className={hdrCls}>Ownership Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className={thCls}>Holder</th>
                {stageLabels.map(l => <th key={l} className={thCls}>{l}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {allNames.map(name => {
                const isUs = stages.some(s => s.find(h => h.name === name)?.isUs);
                return (
                  <tr key={name} className={isUs ? 'bg-amber-50/60 dark:bg-amber-950/10' : ''}>
                    <td className={`py-2 pr-3 text-xs font-medium ${isUs ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {isUs ? '★ ' : ''}{name}
                    </td>
                    {stages.map((stage, si) => {
                      const row = stage.find(r => r.name === name);
                      return (
                        <td key={si} className={`${tdCls} ${isUs ? 'font-semibold text-amber-700 dark:text-amber-400' : ''}`}>
                          {row ? fmtPct(row.pct) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="border-t-2 border-zinc-300 dark:border-zinc-600 font-semibold">
                <td className="py-2 text-xs text-zinc-500 dark:text-zinc-400">Total</td>
                {stages.map((stage, si) => (
                  <td key={si} className="py-2 text-xs text-right text-zinc-500 dark:text-zinc-400 font-semibold">
                    {fmtPct(stage.reduce((s, h) => s + h.pct, 0))}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section E: Exit scenarios ──────────────────────────────────────── */}
      {ourInvested > 0 && ourPctLatest > 0 && (
        <div className={cardCls}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className={hdrCls}>Exit Scenarios</h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-400">Years to exit:</span>
              <NumInput value={yearsToExit} onChange={setYearsToExit} suffix="yr" step={1} min={1} max={15} className="w-20" />
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            Based on ★ {fmtPct(ourPctLatest)} ownership after all modelled rounds · {fmtM(ourInvested)} invested · {yearsToExit}yr hold · assumes pro-rata equity at exit
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {exitVals.map((ev, i) => {
              const proceeds = (ourPctLatest / 100) * ev;
              const moic = ourInvested > 0 ? proceeds / ourInvested : 0;
              const irr = yearsToExit > 0 && moic > 0 ? Math.pow(moic, 1 / yearsToExit) - 1 : 0;
              const moicColor = moic >= 3 ? 'text-green-600 dark:text-green-400' : moic >= 1 ? 'text-zinc-800 dark:text-zinc-200' : 'text-red-500 dark:text-red-400';
              return (
                <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 space-y-2">
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Exit valuation</p>
                    <NumInput
                      value={ev}
                      onChange={v => setExitVals(vals => vals.map((x, j) => j === i ? v : x))}
                      prefix="$" suffix="M" step={50}
                    />
                  </div>
                  <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-zinc-400">Proceeds</span>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{fmtM(proceeds)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-zinc-400">MOIC</span>
                      <span className={`text-xs font-bold ${moicColor}`}>{fmtMOIC(moic)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-zinc-400">IRR</span>
                      <span className={`text-xs font-medium ${irr >= 0.25 ? 'text-green-600 dark:text-green-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {fmtIRR(irr)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
