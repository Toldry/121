import type { Lang } from '../data/types';
import type { Answers } from './model';

/** Everything the app remembers lives on the user's device, under this key. */
const STORAGE_KEY = 'kn121.v1';

export interface Settings {
  /** Show how the Knesset voted after each answer, or only on the results page. */
  revealMode: 'each' | 'end';
  /** Hide the sponsor until the user votes, so party labels don't anchor the answer. */
  blindSponsor: boolean;
  /** Show the ordering algorithm's numbers. */
  showAlgorithm: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  revealMode: 'each',
  blindSponsor: true,
  showAlgorithm: false,
};

export interface Saved {
  votes: Answers;
  lang: Lang | null;
  settings: Settings;
}

export function load(): Saved {
  let raw: Partial<Saved> = {};
  try {
    raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch {
    // Storage can be unavailable (private mode, blocked site data); start empty.
  }
  return {
    votes: raw.votes ?? {},
    lang: raw.lang ?? null,
    settings: { ...DEFAULT_SETTINGS, ...raw.settings },
  };
}

export function save(saved: Saved): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Nothing to do: the app still works for this session.
  }
}
