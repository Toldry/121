/**
 * Downloads each party's logo from Wikimedia Commons, via the party's
 * Wikidata item (property P154, "logo image"). Commons only hosts freely
 * licensed or public-domain files; the license and author of each logo are
 * recorded in src/data/logos.json, next to the downloaded file.
 *
 *   npx tsx scripts/fetch-logos.ts
 *
 * The item is found by searching Wikidata for `logoSearch` and taking the
 * first result that is an Israeli party (P17 = Israel) with a logo. Set
 * `wikidataId` in factions.json to pin a specific item instead.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FactionData } from '../src/data/types';

const ROOT = join(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, 'public/logos');
const CREDITS_PATH = join(ROOT, 'src/data/logos.json');
const ISRAEL = 'Q801';
const HEADERS = { 'User-Agent': '121-knesset-app/0.1 (https://github.com/Toldry/121)' };

type Claims = Record<string, { mainsnak: { datavalue?: { value: unknown } } }[]>;
interface Entity {
  id: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Claims;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

const claimValues = (entity: Entity, property: string) =>
  (entity.claims?.[property] ?? []).map((c) => c.mainsnak.datavalue?.value);

async function entities(ids: string[]): Promise<Entity[]> {
  if (!ids.length) return [];
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels|descriptions|claims&languages=en|he&ids=${ids.join('|')}`;
  const data = await getJson<{ entities: Record<string, Entity> }>(url);
  return ids.map((id) => data.entities[id]).filter(Boolean);
}

async function findParty(search: string): Promise<Entity | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=10&search=${encodeURIComponent(search)}`;
  const hits = await getJson<{ search: { id: string }[] }>(url);
  const candidates = await entities(hits.search.map((h) => h.id));
  return (
    candidates.find((e) => {
      const countries = claimValues(e, 'P17').map((v) => (v as { id: string } | undefined)?.id);
      return countries.includes(ISRAEL) && claimValues(e, 'P154').length > 0;
    }) ?? null
  );
}

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function license(file: string) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata&titles=${encodeURIComponent(`File:${file}`)}`;
  const data = await getJson<{
    query: { pages: Record<string, { imageinfo?: { extmetadata: Record<string, { value: string }> }[] }> };
  }>(url);
  const meta = Object.values(data.query.pages)[0]?.imageinfo?.[0]?.extmetadata ?? {};
  return {
    license: stripHtml(meta.LicenseShortName?.value) || 'unknown',
    artist: stripHtml(meta.Artist?.value) || 'unknown',
  };
}

const factions = JSON.parse(readFileSync(join(ROOT, 'src/data/factions.json'), 'utf8')) as FactionData;
const credits: Record<string, { file: string; source: string; license: string; artist: string }> = {};
mkdirSync(OUT_DIR, { recursive: true });

for (const id of factions.seating) {
  const faction = factions.factions[id];
  if (faction.individual) continue;
  const entity = faction.wikidataId
    ? (await entities([faction.wikidataId]))[0]
    : faction.logoSearch
      ? await findParty(faction.logoSearch)
      : null;
  const commonsFile = entity ? (claimValues(entity, 'P154')[0] as string | undefined) : undefined;
  if (!entity || !commonsFile) {
    console.log(`${id}: no logo found (search: ${faction.logoSearch ?? '-'})`);
    continue;
  }
  const label = entity.labels?.he?.value ?? entity.labels?.en?.value;
  const description = entity.descriptions?.en?.value ?? '';
  // Commons renders a PNG thumbnail of any format, SVG included.
  const res = await fetch(
    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commonsFile)}?width=96`,
    { headers: HEADERS },
  );
  if (!res.ok) {
    console.log(`${id}: download failed, HTTP ${res.status}`);
    continue;
  }
  const file = `${id}.png`;
  writeFileSync(join(OUT_DIR, file), Buffer.from(await res.arrayBuffer()));
  const credit = await license(commonsFile);
  credits[id] = {
    file,
    source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(commonsFile.replaceAll(' ', '_'))}`,
    ...credit,
  };
  console.log(`${id}: ${entity.id} "${label}" (${description}) -> ${commonsFile} [${credit.license}]`);
}

writeFileSync(CREDITS_PATH, JSON.stringify(credits, null, 2) + '\n');
console.log(`\n${Object.keys(credits).length} logos written to public/logos/`);
