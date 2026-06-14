import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import memoMd from '../data/atlas/memo/obesity-glp1.md?raw';

/* WS15 — sample IC memo viewer. Renders the sourced sample as a document,
   on the same warm canvas / Fraunces system as the work-with-me pages. */

const INK = '#1B1A17';
const BG = '#FAF7F1';
const MUTED = '#6B665D';
const BODY = '#3A362F';
const ACCENT = '#6E2433';
const HAIR = 'rgba(27,26,23,0.12)';
const DISPLAY = "'Fraunces', Georgia, serif";

export default function SampleMemo() {
  return (
    <div style={{ background: BG, color: INK, minHeight: '100vh' }} className="antialiased">
      <div className="mx-auto max-w-2xl px-6 sm:px-8">
        <div className="flex items-center justify-between pt-8 pb-2 text-[13px]" style={{ color: MUTED }}>
          <Link to="/work-with-me/investors" className="hover:opacity-70 transition-opacity">← Back</Link>
          <span style={{ color: ACCENT }} className="uppercase tracking-[0.14em] text-[11px]">Sample deliverable</span>
        </div>

        <article className="py-10 sm:py-14">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-[32px] sm:text-[40px] leading-[1.1] font-semibold mb-6" style={{ fontFamily: DISPLAY, letterSpacing: '-0.015em' }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-[22px] sm:text-[26px] leading-[1.2] font-semibold mt-12 mb-3" style={{ fontFamily: DISPLAY }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-[17px] font-semibold mt-8 mb-2" style={{ color: INK }}>{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-[16px] leading-[1.65] mb-4" style={{ color: BODY }}>{children}</p>
              ),
              ul: ({ children }) => <ul className="list-disc pl-5 mb-5 space-y-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-5 space-y-2">{children}</ol>,
              li: ({ children }) => <li className="text-[15.5px] leading-[1.6]" style={{ color: BODY }}>{children}</li>,
              strong: ({ children }) => <strong style={{ color: INK, fontWeight: 600 }}>{children}</strong>,
              a: ({ children, href }) => <a href={href} style={{ color: ACCENT }} className="underline underline-offset-2">{children}</a>,
              hr: () => <hr className="my-10" style={{ border: 0, borderTop: `1px solid ${HAIR}` }} />,
              table: ({ children }) => (
                <div className="my-6 overflow-x-auto">
                  <table className="w-full text-[14px] border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead>{children}</thead>,
              th: ({ children }) => (
                <th className="text-left font-semibold py-2 pr-4 align-bottom" style={{ color: INK, borderBottom: `1.5px solid ${INK}` }}>{children}</th>
              ),
              td: ({ children }) => (
                <td className="py-2 pr-4 align-top" style={{ color: BODY, borderBottom: `1px solid ${HAIR}` }}>{children}</td>
              ),
              em: ({ children }) => <em style={{ color: MUTED }}>{children}</em>,
            }}
          >
            {memoMd}
          </ReactMarkdown>
        </article>

        <footer className="py-10 text-[12px]" style={{ color: MUTED, borderTop: `1px solid ${HAIR}` }}>
          © 2026 Katie Lui · Illustrative sample, clinical comparators sourced
        </footer>
      </div>
    </div>
  );
}
