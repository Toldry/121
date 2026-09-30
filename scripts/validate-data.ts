/**
 * Checks the bill and faction data before a build.
 * Run with `npm run validate`. Exits non-zero on any error.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES, REASONING_LANGUAGES, type Bill, type FactionData } from '../src/data/types';

const root = join(import.meta.dirname, '..');
const read = <T>(path: string): T => JSON.parse(readFileSync(join(root, path), 'utf8')) as T;

const errors: string[] = [];
const warnings: string[] = [];
const error = (msg: string) => errors.push(msg);

const factions = read<FactionData>('src/data/factions.json');
const totalSeats = factions.seating.reduce((sum, f) => sum + (factions.factions[f]?.seats ?? 0), 0);
if (totalSeats !== 120) error(`factions: seats add up to ${totalSeats}, expected 120`);
for (const id of factions.seating) {
  const faction = factions.factions[id];
  if (!faction) {
    error(`factions: "${id}" is in seating but not defined`);
    continue;
  }
  for (const lang of LANGUAGES) {
    if (!faction.name[lang]) error(`factions.${id}: missing name.${lang}`);
    if (faction.list2026 && !faction.list2026[lang]) error(`factions.${id}: missing list2026.${lang}`);
  }
}

const REQUIRED_TEXT = [
  'title',
  'short',
  'stage',
  'sponsor',
  'summary',
  'supporters',
  'opponents',
  'whyThisBill',
] as const;

const billDir = join(root, 'src/data/bills');
const ids = new Set<string>();
for (const file of readdirSync(billDir).filter((f) => f.endsWith('.json'))) {
  const bill = read<Bill>(`src/data/bills/${file}`);
  const where = `bills/${file}`;
  if (`${bill.id}.json` !== file) error(`${where}: id "${bill.id}" does not match file name`);
  if (ids.has(bill.id)) error(`${where}: duplicate id "${bill.id}"`);
  ids.add(bill.id);

  if (!(bill.salience >= 1 && bill.salience <= 10)) error(`${where}: salience must be 1–10`);
  if (bill.date !== null && !/^\d{4}-\d{2}(-\d{2})?$/.test(bill.date)) {
    error(`${where}: date must be YYYY-MM-DD, YYYY-MM or null`);
  }
  if (bill.status !== 'verified') warnings.push(`${where}: status is "${bill.status}"`);

  for (const id of factions.seating) {
    const v = bill.votes[id];
    if (!v) {
      error(`${where}: no vote record for faction "${id}"`);
      continue;
    }
    const sum = v.for + v.against + v.abstain + v.absent;
    const seats = factions.factions[id].seats;
    if (sum !== seats) error(`${where}: faction "${id}" counts add up to ${sum}, expected ${seats}`);
  }
  for (const id of Object.keys(bill.votes)) {
    if (!factions.factions[id]) error(`${where}: vote for unknown faction "${id}"`);
  }
  for (const id of bill.boycottCountedAsAgainst) {
    if (!factions.factions[id]) error(`${where}: boycott lists unknown faction "${id}"`);
  }

  for (const lang of LANGUAGES) {
    const text = bill.text[lang];
    if (!text) {
      error(`${where}: missing text.${lang}`);
      continue;
    }
    for (const key of REQUIRED_TEXT) if (!text[key]) error(`${where}: missing text.${lang}.${key}`);
  }

  for (const lang of REASONING_LANGUAGES) {
    const sections = bill.reasoning[lang];
    if (!sections?.length) {
      error(`${where}: missing reasoning.${lang}`);
      continue;
    }
    for (const section of sections) {
      for (const p of section.paragraphs) {
        for (const n of p.cites) {
          if (n < 1 || n > bill.sources.length) {
            error(`${where}: reasoning.${lang} cites [${n}] but there are ${bill.sources.length} sources`);
          }
        }
      }
    }
  }
  bill.sources.forEach((source, i) => {
    for (const lang of REASONING_LANGUAGES) {
      if (!source.title[lang]) error(`${where}: source ${i + 1} missing title.${lang}`);
    }
    if (bill.status === 'verified' && !source.url) error(`${where}: verified bill has source ${i + 1} without url`);
  });
}

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  console.error(`\n${errors.length} error(s) in bill data.`);
  process.exit(1);
}
console.log(`Bill data OK: ${ids.size} bills, ${factions.seating.length} factions.`);
