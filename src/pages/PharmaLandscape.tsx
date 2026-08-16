import { ArrowUpRight, Mail } from 'lucide-react';
import { SuitePageLayout } from '../components/SuitePageLayout';
import { Ladder } from '../components/research/bellwether/Ladder';
import { Signals } from '../components/research/bellwether/Signals';
import { Screener } from '../components/research/bellwether/Screener';
import { Views } from '../components/research/bellwether/Views';
import { Routing } from '../components/research/bellwether/Routing';
import { SectionTitle, btnPrimary, btnQuiet } from '../components/research/bellwether/ui';
import {
  DATA_ASOF, LAST_REVIEWED, UNIVERSE, highExposureCount, DOMINANT, ladderLo, ladderHi, onLadder,
  FULL_LANDSCAPE_ROUTE, latestQuarterLabel,
} from '../data/pharmaLandscape';

/* ── Bellwether ───────────────────────────────────────────────────────────────
   Product B. Journey: masthead with the tear-sheet stamps (data cut, reviewed,
   universe, cadence) → the thesis drawn once (the ladder) + two doors → the two
   extremes → screen the field → the map → how it is built, and what it is not.
   Every count on this page is derived from src/data/pharmaLandscape.ts, which is
   generated from the full landscape; nothing here is typed by hand. */

const EMAIL = 'katie@renascor.xyz';
const REQUEST_RUN = `mailto:${EMAIL}?subject=${encodeURIComponent('Bellwether: run it on my names')}&body=${encodeURIComponent(
  'Tickers:\n\nWhat I want from the read (positioning, cliff bridge, catalysts, all three):\n',
)}`;

export function PharmaLandscape() {
  const stamps = [
    { label: 'Data cut', value: DATA_ASOF, title: 'The reported quarter every figure reflects' },
    { label: 'Page reviewed', value: LAST_REVIEWED, title: 'When a person last reviewed and promoted this cut' },
    { label: 'Universe', value: `${UNIVERSE} names`, title: 'Large-cap pharma, fixed roster' },
    { label: 'Cadence', value: 'Quarterly after results', title: 'Full re-pull each quarter; multiples swept monthly; a human promotes every cut' },
  ];

  return (
    <SuitePageLayout letter="B" stamps={stamps} tagline="Sell-side research on large-cap pharma">
      <div className="space-y-14 pt-10">
        {/* 1 · thesis + the ladder */}
        <section>
          <h2 className="rise max-w-3xl text-[28px] font-semibold leading-[1.12] tracking-[-0.02em] text-[var(--ink-strong)] sm:text-[34px]">
            {UNIVERSE} large-cap pharma names, lined up on one comparable view.
          </h2>
          <p className="rise mt-4 max-w-2xl text-[16px] leading-[1.6] text-[var(--ink)]" style={{ animationDelay: '80ms' }}>
            A cash-generative major and a pipeline-led name should not be read the same way. Bellwether classifies each
            company by how it should be valued, reads its latest reported quarter, and positions it against its peers:
            valuation, patent-cliff exposure and pipeline crowding on one screen. {highExposureCount} of the {UNIVERSE} carry
            high cliff exposure; {DOMINANT.length} pipeline bets each draw in more than a third of the field.
          </p>
          <div className="mt-8">
            <Ladder />
          </div>
          <p className="mt-3 text-[12.5px] text-[var(--muted)]">
            Forward P/E, {onLadder.length} names on the ladder, {ladderLo}× to {ladderHi}×. Latest quarter in the cut: {latestQuarterLabel}.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href={FULL_LANDSCAPE_ROUTE} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
              Open the full landscape <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
            <a href={REQUEST_RUN} className={btnQuiet}>
              <Mail className="h-4 w-4" aria-hidden /> Request a run on your names
            </a>
          </div>
          <p className="mt-2 text-[12.5px] text-[var(--muted)]">
            Runs on your tickers are done by hand today, on the same engine, and come back as a note. No self-serve run yet.
          </p>
        </section>

        {/* 2 · the two extremes */}
        <section className="border-t border-[var(--hair)] pt-10">
          <SectionTitle aside={`${DATA_ASOF} read`}>The two names the read pulls furthest apart</SectionTitle>
          <div className="mt-5">
            <Signals />
          </div>
        </section>

        {/* 3 · screen */}
        <section className="border-t border-[var(--hair)] pt-10">
          <SectionTitle>Screen the field</SectionTitle>
          <p className="mt-2 max-w-2xl text-[15px] leading-[1.6] text-[var(--muted)]">
            Filter to a thesis and sort. Each filter says exactly what it tests.
          </p>
          <div className="mt-5">
            <Screener />
          </div>
        </section>

        {/* 4 · the map */}
        <section className="border-t border-[var(--hair)] pt-10">
          <SectionTitle>See it on the map</SectionTitle>
          <p className="mt-2 max-w-2xl text-[15px] leading-[1.6] text-[var(--muted)]">
            The same names, four cuts. Open a company for its numbers, cliff bridge and dated developments.
          </p>
          <div className="mt-5">
            <Views />
          </div>
        </section>

        {/* 5 · how it is built, and what it is not */}
        <section className="border-t border-[var(--hair)] pt-10">
          <SectionTitle>How a name is routed</SectionTitle>
          <div className="mt-4">
            <Routing />
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--ink-strong)]">What is on this page</h3>
              <ul className="mt-2 space-y-2 text-[14px] leading-[1.55] text-[var(--muted)]">
                <li><span className="font-medium text-[var(--ink)]">Reported</span>: revenue, growth and dated developments come from each company's disclosures for the quarter shown, and are fact-checked before a cut is promoted.</li>
                <li><span className="font-medium text-[var(--ink)]">Consensus</span>: stances and targets on the company cards are third-party sell-side consensus as compiled at the data cut, shown for context.</li>
                <li><span className="font-medium text-[var(--ink)]">Estimated</span>: a multiple tagged <em>est.</em> (trailing, NTM or single-aggregator) is not a clean forward figure and is never ranked against one.</li>
                <li><span className="font-medium text-[var(--ink)]">Model</span>: theses, bull and bear cases and the two extremes are the system's read, phrased by a language model over the reported figures.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--ink-strong)]">What it is not</h3>
              <ul className="mt-2 space-y-2 text-[14px] leading-[1.55] text-[var(--muted)]">
                <li>Not a research report and not investment advice. Katie Lui is not an authorised person and this is not a recommendation to buy, sell or hold any security.</li>
                <li>No fair value or price target is produced here. Where a target appears it is quoted consensus, not the author's number.</li>
                <li>Not real-time. The data cut is stamped at the top of the page; a person reviews and promotes every refresh. Roche reports half-yearly, so its latest period is a half, not a quarter.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </SuitePageLayout>
  );
}

export default PharmaLandscape;
