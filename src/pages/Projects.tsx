import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ChevronDown } from 'lucide-react';
import { ProjectTimeline } from '../components/ProjectTimeline';
import {
  projects,
  getUniqueThemes,
  filterProjectsByTheme,
  filterProjectsByStatus,
  groupProjectsByYear,
  type ProjectTheme,
  type ProjectStatus,
} from '../data/projects';
import { suite, suiteMembership } from '../data/suite';

/* ── /projects — the full index ──────────────────────────────────────────────
   Every project that isn't hidden, oldest work included. The suite view on the
   home page is the curated cut; this is the complete record, filterable by the
   product a tool belongs to (?suite=<letter>), by theme, and by status. */

const NOT_IN_SUITE = 'Not in the suite';
const STATUSES: ProjectStatus[] = ['Live', 'WIP', 'Archived'];

/* One labelled dropdown per filter axis. "All" is the empty value; the axis label
   is the accessible name, so the select reads "Suite, All" not just "All". */
interface FilterSelectProps {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

function FilterSelect({ label, options, selected, onSelect }: FilterSelectProps) {
  const id = `filter-${label.toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={selected ?? ''}
          onChange={(e) => onSelect(e.target.value === '' ? null : e.target.value)}
          className="w-full appearance-none rounded-lg border border-[var(--hair)] bg-[var(--surface)] pl-3 pr-9 py-2 text-sm text-[var(--ink)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <option value="">All</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
      </div>
    </div>
  );
}

export function Projects() {
  const [params, setParams] = useSearchParams();
  const membership = useMemo(() => suiteMembership(), []);
  const themes = useMemo(() => getUniqueThemes(), []);

  const suiteParam = params.get('suite');
  const selectedSuite: string | null =
    suiteParam === 'none' ? NOT_IN_SUITE : suite.find((s) => s.letter === suiteParam)?.name ?? null;
  const [selectedTheme, setSelectedTheme] = useState<ProjectTheme | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | null>(null);

  const setSuite = (value: string | number | null) => {
    const next = new URLSearchParams(params);
    if (value === null) next.delete('suite');
    else if (value === NOT_IN_SUITE) next.set('suite', 'none');
    else {
      const s = suite.find((x) => x.name === value);
      if (s) next.set('suite', s.letter);
    }
    setParams(next, { replace: true });
  };

  const visibleCount = useMemo(() => projects.filter((p) => !p.hideFromTimeline).length, []);
  const yearMin = useMemo(() => Math.min(...projects.map((p) => p.yearStart)), []);

  const grouped = useMemo(() => {
    let list = filterProjectsByTheme(selectedTheme);
    list = filterProjectsByStatus(selectedStatus, list);
    if (selectedSuite === NOT_IN_SUITE) list = list.filter((p) => !membership.has(p.id));
    else if (selectedSuite) list = list.filter((p) => membership.get(p.id)?.name === selectedSuite);
    return groupProjectsByYear(list);
  }, [selectedTheme, selectedStatus, selectedSuite, membership]);

  const suiteTags = useMemo(() => {
    const m = new Map<string, { letter: string; name: string }>();
    membership.forEach((s, id) => m.set(id, { letter: s.letter, name: s.name }));
    return m;
  }, [membership]);

  const shown = Array.from(grouped.values()).reduce((n, arr) => n + arr.length, 0);

  return (
    <ProjectPageLayout
      title="All projects"
      subtitle={`The complete record — ${visibleCount} projects since ${yearMin}, including the research years before the suite.`}
      containerClassName="max-w-3xl mx-auto px-6"
    >
      <div className="mb-10 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FilterSelect
            label="Suite"
            options={[...suite.map((s) => s.name), NOT_IN_SUITE]}
            selected={selectedSuite}
            onSelect={setSuite}
          />
          <FilterSelect
            label="Theme"
            options={themes}
            selected={selectedTheme}
            onSelect={(v) => setSelectedTheme(v as ProjectTheme | null)}
          />
          <FilterSelect
            label="Status"
            options={STATUSES}
            selected={selectedStatus}
            onSelect={(v) => setSelectedStatus(v as ProjectStatus | null)}
          />
        </div>
        <p className="text-xs text-[var(--muted)]" aria-live="polite">
          Showing {shown} of {visibleCount}
        </p>
      </div>

      <ProjectTimeline groupedProjects={grouped} suiteTags={suiteTags} />
    </ProjectPageLayout>
  );
}

export default Projects;
