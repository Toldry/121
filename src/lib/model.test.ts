import { describe, expect, it } from 'vitest';
import type { Bill, FactionData, FactionVote } from '../data/types';
import {
  bestSeparator,
  entropyBits,
  expectedInformationGain,
  factionMatches,
  factionStances,
  matchConfidence,
  posterior,
  rankBills,
} from './model';

const DATA: FactionData = {
  seating: ['left', 'centre', 'right'],
  factions: {
    left: { seats: 10, name: { he: 'L', ar: 'L', ru: 'L', en: 'L' }, list2026: null },
    centre: { seats: 10, name: { he: 'C', ar: 'C', ru: 'C', en: 'C' }, list2026: null },
    right: { seats: 10, name: { he: 'R', ar: 'R', ru: 'R', en: 'R' }, list2026: null },
  },
};

const vote = (forN: number, against: number, abstain = 0, absent = 0): FactionVote => ({
  for: forN,
  against,
  abstain,
  absent,
});

function bill(id: string, votes: Bill['votes'], extra: Partial<Bill> = {}): Bill {
  return {
    id,
    status: 'illustrative',
    knesset: 25,
    date: null,
    salience: 10,
    votes,
    boycottCountedAsAgainst: [],
    sources: [],
    text: {} as Bill['text'],
    reasoning: {} as Bill['reasoning'],
    ...extra,
  };
}

// Splits left from the rest.
const LEFT_VS_REST = bill('a', { left: vote(0, 10), centre: vote(10, 0), right: vote(10, 0) });
// Same split again.
const LEFT_VS_REST_AGAIN = bill('b', { left: vote(0, 10), centre: vote(10, 0), right: vote(10, 0) });
// Splits right from the rest.
const RIGHT_VS_REST = bill('c', { left: vote(10, 0), centre: vote(10, 0), right: vote(0, 10) });
// Everyone agrees: tells us nothing.
const CONSENSUS = bill('d', { left: vote(10, 0), centre: vote(10, 0), right: vote(10, 0) });

const BILLS = [LEFT_VS_REST, LEFT_VS_REST_AGAIN, RIGHT_VS_REST, CONSENSUS];

describe('factionStances', () => {
  it('drops absent members instead of counting them as abstaining', () => {
    const b = bill('x', { left: vote(3, 1, 0, 6), centre: vote(0, 0), right: vote(0, 0) });
    expect(factionStances(b, 'left')).toMatchObject({ for: 0.75, against: 0.25, abstain: 0 });
  });

  it('counts a declared boycott as against, and marks it inferred', () => {
    const b = bill(
      'x',
      { left: vote(0, 0, 0, 10), centre: vote(0, 0), right: vote(0, 0) },
      { boycottCountedAsAgainst: ['left'] },
    );
    expect(factionStances(b, 'left')).toMatchObject({ against: 1, inferred: true });
  });

  it('returns null when nobody in the faction voted', () => {
    const b = bill('x', { left: vote(0, 0, 0, 10), centre: vote(0, 0), right: vote(0, 0) });
    expect(factionStances(b, 'left')).toBeNull();
  });
});

describe('posterior', () => {
  it('starts uniform and ignores skipped bills', () => {
    const p = posterior(DATA, BILLS, { a: 'skip' });
    p.forEach((x) => expect(x).toBeCloseTo(1 / 3));
  });

  it('moves toward the faction the user voted with', () => {
    const p = posterior(DATA, BILLS, { a: 'against' });
    expect(p[0]).toBeGreaterThan(0.8);
  });
});

describe('information gain', () => {
  it('is zero for a bill everyone voted the same way on', () => {
    expect(expectedInformationGain(DATA, CONSENSUS, [1 / 3, 1 / 3, 1 / 3])).toBeCloseTo(0, 5);
  });

  it('never exceeds the current entropy', () => {
    const prior = [1 / 3, 1 / 3, 1 / 3];
    expect(expectedInformationGain(DATA, LEFT_VS_REST, prior)).toBeLessThanOrEqual(entropyBits(prior));
  });

  it('prefers a new split over repeating one already answered', () => {
    const ranked = rankBills(DATA, BILLS, { a: 'for' });
    expect(ranked[0].bill.id).toBe('c');
    const repeat = ranked.find((r) => r.bill.id === 'b')!;
    expect(repeat.overlap).toBeCloseTo(1);
    expect(ranked.at(-1)!.bill.id).toBe('d');
  });

  it('weights gain by salience', () => {
    const dull = { ...RIGHT_VS_REST, id: 'dull', salience: 1 };
    const ranked = rankBills(DATA, [LEFT_VS_REST, dull], {});
    expect(ranked[0].bill.id).toBe('a');
  });
});

describe('factionMatches', () => {
  it('ranks the faction that voted like the user first, with a range around it', () => {
    const matches = factionMatches(DATA, BILLS, { a: 'against', c: 'for' });
    expect(matches[0].faction).toBe('left');
    expect(matches[0].low).toBeLessThan(matches[0].mean);
    expect(matches[0].high).toBeGreaterThan(matches[0].mean);
  });

  it('gives abstaining half credit against a for/against vote', () => {
    const [left] = factionMatches(DATA, [LEFT_VS_REST], { a: 'abstain' }).filter((m) => m.faction === 'left');
    // Beta(1 + 0.5, 1 + 0.5) has mean 0.5.
    expect(left.mean).toBeCloseTo(0.5);
  });

  it('reports low confidence with fewer than three answers', () => {
    const matches = factionMatches(DATA, BILLS, { a: 'against' });
    expect(matchConfidence(matches, 1)).toBe(0);
  });
});

describe('bestSeparator', () => {
  it('finds the remaining bill that splits two factions', () => {
    expect(bestSeparator(BILLS, { a: 'for' }, 'centre', 'right')?.id).toBe('c');
  });

  it('returns null when no remaining bill separates them', () => {
    expect(bestSeparator(BILLS, { c: 'for' }, 'centre', 'right')).toBeNull();
  });
});
