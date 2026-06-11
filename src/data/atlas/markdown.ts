// Lightweight markdown helpers for splitting Atlas deliverables into briefing vs
// report pieces and bridging GFM tables into the DataTable component.
// Intentionally minimal — react-markdown still does the heavy rendering.

export type MdSection = {
  heading: string;
  level: number; // 2 for ##, 3 for ###
  /** Body text below the heading, up to the next heading of level <= this one. */
  body: string;
};

/** URL/anchor-safe slug from a heading (matches report-route section anchors). */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Split markdown into level-2 (##) and level-3 (###) sections, each as its own
 * entry (body runs until the next ## or ### heading). Treating ### as standalone
 * lets section lookup work across the varied TPP skeletons (some put "Efficacy
 * bar" / "Key gaps" under ###).
 */
export function splitSections(md: string): MdSection[] {
  const lines = md.split('\n');
  const sections: MdSection[] = [];
  let current: MdSection | null = null;
  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (m) {
      if (current) sections.push(current);
      current = { heading: m[2], level: m[1].length, body: '' };
    } else if (current) {
      current.body += line + '\n';
    }
  }
  if (current) sections.push(current);
  return sections.map((s) => ({ ...s, body: s.body.trim() }));
}

/** Return the body of the first level-2 section whose heading matches `re`. */
export function getSection(md: string, re: RegExp): MdSection | undefined {
  return splitSections(md).find((s) => re.test(s.heading));
}

/**
 * Return the full markdown block for the first heading matching `re`, INCLUDING
 * any deeper subsections, up to the next heading of the same-or-higher level.
 * (splitSections separates ### out; this keeps a ## section's ### children.)
 */
export function getSectionBlock(md: string, re: RegExp): string | undefined {
  const lines = md.split('\n');
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{2,3})\s+(.+?)\s*$/);
    if (m && re.test(m[2])) {
      start = i + 1;
      level = m[1].length;
      break;
    }
  }
  if (start === -1) return undefined;
  const out: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,3})\s+/);
    if (m && m[1].length <= level) break;
    out.push(lines[i]);
  }
  return out.join('\n').trim() || undefined;
}

/** The intro paragraph(s) before the first heading (after the # title). */
export function getPreamble(md: string): string {
  const afterTitle = md.replace(/^#\s+.+?\n/, '');
  const idx = afterTitle.search(/^#{2,3}\s+/m);
  return (idx === -1 ? afterTitle : afterTitle.slice(0, idx)).replace(/^---\s*$/gm, '').trim();
}

/** First sentence of a block, stripped of a leading bold label and markdown. */
export function leadSentence(text: string): string {
  const clean = text
    .replace(/^\s*\*\*.+?\*\*:?\s*/, '') // drop a leading bold label ("**Step 4 one-liner:**")
    .replace(/\*\*/g, '')
    .replace(/^\s*[—–-]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const m = clean.match(/^(.+?[.;])(\s|$)/);
  return (m ? m[1] : clean).slice(0, 320);
}

/** Parse "- **lead:** rest" and "1. **lead** — rest" bold-lead bullets. */
export function boldLeadBullets(body: string): { lead: string; rest: string }[] {
  return body
    .split('\n')
    .map((l) => l.match(/^(?:[-*]|\d+\.)\s+\*\*(.+?)\*\*[:]?\s*(.*)$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => ({ lead: m[1].replace(/:$/, ''), rest: leadSentence(m[2]) }));
}

export type GfmTable = { headers: string[]; rows: string[][] };

/**
 * Parse the FIRST GFM pipe-table found in `md`. Strips **bold** markers from cells
 * (DataTable applies its own emphasis). Returns undefined if no table is present.
 */
export function parseGfmTable(md: string): GfmTable | undefined {
  const lines = md.split('\n').map((l) => l.trim());
  const start = lines.findIndex((l) => /^\|.*\|$/.test(l));
  if (start === -1) return undefined;
  const sep = lines[start + 1];
  if (!sep || !/^\|[\s:|-]+\|$/.test(sep)) return undefined;

  const splitRow = (l: string) =>
    l
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim().replace(/\*\*/g, ''));

  const headers = splitRow(lines[start]);
  const rows: string[][] = [];
  for (let i = start + 2; i < lines.length; i++) {
    if (!/^\|.*\|$/.test(lines[i])) break;
    rows.push(splitRow(lines[i]));
  }
  return { headers, rows };
}
