import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Pill } from './Pill';

interface ProjectRowProps {
  title: string;
  description: string;
  status: 'Live' | 'WIP' | 'Archived';
  href: string;
  tags: string[];
  yearStart: number;
  yearEnd: number;
  themes: string[];
  isYearHighlighted?: boolean;
  onHover?: (isHovering: boolean) => void;
}

export function ProjectRow({ title, description, status, href, tags, isYearHighlighted, onHover }: ProjectRowProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(href)}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={`group relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ring-1 hover:ring-zinc-300 dark:bg-white/5 dark:hover:ring-white/20 ${
        isYearHighlighted
          ? 'ring-zinc-250 dark:ring-white/15 bg-white/70 dark:bg-white/[0.06]'
          : 'ring-zinc-200 dark:ring-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-zinc-900 tracking-tight dark:text-zinc-100">
              {title}
            </h3>
            <Pill variant={status === 'Live' ? 'status-live' : status === 'WIP' ? 'status-wip' : 'tech'}>
              {status}
            </Pill>
          </div>

          <p className="text-sm text-zinc-600 leading-relaxed dark:text-zinc-400">
            {description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Pill key={tag} variant="tech">
                {tag}
              </Pill>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 mt-1 text-zinc-400 group-hover:text-zinc-600 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-zinc-500 dark:group-hover:text-zinc-300">
          <ArrowUpRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
