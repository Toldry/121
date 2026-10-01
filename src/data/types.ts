export const LANGUAGES = ['he', 'ar', 'ru', 'en'] as const;
export type Lang = (typeof LANGUAGES)[number];

/** Languages in which the long-form reasoning has been reviewed. */
export const REASONING_LANGUAGES = ['he', 'en'] as const;
export type ReasoningLang = (typeof REASONING_LANGUAGES)[number];

export type Localized<T = string> = Record<Lang, T>;

export type FactionId = string;

export interface Faction {
  seats: number;
  name: Localized;
  /** The 2026 list this faction runs with, or null if it has no separate list. */
  list2026: Localized | null;
  /** Faction names as they appear in the Knesset's records, used by the oknesset.org importer. */
  knessetFactionNames?: string[];
  /** A group of unaffiliated members: shown in vote breakdowns, never matched against. */
  individual?: boolean;
  /** Wikidata search for the party's logo (scripts/fetch-logos.ts); `wikidataId` pins the item. */
  logoSearch?: string;
  wikidataId?: string;
}

export interface FactionData {
  /** Faction ids in hemicycle order, from one end of the chamber to the other. */
  seating: FactionId[];
  factions: Record<FactionId, Faction>;
}

/** A user's answer. "skip" means "I don't know enough" and carries no information. */
export type Stance = 'for' | 'against' | 'abstain';
export type Answer = Stance | 'skip';
export const STANCES: readonly Stance[] = ['for', 'against', 'abstain'];

/** Per-faction head count for one vote. Absent members are missing data, never abstentions. */
export interface FactionVote {
  for: number;
  against: number;
  abstain: number;
  absent: number;
}

export type SourceType = 'law' | 'cmte' | 'plen' | 'rsch' | 'legal' | 'data' | 'court' | 'ngo';

export interface Source {
  type: SourceType;
  title: Record<ReasoningLang, string>;
  url: string | null;
}

export interface BillText {
  title: string;
  short: string;
  stage: string;
  sponsor: string;
  summary: string;
  supporters: string;
  opponents: string;
  whyThisBill: string;
  voteNote?: string;
  whatHappenedNext?: string;
}

export type ReasoningHeading = 'bill' | 'supporters' | 'opponents' | 'method' | 'later';

export interface ReasoningSection {
  heading: ReasoningHeading;
  paragraphs: { text: string; cites: number[] }[];
  quote?: { text: string; attribution: string; placeholder?: boolean };
}

export interface VoteSource {
  provider: 'oknesset';
  voteId: number | null;
  /** Date of the last successful import (YYYY-MM-DD). */
  importedAt?: string;
}

/**
 * "illustrative": prototype text and tallies, not verified.
 * "verified": text hand-checked and tallies taken from the official Knesset record.
 */
export type BillStatus = 'illustrative' | 'verified';

export interface Bill {
  id: string;
  status: BillStatus;
  knesset: number;
  /** ISO date (YYYY-MM-DD or YYYY-MM), or null when unknown. */
  date: string | null;
  /** 1–10: how directly the bill touches deeply held convictions. Gates bill order. */
  salience: number;
  votes: Record<FactionId, FactionVote>;
  /** Where `votes` came from. `voteId` is a KNS_PlenumVote Id in the oknesset.org data. */
  voteSource?: VoteSource;
  /**
   * Factions that boycotted the vote as a declared protest. Their absent members
   * are counted as "against", and the UI marks this as an inference.
   */
  boycottCountedAsAgainst: FactionId[];
  sources: Source[];
  text: Localized<BillText>;
  reasoning: Record<ReasoningLang, ReasoningSection[]>;
}
