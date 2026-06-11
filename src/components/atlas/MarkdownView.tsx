import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { slugify } from '../../data/atlas/markdown';

type Props = {
  markdown: string;
  /** When true, h2/h3 get slugified ids so briefings can deep-link to sections. */
  anchors?: boolean;
};

function textOf(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(textOf).join('');
  if (children && typeof children === 'object' && 'props' in (children as any))
    return textOf((children as any).props?.children);
  return '';
}

export function MarkdownView({ markdown, anchors = false }: Props) {
  const components = anchors
    ? {
        h2: ({ children }: { children?: ReactNode }) => (
          <h2 id={slugify(textOf(children))} className="scroll-mt-24">
            {children}
          </h2>
        ),
        h3: ({ children }: { children?: ReactNode }) => (
          <h3 id={slugify(textOf(children))} className="scroll-mt-24">
            {children}
          </h3>
        ),
      }
    : undefined;

  return (
    <article
      className="
        max-w-none
        text-zinc-800 dark:text-zinc-200
        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:mt-0 [&_h1]:mb-6
        [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100
        [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-zinc-900 dark:[&_h3]:text-zinc-100
        [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:uppercase [&_h4]:tracking-wider [&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-zinc-500 dark:[&_h4]:text-zinc-400
        [&_p]:my-3 [&_p]:leading-relaxed [&_p]:text-zinc-700 dark:[&_p]:text-zinc-300 [&_p]:max-w-[72ch]
        [&_ul]:my-3 [&_ul]:pl-5 [&_ul]:list-disc
        [&_ol]:my-3 [&_ol]:pl-5 [&_ol]:list-decimal
        [&_li]:my-1 [&_li]:text-zinc-700 dark:[&_li]:text-zinc-300 [&_li]:max-w-[72ch]
        [&_a]:text-indigo-600 dark:[&_a]:text-indigo-400 [&_a]:underline [&_a]:decoration-dotted [&_a]:underline-offset-4
        [&_strong]:font-semibold [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-100
        [&_em]:italic
        [&_code]:rounded [&_code]:bg-zinc-100 dark:[&_code]:bg-zinc-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono
        [&_pre]:rounded-lg [&_pre]:bg-zinc-900 [&_pre]:text-zinc-100 [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-4
        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-zinc-100
        [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 dark:[&_blockquote]:border-zinc-700 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-600 dark:[&_blockquote]:text-zinc-400 [&_blockquote]:my-4
        [&_table]:w-full [&_table]:my-5 [&_table]:text-sm
        [&_th]:text-left [&_th]:font-semibold [&_th]:py-2 [&_th]:px-3 [&_th]:bg-zinc-100 dark:[&_th]:bg-zinc-800 [&_th]:text-zinc-900 dark:[&_th]:text-zinc-100
        [&_td]:py-2 [&_td]:px-3 [&_td]:border-t [&_td]:border-zinc-200 dark:[&_td]:border-white/10
        [&_hr]:my-8 [&_hr]:border-zinc-200 dark:[&_hr]:border-white/10
      "
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </article>
  );
}

export default MarkdownView;
