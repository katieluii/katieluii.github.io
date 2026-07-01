import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Check, Lock, X } from 'lucide-react';
import {
  FORMSPREE_ENDPOINT,
  ACCESS_CONTACT_EMAIL,
  PREVIEW_MAX_HEIGHT,
  ACCESS_REQUESTED_KEY,
} from '../../data/atlas/gating';
import { DETAIL_HOOK } from '../../data/atlas/copy';

// --- Email-capture form -------------------------------------------------------

type FormState = 'idle' | 'submitting' | 'done' | 'error';

function alreadyRequested(): boolean {
  try {
    return localStorage.getItem(ACCESS_REQUESTED_KEY) === '1';
  } catch {
    return false;
  }
}

function markRequested() {
  try {
    localStorage.setItem(ACCESS_REQUESTED_KEY, '1');
  } catch {
    /* private mode — non-fatal */
  }
}

/** Email capture for Atlas access. Posts to Formspree when configured, else
 *  opens a prefilled mailto. Submitting captures the lead and confirms — it
 *  does NOT unlock the content inline; I send the report to the captured email. */
export function AccessRequestForm({ context }: { context: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>(() => (alreadyRequested() ? 'done' : 'idle'));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState('submitting');

    if (!FORMSPREE_ENDPOINT) {
      // No backend configured — fall back to the visitor's mail client.
      const subject = encodeURIComponent(`Atlas report — ${context}`);
      const body = encodeURIComponent(
        `Hi Katie,\n\nI'd like the report for the Atlas deliverable: ${context}.\n\nMy email: ${email}\n\nThanks.`,
      );
      window.location.href = `mailto:${ACCESS_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      markRequested();
      setState('done');
      return;
    }

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), deliverable: context }),
      });
      if (!res.ok) throw new Error(String(res.status));
      markRequested();
      setState('done');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-start gap-2.5 text-left">
        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
          Thanks — I'll send you the report
          {email.trim() ? <> at <span className="font-medium text-zinc-900 dark:text-zinc-100">{email.trim()}</span></> : ''}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Your email"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/15 dark:bg-white/5 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-60"
        >
          {state === 'submitting' ? 'Sending…' : 'Send me the report'}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {state === 'error' ? (
        <p className="text-[12px] text-rose-600 dark:text-rose-400">
          Something went wrong. Email{' '}
          <a className="underline" href={`mailto:${ACCESS_CONTACT_EMAIL}`}>
            {ACCESS_CONTACT_EMAIL}
          </a>{' '}
          and I'll set you up.
        </p>
      ) : null}
    </form>
  );
}

// --- The gate card (shared by the blur mask + the modal) ----------------------

export function GateCard({ context }: { context: string }) {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border-t-2 border-indigo-500 bg-white/95 shadow-xl ring-1 ring-zinc-200 backdrop-blur-sm dark:bg-zinc-900/95 dark:ring-white/10">
      <div className="space-y-3 p-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <Lock className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
            Request access
          </span>
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Unlock the full {context}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            Drop your email and I'll send you the report.
          </p>
        </div>
        <AccessRequestForm context={context} />
      </div>
    </div>
  );
}

// --- Detail hook: OPEN value tease under a redacted summary (no blur wall) ----

/** Sits at the foot of a redacted ETLM summary. Names what the open view shows
 *  vs. what the paid full map adds, then captures a lead. Unlike RedactionGate
 *  this never blurs or blocks — the summary above stays fully readable. */
export function DetailHook({ context }: { context: string }) {
  return (
    <section className="mt-10 overflow-hidden rounded-2xl border-t-2 border-indigo-500 bg-white/70 ring-1 ring-zinc-200 dark:bg-white/[0.03] dark:ring-white/10">
      <div className="grid gap-6 p-6 md:grid-cols-2 md:p-7">
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            {DETAIL_HOOK.shownLabel}
          </span>
          <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            {DETAIL_HOOK.shown}
          </p>
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
            <Lock className="h-3 w-3" />
            {DETAIL_HOOK.withheldLabel}
          </span>
          <ul className="space-y-1.5">
            {DETAIL_HOOK.withheld.map((line) => (
              <li
                key={line}
                className="flex gap-2 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-200"
              >
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-indigo-500" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-200/70 px-6 py-5 dark:border-white/10 md:px-7">
        <p className="mb-2 text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
          {DETAIL_HOOK.cta} — {context}
        </p>
        <p className="mb-3 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {DETAIL_HOOK.ctaNote}
        </p>
        <AccessRequestForm context={context} />
      </div>
    </section>
  );
}

/** Inline glyph standing in for a redacted benchmark cell. */
export function RedactedValue() {
  return (
    <span
      title="In the full landscape map"
      className="inline-flex items-center text-zinc-300 dark:text-zinc-600"
      aria-label="redacted"
    >
      <Lock className="h-3 w-3" />
    </span>
  );
}

// --- Redaction gate: free slice above, blurred-and-gated content below --------

/** Wraps the deep portion of a deliverable. Children render but are clamped to
 *  a preview height; the tail blurs into the page background and a centered
 *  GateCard sits over the fade. */
export function RedactionGate({
  context,
  children,
  maxHeight = PREVIEW_MAX_HEIGHT,
  bypass = false,
}: {
  context: string;
  children: ReactNode;
  maxHeight?: number;
  bypass?: boolean;
}) {
  if (bypass) return <>{children}</>;
  return (
    <div className="relative" style={{ maxHeight }}>
      <div className="overflow-hidden" style={{ maxHeight }} aria-hidden>
        {children}
      </div>

      {/* blur + fade veil over the lower two-thirds */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent via-[#fafafa]/80 to-[#fafafa] backdrop-blur-[3px] dark:via-[#0b0f14]/80 dark:to-[#0b0f14]"
        aria-hidden
      />

      {/* gate card pinned over the fade */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 pb-2">
        <GateCard context={context} />
      </div>
    </div>
  );
}

// --- Modal: for locked catalog cards that have no preview to clamp ------------

export function AccessGateModal({
  context,
  onClose,
}: {
  context: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!context) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [context, onClose]);

  if (!context) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm motion-safe:animate-[fadeIn_120ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-label={`Request access to ${context}`}
      onClick={onClose}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-2 -top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-zinc-500 shadow ring-1 ring-zinc-200 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-white/10 dark:hover:text-zinc-100"
        >
          <X className="h-4 w-4" />
        </button>
        <GateCard context={context} />
      </div>
    </div>
  );
}
