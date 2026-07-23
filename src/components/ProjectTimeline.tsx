import { useState, useEffect, useRef } from 'react';
import { ProjectRow } from './ProjectRow';
import { Project } from '../data/projects';

interface ProjectTimelineProps {
  groupedProjects: Map<number, Project[]>;
}

export function ProjectTimeline({ groupedProjects }: ProjectTimelineProps) {
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const yearRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const years = Array.from(groupedProjects.keys()).sort((a, b) => b - a);

  useEffect(() => {
    const observers = new Map<number, IntersectionObserver>();

    years.forEach(year => {
      const element = yearRefs.current.get(year);
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveYear(year);
          }
        },
        {
          root: null,
          rootMargin: '-50% 0px -50% 0px',
          threshold: 0
        }
      );

      observer.observe(element);
      observers.set(year, observer);
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [years]);

  const scrollToYear = (year: number) => {
    const element = yearRefs.current.get(year);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (years.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        No projects match your filters
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[2.375rem] top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800" />

      {years.map((year) => {
        const projects = groupedProjects.get(year) || [];
        const isActive = activeYear === year;
        const isHovered = hoveredYear === year;
        const isProjectHovered = hoveredProject === year;

        return (
          <div
            key={year}
            ref={(el) => {
              if (el) yearRefs.current.set(year, el);
            }}
            className="relative flex gap-8 mb-8 last:mb-0"
          >
            <div className="flex-shrink-0 w-20">
              <div className="flex items-start gap-3">
                <div className="relative flex flex-col items-center">
                  <button
                    onClick={() => scrollToYear(year)}
                    onMouseEnter={() => setHoveredYear(year)}
                    onMouseLeave={() => setHoveredYear(null)}
                    className="relative focus:outline-none group z-10"
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ring-4 ring-zinc-100 dark:ring-zinc-900 transition-all duration-200 ${
                        isActive || isProjectHovered
                          ? 'bg-zinc-900 dark:bg-zinc-100 scale-125'
                          : isHovered
                          ? 'bg-zinc-700 dark:bg-zinc-300 scale-110'
                          : 'bg-zinc-900 dark:bg-zinc-100'
                      }`}
                    />
                  </button>
                </div>
                <button
                  onClick={() => scrollToYear(year)}
                  onMouseEnter={() => setHoveredYear(year)}
                  onMouseLeave={() => setHoveredYear(null)}
                  className={`text-sm font-semibold text-zinc-900 dark:text-zinc-100 transition-all duration-200 focus:outline-none ${
                    isActive || isProjectHovered ? 'scale-105 font-bold text-zinc-950 dark:text-zinc-50' : isHovered ? 'scale-105' : ''
                  }`}
                >
                  {year}
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {projects.map((project) => (
                <ProjectRow
                  key={project.id}
                  title={project.title}
                  description={project.summary}
                  status={project.status}
                  href={project.links.live || `/projects/${project.slug}`}
                  tags={project.tags}
                  yearStart={project.yearStart}
                  yearEnd={project.yearEnd}
                  themes={project.themes}
                  isYearHighlighted={isHovered}
                  onHover={(isHovering) => setHoveredProject(isHovering ? year : null)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
