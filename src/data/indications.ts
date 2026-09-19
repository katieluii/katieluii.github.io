import catalog from './atlas/catalog.json';
import { getETLM } from './atlas/index';

export type TherapeuticArea = 'oncology' | 'neuro' | 'immunology' | 'cardiometabolic';
export interface Indication {
  code: string;
  full?: string;
  ta: TherapeuticArea;
  assets: { name: string; meta: string }[];
}
export const TA_META: { key: TherapeuticArea; label: string }[] = [
  { key: 'oncology', label: 'Oncology' },
  { key: 'neuro', label: 'Neurology' },
  { key: 'cardiometabolic', label: 'Cardiometabolic' },
];
const areas: Record<string, TherapeuticArea> = {
  Oncology: 'oncology', Neurology: 'neuro', Metabolic: 'cardiometabolic',
};
export const INDICATIONS: Indication[] = catalog.indications.map(item => {
  const data = getETLM(item.id);
  const rows = data?.approved_therapies_novel ?? data?.approved_therapies;
  return {
    code: item.short_name,
    full: item.name,
    ta: areas[item.therapeutic_area],
    assets: (Array.isArray(rows) ? rows : []).slice(0, 3).map(row => ({
      name: String(row.drug_name ?? row.asset_name ?? row.brand),
      meta: String(row.trial ?? row.indication_line ?? row.target ?? 'Selected therapy'),
    })),
  };
});
