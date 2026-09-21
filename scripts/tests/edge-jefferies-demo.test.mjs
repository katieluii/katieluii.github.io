import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const portal = fs.readFileSync(new URL('../../public/demos/ws19-partner-portal.html', import.meta.url), 'utf8');
const jefferies = JSON.parse(fs.readFileSync(new URL('../../src/data/edge/jefferies-2026.json', import.meta.url), 'utf8'));

function embeddedDatasets() {
  const match = portal.match(/\/\/ EDGE_DATASETS_START\nconst DATASETS = (.*);\nconst DATASET_KEYS/s);
  assert.ok(match, 'embedded dataset block is present');
  return JSON.parse(match[1]);
}

test('Jefferies roster snapshot has the complete verified public-page inventory', () => {
  assert.equal(jefferies.conference, 'Jefferies London 2026');
  assert.equal(jefferies.pulled, '2026-09-21');
  assert.equal(jefferies.universe.length, 330);
  assert.equal(jefferies.universe[0].name, '10x Genomics, Inc.');
  assert.equal(jefferies.universe.at(-1).name, 'Esteve Pharmaceuticals, S.A.');
  assert.equal(jefferies.universe.reduce((count, company) => count + company.attendees.length, 0), 899);
  assert.equal(jefferies.universe.filter(company => company.attendees.length === 0).length, 7);
  for (const company of jefferies.universe) {
    assert.ok(company.name);
    assert.ok(company.sector);
    assert.ok(company.participation);
    for (const attendee of company.attendees) {
      assert.ok(attendee.name);
      assert.ok(attendee.title);
    }
  }
});

test('portal defaults to Jefferies and retains the complete BIO dataset', () => {
  const datasets = embeddedDatasets();
  assert.deepEqual(Object.keys(datasets), ['jefferies-2026', 'bio-2026']);
  assert.equal(datasets['jefferies-2026'].universe.length, 330);
  assert.equal(datasets['bio-2026'].universe.length, 1654);
  assert.match(portal, /const DEFAULT_DATASET_KEY = "jefferies-2026";/);
  assert.match(portal, /location\.replace\(url\.href\)/);
  assert.match(portal, /Attendees listed by/);
});
