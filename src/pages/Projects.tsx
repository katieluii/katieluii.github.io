import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { FilterChips } from '../components/FilterChips';
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
      <div className="space-y-6 mb-10">
        <div className="space-y-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Suite</span>
          <FilterChips
            options={[...suite.map((s) => s.name), NOT_IN_SUITE]}
            selected={selectedSuite}
            onSelect={setSuite}
          />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Theme</span>
          <FilterChips
            options={themes}
            selected={selectedTheme}
            onSelect={(v) => setSelectedTheme(v as ProjectTheme | null)}
          />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Status</span>
          <FilterChips
            options={STATUSES}
            selected={selectedStatus}
            onSelect={(v) => setSelectedStatus(v as ProjectStatus | null)}
          />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
          Showing {shown} of {visibleCount}
        </p>
      </div>

      <ProjectTimeline groupedProjects={grouped} suiteTags={suiteTags} />
    </ProjectPageLayout>
  );
}

export default Projects;
