#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceDir = process.argv[2] || '/private/tmp';
const portalPath = path.join(projectRoot, 'public/demos/ws19-partner-portal.html');
const dataPath = path.join(projectRoot, 'src/data/edge/jefferies-2026.json');

function decodeHtml(value) {
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ',
    ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (_, entity) => {
    if (entity[0] === '#') {
      const hex = entity[1].toLowerCase() === 'x';
      const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    }
    return named[entity.toLowerCase()] ?? _;
  });
}

function text(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function cell(row, className) {
  const match = row.match(new RegExp(`<td class="${className}">([\\s\\S]*?)<\\/td>`));
  return match ? match[1] : '';
}

function partnerType(name, sector) {
  if (/\b(fund|capital|ventures?|investment|equity|partners)\b/i.test(name)) return 'vc';
  if (/biotechnology/i.test(sector)) return 'biotech';
  if (/pharmaceutical|spec pharma|generics/i.test(sector)) return 'mid_pharma';
  if (/life science tools|diagnostics|healthcare services|medical devices/i.test(sector)) return 'cro_cdmo';
  return 'unknown';
}

function capacity(marketCap) {
  if (marketCap >= 10_000) return 'large';
  if (marketCap >= 1_000) return 'medium';
  if (marketCap > 0) return 'small';
  return 'unknown';
}

function parsePage(html, expectedPage) {
  const pageNumbers = [...html.matchAll(/page_num='(\d+)'/g)].map(match => Number(match[1]));
  if (expectedPage === 1 && JSON.stringify(pageNumbers) !== JSON.stringify([2, 3, 4, 5, 6, 7, 8, 9, 10, 11])) {
    throw new Error(`Unexpected public roster pagination: ${JSON.stringify(pageNumbers)}`);
  }
  const rows = [...html.matchAll(/<tr valign=top class="rows">([\s\S]*?)<\/tr>/g)].map(match => match[1]);
  if (rows.length !== 30) throw new Error(`Expected 30 roster entries on page ${expectedPage}; found ${rows.length}`);
  return rows.map(row => {
    const companyCell = cell(row, 'col_company');
    const companyMatch = companyCell.match(/<span class="full_name">([\s\S]*?)<\/span>/);
    if (!companyMatch) throw new Error(`Missing company name on page ${expectedPage}`);
    const name = text(companyMatch[1]);
    const ticker = text(cell(row, 'col_ticker'));
    const marketCapText = text(cell(row, 'col_custom_1219'));
    const marketCap = Number(marketCapText.replace(/[$,]/g, '')) || 0;
    const sector = text(cell(row, 'col_custom_416')) || 'Unknown';
    const participation = text(cell(row, 'col_custom_2212')) || 'Participation type not published';
    const repsCell = cell(row, 'col_company_reps');
    const attendees = [...repsCell.matchAll(/<span class="company_rep"><span class="first">([\s\S]*?)<\/span>\s*<span class="last">([\s\S]*?)<\/span>(?:<span class="last_comma">,\s*<\/span><span class="title">([\s\S]*?)<\/span>)?<\/span>/g)]
      .map(match => ({ name: `${text(match[1])} ${text(match[2])}`.trim(), title: text(match[3] || '') || 'Title not published' }));
    const profileMatch = companyCell.match(/href="(https:\/\/www\.meetmax\.com\/sched\/event_138433\/~public\/profile\.html\?[^\"]+)"/);
    return {
      name,
      partner_type: partnerType(name, sector),
      financial_capacity: capacity(marketCap),
      recent_triggers: [`participation in ${participation} at Jefferies London 2026`],
      desc: `Sector: ${sector}. Participation: ${participation}.${ticker ? ` Ticker: ${ticker}.` : ''}`,
      ticker,
      market_cap_usd_m: marketCap,
      sector,
      participation,
      attendees,
      source_profile: profileMatch ? decodeHtml(profileMatch[1]) : undefined,
    };
  });
}

const universe = [];
for (let page = 1; page <= 11; page += 1) {
  const html = fs.readFileSync(path.join(sourceDir, `jefferies-roster-page${page}.html`), 'utf8');
  universe.push(...parsePage(html, page));
}
if (universe.length !== 330) throw new Error(`Expected 330 Jefferies company entries; found ${universe.length}`);
const attendeeCount = universe.reduce((sum, company) => sum + company.attendees.length, 0);
const companiesWithoutPublishedAttendees = universe.filter(company => company.attendees.length === 0).length;

const portal = fs.readFileSync(portalPath, 'utf8');
const legacyStart = 'const DATA = ';
const datasetsStart = '// EDGE_DATASETS_START\n';
let bioData;
let before;
let after;
if (portal.includes(datasetsStart)) {
  const start = portal.indexOf(datasetsStart);
  const endMarker = '// EDGE_DATASETS_END\n';
  const end = portal.indexOf(endMarker, start);
  if (end < 0) throw new Error('Missing EDGE_DATASETS_END marker');
  const declaration = portal.slice(start + datasetsStart.length, end);
  const match = declaration.match(/^const DATASETS = ([\s\S]*?);\nconst DATASET_KEYS/);
  if (!match) throw new Error('Cannot parse embedded Edge datasets');
  bioData = JSON.parse(match[1])['bio-2026'];
  before = portal.slice(0, start);
  after = portal.slice(end + endMarker.length);
} else {
  const start = portal.indexOf(legacyStart);
  const endMarker = ';\n// ─────────────────────────────────────────────────────────────────────────────\n// Scorer';
  const end = portal.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('Cannot locate legacy Edge dataset');
  bioData = JSON.parse(portal.slice(start + legacyStart.length, end));
  before = portal.slice(0, start);
  after = portal.slice(end + 2);
}

bioData.dataset_key = 'bio-2026';
bioData.list_noun = 'exhibitors';
bioData.conferences = ['Jefferies London 2026', 'BIO 2026'];
const jefferiesData = {
  client: bioData.client,
  conference: 'Jefferies London 2026',
  conferences: ['Jefferies London 2026', 'BIO 2026'],
  dataset_key: 'jefferies-2026',
  list_noun: 'company entries',
  generated: '2026-09-21',
  pulled: '2026-09-21',
  source_url: 'https://www.meetmax.com/sched/event_138433/~public/__co-list_cp.html?event_id=138433',
  attendee_count: attendeeCount,
  top: 40,
  copy: {
    ...bioData.copy,
    banner: 'Sample angle: a fictional drug development consultancy. Replace it with your own company and offer under Set your angle. The current Jefferies company and attendee data and the scoring are real.',
  },
  objectives: {
    ...bioData.objectives,
    description: 'Illustrative demo, a drug development consultancy prioritising biotechs attending Jefferies London 2026',
    prefer: {
      ...bioData.objectives.prefer,
      stage_band_fit: { weight: 0 },
      bd_appetite: { weight: 40, min_signals: 1 },
      financial_capacity: { weight: 30 },
      contact_accessible: { weight: 30 },
    },
  },
  universe,
};

fs.mkdirSync(path.dirname(dataPath), { recursive: true });
fs.writeFileSync(dataPath, `${JSON.stringify(jefferiesData, null, 2)}\n`);
const datasets = { 'jefferies-2026': jefferiesData, 'bio-2026': bioData };
const declaration = `${datasetsStart}const DATASETS = ${JSON.stringify(datasets)};\nconst DATASET_KEYS = ["jefferies-2026", "bio-2026"];\nconst DEFAULT_DATASET_KEY = "jefferies-2026";\nconst requestedDatasetKey = new URLSearchParams(location.search).get("conference");\nconst ACTIVE_DATASET_KEY = DATASET_KEYS.includes(requestedDatasetKey) ? requestedDatasetKey : DEFAULT_DATASET_KEY;\nconst DATA = DATASETS[ACTIVE_DATASET_KEY];\n// EDGE_DATASETS_END\n`;
fs.writeFileSync(portalPath, before + declaration + after);
process.stdout.write(`${JSON.stringify({ companies: universe.length, attendees: attendeeCount, companies_without_published_attendees: companiesWithoutPublishedAttendees, first: universe[0].name, last: universe.at(-1).name })}\n`);
