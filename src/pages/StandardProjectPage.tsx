// import { useParams, useNavigate } from 'react-router-dom';
// import { ArrowLeft, ExternalLink, FileText, Github } from 'lucide-react';
// import { getProjectBySlug } from '../data/projects';
// import { Pill } from '../components/Pill';

// export function StandardProjectPage() {
//   const { slug } = useParams<{ slug: string }>();
//   const navigate = useNavigate();
//   const project = slug ? getProjectBySlug(slug) : undefined;

//   if (!project) {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black">
//         <div className="max-w-3xl mx-auto px-6 py-16">
//           <button
//             onClick={() => navigate('/')}
//             className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-8"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Back
//           </button>
//           <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Project not found</h1>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black">
//       <div className="max-w-3xl mx-auto px-6 py-16">
//         <button
//           onClick={() => navigate('/')}
//           className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-8 transition-colors"
//         >
//           <ArrowLeft className="w-4 h-4" />
//           Back
//         </button>

//         <div className="space-y-8">
//           {/* Header */}
//           <div className="space-y-4">
//             <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
//               {project.title}
//             </h1>

//             {project.source && (
//               <p className="text-sm text-zinc-500 dark:text-zinc-400">
//                 {project.source}
//               </p>
//             )}

//             <div className="flex items-center gap-2 flex-wrap">
//               <span className="text-sm text-zinc-500 dark:text-zinc-400 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
//                 {project.yearStart === project.yearEnd
//                   ? project.yearStart
//                   : `${project.yearStart}–${project.yearEnd.toString().slice(2)}`}
//               </span>
//             </div>

//             <div className="flex items-center gap-2 flex-wrap">
//               <Pill variant={project.status === 'Live' ? 'status-live' : project.status === 'WIP' ? 'status-wip' : 'tech'}>
//                 {project.status}
//               </Pill>
//               {project.themes.map(theme => (
//                 <Pill key={theme} variant="tech">
//                   {theme}
//                 </Pill>
//               ))}
//             </div>
//           </div>

//           {/* Description */}
//           <div className="prose prose-zinc dark:prose-invert max-w-none">
//             <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
//               {project.longDescription || project.summary}
//             </p>
//           </div>

//           {/* CTA Buttons */}
//           {(project.links.pdf || project.links.posterPdf || project.links.live || project.links.repo) && (
//             <div className="flex flex-wrap gap-3">
//               {project.links.pdf && (
//                 <a
//                   href={project.links.pdf}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
//                 >
//                   <FileText className="w-4 h-4" />
//                   Read report (PDF)
//                 </a>
//               )}
//               {project.links.posterPdf && (
//                 <a
//                   href={project.links.posterPdf}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
//                 >
//                   <FileText className="w-4 h-4" />
//                   View poster (PDF)
//                 </a>
//               )}
//               {project.links.live && (
//                 <a
//                   href={project.links.live}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
//                 >
//                   <ExternalLink className="w-4 h-4" />
//                   View live
//                 </a>
//               )}
//               {project.links.repo && (
//                 <a
//                   href={project.links.repo}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
//                 >
//                   <Github className="w-4 h-4" />
//                   View code
//                 </a>
//               )}
//             </div>
//           )}

//           {/* Sections */}
//           {project.sections && project.sections.length > 0 && (
//             <div className="space-y-8">
//               {project.sections.map((section, idx) => (
//                 <div key={idx} className="space-y-4">
//                   <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
//                     {section.title}
//                   </h2>

//                   {section.bullets && section.bullets.length > 0 && (
//                     <ul className="space-y-2">
//                       {section.bullets.map((bullet, bulletIdx) => (
//                         <li key={bulletIdx} className="flex gap-3 text-zinc-700 dark:text-zinc-300">
//                           <span className="text-zinc-400 dark:text-zinc-500 flex-shrink-0">•</span>
//                           <span>{bullet}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   )}

//                   {section.images && section.images.length > 0 && (
//                     <div className="space-y-4">
//                       {section.images.map((image, imgIdx) => (
//                         <div
//                           key={imgIdx}
//                           className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 ring-1 ring-zinc-200 dark:bg-white/5 dark:ring-white/10"
//                         >
//                           <a
//                             href={image.src}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="block"
//                           >
//                             <img
//                               src={image.src}
//                               alt={image.alt}
//                               className="w-full h-auto rounded-lg"
//                             />
//                           </a>
//                           {image.caption && (
//                             <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 text-center">
//                               {image.caption}
//                             </p>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Tags */}
//           {project.tags.length > 0 && (
//             <div className="space-y-3">
//               <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
//                 Technologies
//               </h2>
//               <div className="flex flex-wrap gap-1.5">
//                 {project.tags.map(tag => (
//                   <Pill key={tag} variant="tech">
//                     {tag}
//                   </Pill>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


import { useParams } from 'react-router-dom';
import { ExternalLink, FileText, Github } from 'lucide-react';
import { getProjectBySlug } from '../data/projects';
import { Pill } from '../components/Pill';
import ProjectPageLayout from '../components/ProjectPageLayout';
import { ProjectLead } from '../components/ProjectLead';

export function StandardProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? getProjectBySlug(slug) : undefined;

  if (!project) {
    return (
      <ProjectPageLayout title="Project not found">
        <p className="text-slate-600">That project slug doesn’t exist.</p>
      </ProjectPageLayout>
    );
  }

  return (
    <ProjectPageLayout title={project.title}>
      <div className="space-y-8">
        {/* Meta row */}
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
        {project.longDescription ? (
          <ProjectLead headline={project.summary}>
            {project.longDescription}
          </ProjectLead>
        ) : (
          <p className="text-[14px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            {project.summary}
          </p>
        )}

        {/* CTA Buttons */}
        {(project.links.pdf ||
          project.links.posterPdf ||
          project.links.live ||
          project.links.repo) && (
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
            {project.links.posterPdf && (
              <a
                href={project.links.posterPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors"
              >
                <FileText className="w-4 h-4" />
                View poster (PDF)
              </a>
            )}
            {project.links.live && (
              <a
                href={project.links.live}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View live
              </a>
            )}
            {project.links.repo && (
              <a
                href={project.links.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <Github className="w-4 h-4" />
                View code
              </a>
            )}
          </div>
        )}

        {/* Sections + Images (keep your existing rendering) */}
        {project.sections && project.sections.length > 0 && (
          <div className="space-y-8">
            {project.sections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                  {section.title}
                </h2>

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="space-y-2">
                    {section.bullets.map((bullet, bulletIdx) => (
                      <li key={bulletIdx} className="flex gap-3 text-slate-700 dark:text-zinc-300">
                        <span className="text-slate-400 dark:text-zinc-500 flex-shrink-0">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.images && section.images.length > 0 && (
                  <div className="space-y-4">
                    {section.images.map((image, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg shadow-sm p-6"
                      >
                        <a
                          href={image.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={image.src}
                            alt={image.alt}
                            className="w-full h-auto rounded-lg"
                          />
                        </a>
                        {image.caption && (
                          <p className="mt-3 text-sm text-slate-600 dark:text-zinc-400 text-center">
                            {image.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
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
      </div>
    </ProjectPageLayout>
  );
}

export default StandardProjectPage;