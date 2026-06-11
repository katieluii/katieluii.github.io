// "Analyst's read" — the 5 hottest themes in drug development right now.
//
// DATA lives in `analyst_read.json` (pure JSON so the weekly Monday refresh job
// can rewrite it safely). The full ecosystem detail stays in the backend
// (ecosystem_knowledge.md); this is only the headline distillation.
//
// Refresh cadence: weekly, Mondays — regenerated from the latest committed
// ecosystem note. Keep it to exactly 5 narratives.
//
// Source URLs point at authoritative landing pages (company newsroom /
// conference / registry / trade press). TODO(human): swap in exact
// article/press-release deep links where you have them.

import data from './analyst_read.json';

export type Momentum = 'Hot' | 'Confirmed' | 'Watch';
export type EcoSource = { label: string; url?: string };
export type EcoNarrative = {
  headline: string;
  detail: string;
  momentum: Momentum;
  sources: EcoSource[];
};

export const ecosystemUpdated: string = data.updated;
export const ecosystemIntro: string = data.intro;
export const ecosystemNarratives: EcoNarrative[] = (data.narratives as EcoNarrative[]).slice(0, 5);
