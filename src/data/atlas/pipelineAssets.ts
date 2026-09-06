export const TRIAL_STATUS_ORDER = [
  'RECRUITING',
  'ACTIVE_NOT_RECRUITING',
  'NOT_YET_RECRUITING',
  'ENROLLING_BY_INVITATION',
  'COMPLETED',
  'SUSPENDED',
  'TERMINATED',
  'WITHDRAWN',
  'CONFLICTING',
  'UNKNOWN_MISSING',
  'UNKNOWN_UNPARSEABLE',
] as const;

export type NormalizedTrialStatus = (typeof TRIAL_STATUS_ORDER)[number];
export type PipelineRow = Record<string, unknown>;

export type AssetTrial = {
  relationId: string;
  rowIndex: number;
  normalizedStatus: NormalizedTrialStatus;
  rawStatus: string | null;
  row: PipelineRow;
};

export type AssetGroup = {
  id: string;
  governed: boolean;
  identityState: 'governed' | 'identity_pending';
  assetName: string;
  company: string;
  modality: string;
  target: string;
  population: string;
  phase: string;
  trials: AssetTrial[];
  statuses: NormalizedTrialStatus[];
};

const STATUS_PATTERNS: ReadonlyArray<[NormalizedTrialStatus, RegExp]> = [
  ['ACTIVE_NOT_RECRUITING', /\bACTIVE(?:_|\s+|-)+NOT(?:_|\s+|-)+RECRUITING\b/i],
  ['NOT_YET_RECRUITING', /\bNOT(?:_|\s+|-)+YET(?:_|\s+|-)+RECRUITING\b/i],
  ['ENROLLING_BY_INVITATION', /\bENROLLING(?:_|\s+|-)+BY(?:_|\s+|-)+INVITATION\b/i],
  ['RECRUITING', /\bRECRUITING\b/i],
  ['COMPLETED', /\bCOMPLETED\b/i],
  ['SUSPENDED', /\bSUSPENDED\b/i],
  ['TERMINATED', /\bTERMINATED\b/i],
  ['WITHDRAWN', /\bWITHDRAWN\b/i],
];

export function normalizeTrialStatus(raw: unknown): NormalizedTrialStatus {
  if (raw == null || String(raw).trim() === '') return 'UNKNOWN_MISSING';

  // Remove longer matched phrases before checking shorter ones. This prevents
  // ACTIVE_NOT_RECRUITING and NOT_YET_RECRUITING from also matching RECRUITING.
  let remainder = String(raw);
  const matches = new Set<NormalizedTrialStatus>();
  for (const [status, pattern] of STATUS_PATTERNS) {
    if (pattern.test(remainder)) {
      matches.add(status);
      remainder = remainder.replace(new RegExp(pattern.source, 'gi'), ' ');
    }
  }

  if (matches.size > 1) return 'CONFLICTING';
  if (matches.size === 1) return [...matches][0];
  return 'UNKNOWN_UNPARSEABLE';
}

function clean(value: unknown, fallback = '—'): string {
  const result = value == null ? '' : String(value).trim();
  return result || fallback;
}

function governedAssetIdentity(row: PipelineRow): string | null {
  for (const key of ['canonical_asset_id', 'asset_group_id', 'asset_id']) {
    const value = row[key];
    if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) {
      return `${key}:${String(value).trim()}`;
    }
  }
  return null;
}

function stableToken(input: string): string {
  // FNV-1a is used only for an opaque, reproducible UI key. It never decides
  // whether two records represent the same asset.
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function provisionalIdentity(row: PipelineRow, indicationCode: string, rowIndex: number): string {
  const seed = [
    indicationCode,
    clean(row.nct, ''),
    clean(row.trial_name, ''),
    clean(row.source, ''),
    String(rowIndex),
  ].join('|');
  return `provisional:${stableToken(seed)}`;
}

function relationIdentity(row: PipelineRow, indicationCode: string, rowIndex: number): string {
  const explicit = row.asset_trial_id ?? row.relationship_id;
  if ((typeof explicit === 'string' || typeof explicit === 'number') && String(explicit).trim()) {
    return `relationship:${String(explicit).trim()}`;
  }
  return `relationship:${stableToken([
    indicationCode,
    clean(row.nct, ''),
    clean(row.trial_name, ''),
    clean(row.asset_name ?? row.drug_name, ''),
    String(rowIndex),
  ].join('|'))}`;
}

function preferredPhase(trials: AssetTrial[]): string {
  const phases = [...new Set(trials.map(({ row }) => clean(row.phase)))];
  return phases.length === 1 ? phases[0] : phases.join(' / ');
}

function combinedField(
  trials: AssetTrial[],
  select: (row: PipelineRow) => unknown,
): string {
  const values = [...new Set(trials.map(({ row }) => clean(select(row))).filter((value) => value !== '—'))];
  return values.length > 0 ? values.join(' · ') : '—';
}

export function groupPipelineAssets(rows: PipelineRow[], indicationCode: string): AssetGroup[] {
  const groups = new Map<string, AssetGroup>();

  rows.forEach((row, rowIndex) => {
    const governedId = governedAssetIdentity(row);
    const id = governedId ?? provisionalIdentity(row, indicationCode, rowIndex);
    const trial: AssetTrial = {
      relationId: relationIdentity(row, indicationCode, rowIndex),
      rowIndex,
      normalizedStatus: normalizeTrialStatus(row.status),
      rawStatus: row.status == null ? null : String(row.status),
      row,
    };
    const existing = groups.get(id);
    if (existing) {
      existing.trials.push(trial);
      return;
    }
    groups.set(id, {
      id,
      governed: governedId !== null,
      identityState: governedId === null ? 'identity_pending' : 'governed',
      assetName: clean(row.asset_name ?? row.drug_name),
      company: clean(row.company ?? row.sponsor),
      modality: clean(row.modality),
      target: clean(row.target),
      population: clean(row.population ?? row.indication_subtype),
      phase: clean(row.phase),
      trials: [trial],
      statuses: [],
    });
  });

  return [...groups.values()].map((group) => ({
    ...group,
    phase: preferredPhase(group.trials),
    company: combinedField(group.trials, (row) => row.current_owner ?? row.company ?? row.sponsor),
    modality: combinedField(group.trials, (row) => row.modality),
    target: combinedField(group.trials, (row) => row.target),
    population: combinedField(group.trials, (row) => row.population ?? row.indication_subtype),
    statuses: TRIAL_STATUS_ORDER.filter((status) =>
      group.trials.some((trial) => trial.normalizedStatus === status),
    ),
  }));
}

export function filterAssetGroups(
  groups: AssetGroup[],
  selectedStatuses: ReadonlySet<NormalizedTrialStatus>,
): AssetGroup[] {
  if (selectedStatuses.size === 0) return groups;
  return groups.filter((group) =>
    group.trials.some((trial) => selectedStatuses.has(trial.normalizedStatus)),
  );
}

export function visibleTrials(
  group: AssetGroup,
  selectedStatuses: ReadonlySet<NormalizedTrialStatus>,
): AssetTrial[] {
  if (selectedStatuses.size === 0) return group.trials;
  return group.trials.filter((trial) => selectedStatuses.has(trial.normalizedStatus));
}

export function trialStatusLabel(status: NormalizedTrialStatus): string {
  const labels: Record<NormalizedTrialStatus, string> = {
    RECRUITING: 'Recruiting',
    ACTIVE_NOT_RECRUITING: 'Active, not recruiting',
    NOT_YET_RECRUITING: 'Not yet recruiting',
    ENROLLING_BY_INVITATION: 'Enrolling by invitation',
    COMPLETED: 'Completed',
    SUSPENDED: 'Suspended',
    TERMINATED: 'Terminated',
    WITHDRAWN: 'Withdrawn',
    CONFLICTING: 'Conflicting',
    UNKNOWN_MISSING: 'Unknown: missing',
    UNKNOWN_UNPARSEABLE: 'Unknown: unparseable',
  };
  return labels[status];
}
