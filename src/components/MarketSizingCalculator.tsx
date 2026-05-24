import { useState } from 'react';

type Mode = 'bottom-up' | 'top-down';

function fmt$(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function NumField({
  label, note, value, onChange, prefix, suffix, step = 1, min = 0,
}: {
  label: string; note?: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; step?: number; min?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs text-zinc-500 dark:text-zinc-400">{label}</label>
      {note && <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">{note}</p>}
      <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors">
        {prefix && <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">{prefix}</span>}
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={e => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

function SizingBar({ label, sublabel, value, maxValue, colorClass }: {
  label: string; sublabel: string; value: number; maxValue: number; colorClass: string;
}) {
  const pct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline gap-2">
        <div>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-2">{sublabel}</span>
        </div>
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex-shrink-0">{fmt$(value)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function MarketSizingCalculator() {
  const [mode, setMode] = useState<Mode>('bottom-up');

  // Bottom-up state
  const [patientPop, setPatientPop] = useState(2_000_000);
  const [diagRate, setDiagRate] = useState(55);
  const [treatRate, setTreatRate] = useState(40);
  const [mktShare, setMktShare] = useState(15);
  const [pricePerPt, setPricePerPt] = useState(80_000);

  // Top-down state
  const [tamM, setTamM] = useState(5_000);
  const [samPct, setSamPct] = useState(45);
  const [somPct, setSomPct] = useState(15);

  let tam: number, sam: number, som: number;
  let somPatients = 0;

  if (mode === 'bottom-up') {
    tam = patientPop * pricePerPt;
    sam = patientPop * (diagRate / 100) * (treatRate / 100) * pricePerPt;
    som = sam * (mktShare / 100);
    somPatients = Math.round(patientPop * (diagRate / 100) * (treatRate / 100) * (mktShare / 100));
  } else {
    tam = tamM * 1_000_000;
    sam = tam * (samPct / 100);
    som = sam * (somPct / 100);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 space-y-5">
      {/* Mode toggle */}
      <div className="inline-flex rounded-full bg-zinc-100 dark:bg-zinc-900 p-1 gap-1">
        {(['bottom-up', 'top-down'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
              mode === m
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {m === 'bottom-up' ? 'Bottom-Up' : 'Top-Down'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-3">
          {mode === 'bottom-up' ? (
            <>
              <NumField
                label="Total patient population" note="Global prevalence of the indication"
                value={patientPop} onChange={setPatientPop} step={100_000}
              />
              <NumField
                label="Diagnosis rate" note="% of patients diagnosed in practice"
                value={diagRate} onChange={setDiagRate} suffix="%" min={0}
              />
              <NumField
                label="Treatment rate" note="% of diagnosed patients receiving treatment"
                value={treatRate} onChange={setTreatRate} suffix="%" min={0}
              />
              <NumField
                label="Expected market share" note="Realistic peak capture"
                value={mktShare} onChange={setMktShare} suffix="%" min={0}
              />
              <NumField
                label="Price per patient / year" note="Annual net price or licensing fee"
                value={pricePerPt} onChange={setPricePerPt} prefix="$" step={5_000}
              />
            </>
          ) : (
            <>
              <NumField
                label="Total market — analyst estimate" note="Published market research figure"
                value={tamM} onChange={setTamM} prefix="$" suffix="M" step={100}
              />
              <NumField
                label="Serviceable segment" note="Geography, line of therapy, indication subset, etc."
                value={samPct} onChange={setSamPct} suffix="%" min={0}
              />
              <NumField
                label="Realistic market share" note="Peak share based on competitive dynamics"
                value={somPct} onChange={setSomPct} suffix="%" min={0}
              />
            </>
          )}
        </div>

        {/* Output */}
        <div className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Estimated Market Size</p>
          <div className="space-y-4">
            <SizingBar label="TAM" sublabel="Total Addressable Market" value={tam} maxValue={tam} colorClass="bg-blue-200 dark:bg-blue-900" />
            <SizingBar label="SAM" sublabel="Serviceable Addressable Market" value={sam} maxValue={tam} colorClass="bg-blue-400 dark:bg-blue-600" />
            <SizingBar label="SOM" sublabel="Serviceable Obtainable Market" value={som} maxValue={tam} colorClass="bg-blue-600 dark:bg-blue-400" />
          </div>

          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-4">
            <p className="text-[10px] uppercase tracking-widest text-blue-500 dark:text-blue-400 font-semibold">Peak Annual Revenue (SOM)</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{fmt$(som)}</p>
            {mode === 'bottom-up' && somPatients > 0 && (
              <p className="text-[10px] text-blue-400 dark:text-blue-500 mt-1.5">
                {fmtPt(somPatients)} patients × {fmt$(pricePerPt)}/yr
              </p>
            )}
            {mode === 'top-down' && (
              <p className="text-[10px] text-blue-400 dark:text-blue-500 mt-1.5">
                {samPct}% of TAM × {somPct}% capture
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
