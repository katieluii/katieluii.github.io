import { FileText } from 'lucide-react';
import { getProjectBySlug } from '../data/projects';
import { Pill } from '../components/Pill';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';
import { TrialPredictor } from '../components/TrialPredictor';

export function TrialRecruitment() {
  const project = getProjectBySlug('trial-recruitment-prediction');

  if (!project) {
    return (
      <ProjectPageLayout title="Project not found">
        <p className="text-slate-600 dark:text-zinc-400">That project doesn't exist.</p>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout title={project.title} subtitle="Source: ClinicalTrials.gov">
      <div className="space-y-8">
        {/* Status + theme pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-600 dark:text-zinc-400 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded">
            {project.yearStart === project.yearEnd
              ? project.yearStart
              : `${project.yearStart}–${project.yearEnd.toString().slice(2)}`}
          </span>

          <Pill
            variant={
              project.status === 'Live'
                ? 'status-live'
                : project.status === 'WIP'
                  ? 'status-wip'
                  : 'tech'
            }
          >
            {project.status}
          </Pill>

          {project.themes.map(theme => (
            <Pill key={theme} variant="tech">
              {theme}
            </Pill>
          ))}
        </div>

        {/* Description */}
        <ProjectLead headline="Predict trial enrolment timelines before the first site opens.">
          {project.longDescription || project.summary}
        </ProjectLead>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {project.links.pdf && (
            <a
              href={project.links.pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Read report (PDF)
            </a>
          )}
        </div>

        {/* Technology tags */}
        {project.tags.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
              Technologies
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map(tag => (
                <Pill key={tag} variant="tech">
                  {tag}
                </Pill>
              ))}
            </div>
          </div>
        )}

        {/* Native predictor — no iframe, calls Railway API directly */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
            Interactive Demo
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-500">
            Select a trial phase and therapeutic area to get an ML-predicted duration with 80% prediction interval.
          </p>
          <TrialPredictor />
        </div>
      </div>
    </ProjectPageLayout>
  );
}

export default TrialRecruitment;
