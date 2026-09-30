/**
 * Pulls plenum votes from oknesset.org (Hasadna's knesset-data-pipelines output).
 *
 *   npx tsx scripts/oknesset.ts coverage          what the data covers, latest vote date
 *   npx tsx scripts/oknesset.ts search <text>...  find 25th-Knesset votes by title/subject
 *   npx tsx scripts/oknesset.ts factions          25th-Knesset faction names, and which are mapped
 *   npx tsx scripts/oknesset.ts import            fill in `votes` for every bill with a voteId
 *
 * Each bill links to its vote through `voteSource.voteId` (a KNS_PlenumVote Id).
 * Factions are matched by the Hebrew names listed in `knessetFactionNames` in
 * src/data/factions.json. Downloads are cached in .cache/oknesset/.
 */
import { parse } from 'csv-parse';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { Bill, FactionData, FactionVote } from '../src/data/types';

const BASE = 'https://production.oknesset.org/pipelines/data';
const FILES = {
  plenumVote: 'knesset/kns_plenumvote/kns_plenumvote.csv',
  plenumVoteResult: 'knesset/kns_plenumvoteresult/kns_plenumvoteresult.csv',
  members: 'members/mk_individual/mk_individual.csv',
  memberFactions: 'members/mk_individual/mk_individual_factions.csv',
} as const;

/** The 25th Knesset was sworn in on 15 November 2022. */
const KNESSET_25_START = '2022-11-15';

const ROOT = join(import.meta.dirname, '..');
const CACHE = join(ROOT, '.cache/oknesset');
const BILL_DIR = join(ROOT, 'src/data/bills');
const FACTIONS_PATH = join(ROOT, 'src/data/factions.json');

type Row = Record<string, string>;

async function download(file: string): Promise<string> {
  const local = join(CACHE, file.replaceAll('/', '__'));
  if (existsSync(local)) return local;
  mkdirSync(CACHE, { recursive: true });
  const url = `${BASE}/${file}`;
  console.log(`Downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url}: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(local));
  return local;
}

/** Streams a CSV file, calling `onRow` for each record. */
async function eachRow(file: string, onRow: (row: Row) => void): Promise<void> {
  const parser = createReadStream(await download(file)).pipe(
    parse({ columns: true, bom: true, relax_quotes: true, skip_records_with_error: true }),
  );
  for await (const row of parser) onRow(row as Row);
}

async function readRows(file: string, keep: (row: Row) => boolean = () => true): Promise<Row[]> {
  const rows: Row[] = [];
  await eachRow(file, (row) => {
    if (keep(row)) rows.push(row);
  });
  return rows;
}

const day = (datetime: string) => datetime.slice(0, 10);

/** Normalises Hebrew faction names: geresh/gershayim variants, dashes, spacing. */
function normaliseName(name: string): string {
  return name
    .replace(/[״"”“]/g, '"')
    .replace(/[׳'’]/g, "'")
    .replace(/[–—־-]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

async function knesset25Votes(): Promise<Row[]> {
  return readRows(FILES.plenumVote, (r) => day(r.VoteDateTime ?? '') >= KNESSET_25_START);
}

async function coverage() {
  const byYear = new Map<string, number>();
  let latest = '';
  await eachRow(FILES.plenumVote, (r) => {
    const date = day(r.VoteDateTime ?? '');
    byYear.set(date.slice(0, 4), (byYear.get(date.slice(0, 4)) ?? 0) + 1);
    if (date > latest) latest = date;
  });
  console.log('Plenum votes per year:');
  for (const [year, n] of [...byYear].sort()) console.log(`  ${year}: ${n}`);
  console.log(`Latest vote: ${latest}`);

  let results = 0;
  let resultsK25 = 0;
  let latestResult = '';
  await eachRow(FILES.plenumVoteResult, (r) => {
    results++;
    const date = day(r.VoteDate ?? '');
    if (date >= KNESSET_25_START) resultsK25++;
    if (date > latestResult) latestResult = date;
  });
  console.log(`Per-member results: ${results} rows, ${resultsK25} in the 25th Knesset, latest ${latestResult}`);

  const memberships = await readRows(FILES.memberFactions, (r) => r.knesset === '25');
  console.log(`25th-Knesset faction memberships: ${memberships.length}`);
}

async function search(terms: string[]) {
  const votes = await knesset25Votes();
  const hits = votes.filter((v) => {
    const text = `${v.VoteTitle} ${v.VoteSubject}`;
    return terms.every((t) => text.includes(t));
  });
  console.log(`${hits.length} of ${votes.length} 25th-Knesset votes match "${terms.join(' ')}":`);
  for (const v of hits.sort((a, b) => a.VoteDateTime.localeCompare(b.VoteDateTime))) {
    console.log(`  ${v.Id}  ${day(v.VoteDateTime)}  ${v.VoteTitle} — ${v.VoteSubject} [${v.VoteStatusDesc}]`);
  }
}

function loadFactions(): FactionData {
  return JSON.parse(readFileSync(FACTIONS_PATH, 'utf8')) as FactionData;
}

function factionLookup(data: FactionData): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const [id, faction] of Object.entries(data.factions)) {
    for (const name of faction.knessetFactionNames ?? []) lookup.set(normaliseName(name), id);
  }
  return lookup;
}

async function listFactions() {
  const lookup = factionLookup(loadFactions());
  const memberships = await readRows(FILES.memberFactions, (r) => r.knesset === '25');
  const counts = new Map<string, number>();
  for (const m of memberships) counts.set(m.faction_name, (counts.get(m.faction_name) ?? 0) + 1);
  console.log('25th-Knesset factions in oknesset data (members ever in faction):');
  for (const [name, n] of [...counts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${lookup.get(normaliseName(name)) ?? '(unmapped)'}\t${n}\t${name}`);
  }
}

const RESULT_STANCE: Record<string, keyof FactionVote> = {
  'בעד': 'for',
  'נגד': 'against',
  'נמנע': 'abstain',
};

async function importVotes() {
  const data = loadFactions();
  const lookup = factionLookup(data);
  const billFiles = readdirSync(BILL_DIR).filter((f) => f.endsWith('.json'));
  const bills = billFiles.map((f) => JSON.parse(readFileSync(join(BILL_DIR, f), 'utf8')) as Bill);
  const linked = bills.filter((b) => b.voteSource?.voteId != null);
  if (!linked.length) {
    console.log('No bill has voteSource.voteId set; nothing to import.');
    return;
  }

  const voteIds = new Set(linked.map((b) => String(b.voteSource!.voteId)));
  const votes = new Map((await readRows(FILES.plenumVote, (r) => voteIds.has(r.Id))).map((v) => [v.Id, v]));

  const results = new Map<string, Row[]>();
  await eachRow(FILES.plenumVoteResult, (r) => {
    if (!voteIds.has(r.VoteID)) return;
    const list = results.get(r.VoteID) ?? [];
    list.push(r);
    results.set(r.VoteID, list);
  });

  const personToMember = new Map(
    (await readRows(FILES.members)).map((m) => [m.PersonID, m.mk_individual_id]),
  );
  const memberships = await readRows(FILES.memberFactions, (r) => r.knesset === '25');

  let failed = false;
  for (const bill of linked) {
    let billFailed = false;
    const voteId = String(bill.voteSource!.voteId);
    const vote = votes.get(voteId);
    if (!vote) {
      console.error(`${bill.id}: vote ${voteId} not found in kns_plenumvote`);
      failed = true;
      continue;
    }
    const date = day(vote.VoteDateTime);
    const onDate = memberships.filter(
      (m) => m.start_date <= date && (!m.finish_date || m.finish_date >= date),
    );

    const tally: Record<string, FactionVote> = Object.fromEntries(
      data.seating.map((f) => [f, { for: 0, against: 0, abstain: 0, absent: 0 }]),
    );
    const factionOf = new Map<string, string>();
    const unmapped = new Map<string, number>();
    for (const m of onDate) {
      const faction = lookup.get(normaliseName(m.faction_name));
      if (!faction) {
        unmapped.set(m.faction_name, (unmapped.get(m.faction_name) ?? 0) + 1);
        continue;
      }
      factionOf.set(m.mk_individual_id, faction);
      tally[faction].absent++;
    }

    const unknownResults = new Map<string, number>();
    let unplaced = 0;
    for (const r of results.get(voteId) ?? []) {
      const stance = RESULT_STANCE[r.ResultDesc?.trim()];
      if (!stance) {
        unknownResults.set(r.ResultDesc, (unknownResults.get(r.ResultDesc) ?? 0) + 1);
        continue;
      }
      const faction = factionOf.get(personToMember.get(r.MkId) ?? '');
      if (!faction) {
        unplaced++;
        continue;
      }
      tally[faction][stance]++;
      tally[faction].absent--;
    }

    const seated = Object.values(tally).reduce((s, v) => s + v.for + v.against + v.abstain + v.absent, 0);
    console.log(`\n${bill.id}: vote ${voteId}, ${date}: ${vote.VoteTitle} — ${vote.VoteSubject}`);
    for (const f of data.seating) {
      const v = tally[f];
      console.log(`  ${f.padEnd(4)} for ${v.for}  against ${v.against}  abstain ${v.abstain}  absent ${v.absent}`);
    }
    console.log(`  members placed in a faction: ${seated}`);
    if (unknownResults.size) console.log(`  other result types (counted as absent): ${JSON.stringify(Object.fromEntries(unknownResults))}`);
    if (unmapped.size) {
      console.error(`  unmapped factions: ${JSON.stringify(Object.fromEntries(unmapped))}`);
      billFailed = true;
    }
    if (unplaced) {
      console.error(`  ${unplaced} votes from members with no faction on ${date}`);
      billFailed = true;
    }
    if (seated !== 120) {
      console.error(`  expected 120 members, found ${seated}`);
      billFailed = true;
    }
    if (billFailed) {
      failed = true;
      continue;
    }

    bill.votes = tally;
    bill.voteSource = { ...bill.voteSource!, provider: 'oknesset', importedAt: new Date().toISOString().slice(0, 10) };
    writeFileSync(join(BILL_DIR, `${bill.id}.json`), JSON.stringify(bill, null, 2) + '\n');
    console.log(`  written to src/data/bills/${bill.id}.json`);
  }
  if (failed) process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
const commands: Record<string, () => Promise<void>> = {
  coverage,
  search: () => search(args),
  factions: listFactions,
  import: importVotes,
};
if (!commands[command]) {
  console.error('Usage: tsx scripts/oknesset.ts coverage | search <text>... | factions | import');
  process.exit(2);
}
await commands[command]();
