/**
 * Matching and bill-ordering model.
 *
 * Each faction is treated as a hypothesis about "who the user votes like".
 * A faction's vote on a bill gives a distribution over For/Against/Abstain
 * (absent members are dropped, not counted as abstaining). The user's answers
 * update a posterior over factions, and the next bill is the one with the
 * highest expected information gain about that posterior, weighted by salience.
 */
import {
  STANCES,
  type Answer,
  type Bill,
  type FactionData,
  type FactionId,
  type Stance,
} from '../data/types';

export type Answers = Record<string, Answer>;
export type StanceDistribution = Record<Stance, number> & { inferred: boolean };

/** Probability that a user who "is" this faction answers off-script. */
const NOISE = 0.1;
/** z for a two-sided 90% interval. */
const Z90 = 1.645;

export function factionStances(bill: Bill, faction: FactionId): StanceDistribution | null {
  const counts = bill.votes[faction];
  if (!counts) return null;
  const inferred = bill.boycottCountedAsAgainst.includes(faction);
  const against = counts.against + (inferred ? counts.absent : 0);
  const total = counts.for + against + counts.abstain;
  if (!total) return null;
  return {
    for: counts.for / total,
    against: against / total,
    abstain: counts.abstain / total,
    inferred,
  };
}

export function majorityStance(dist: StanceDistribution | null): Stance | null {
  if (!dist) return null;
  return STANCES.reduce((best, s) => (dist[s] > dist[best] ? s : best), 'for' as Stance);
}

function likelihood(bill: Bill, faction: FactionId, stance: Stance): number {
  const dist = factionStances(bill, faction);
  return dist ? (1 - NOISE) * dist[stance] + NOISE / STANCES.length : 1 / STANCES.length;
}

export function answeredBills(bills: Bill[], answers: Answers): Bill[] {
  return bills.filter((b) => answers[b.id] && answers[b.id] !== 'skip');
}

/** Posterior over factions (in seating order), from a uniform prior. */
export function posterior(data: FactionData, bills: Bill[], answers: Answers): number[] {
  const answered = answeredBills(bills, answers);
  const weights = data.seating.map((f) =>
    answered.reduce((acc, b) => acc * likelihood(b, f, answers[b.id] as Stance), 1),
  );
  const sum = weights.reduce((a, w) => a + w, 0);
  return weights.map((w) => w / sum);
}

export function entropyBits(p: number[]): number {
  return -p.reduce((acc, x) => acc + (x > 0 ? x * Math.log2(x) : 0), 0);
}

/** Expected reduction in posterior entropy (bits) from the user answering this bill. */
export function expectedInformationGain(
  data: FactionData,
  bill: Bill,
  prior: number[],
): number {
  const before = entropyBits(prior);
  let expectedAfter = 0;
  for (const stance of STANCES) {
    const joint = data.seating.map((f, i) => prior[i] * likelihood(bill, f, stance));
    const pStance = joint.reduce((a, x) => a + x, 0);
    if (pStance > 0) expectedAfter += pStance * entropyBits(joint.map((x) => x / pStance));
  }
  return Math.max(0, before - expectedAfter);
}

/** Per-faction lean (for − against), used to spot bills that repeat an earlier split. */
function leanVector(data: FactionData, bill: Bill): (number | null)[] {
  return data.seating.map((f) => {
    const dist = factionStances(bill, f);
    return dist ? dist.for - dist.against : null;
  });
}

/** Highest similarity (0–1) between this bill's split and any bill already answered. */
export function overlapWithAnswered(
  data: FactionData,
  bills: Bill[],
  bill: Bill,
  answers: Answers,
): number {
  const lean = leanVector(data, bill);
  let best = 0;
  for (const other of answeredBills(bills, answers)) {
    if (other.id === bill.id) continue;
    const otherLean = leanVector(data, other);
    let sum = 0;
    let n = 0;
    lean.forEach((x, i) => {
      const y = otherLean[i];
      if (x != null && y != null) {
        sum += 1 - Math.abs(x - y) / 2;
        n++;
      }
    });
    if (n) best = Math.max(best, sum / n);
  }
  return best;
}

export interface RankedBill {
  bill: Bill;
  gain: number;
  overlap: number;
  score: number;
}

/** Unanswered, unskipped bills, best next question first. */
export function rankBills(data: FactionData, bills: Bill[], answers: Answers): RankedBill[] {
  const prior = posterior(data, bills, answers);
  return bills
    .filter((b) => !answers[b.id])
    .map((bill) => {
      const gain = expectedInformationGain(data, bill, prior);
      return {
        bill,
        gain,
        overlap: overlapWithAnswered(data, bills, bill, answers),
        score: (gain * bill.salience) / 10,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** Agreement credit between two stances: abstaining is half-way between the others. */
function agreement(a: Stance, b: Stance): number {
  if (a === b) return 1;
  return a === 'abstain' || b === 'abstain' ? 0.5 : 0;
}

export interface FactionMatch {
  faction: FactionId;
  /** Number of answered bills where this faction has a record. */
  n: number;
  mean: number;
  low: number;
  high: number;
  seats: number;
}

/**
 * Agreement with each faction, as a Beta(1 + agree, 1 + disagree) posterior,
 * with a 90% range. Factions with no overlapping record sort last.
 */
export function factionMatches(data: FactionData, bills: Bill[], answers: Answers): FactionMatch[] {
  const answered = answeredBills(bills, answers);
  return data.seating
    .map((faction) => {
      let agree = 0;
      let n = 0;
      for (const bill of answered) {
        const dist = factionStances(bill, faction);
        if (!dist) continue;
        const mine = answers[bill.id] as Stance;
        agree += STANCES.reduce((acc, s) => acc + dist[s] * agreement(mine, s), 0);
        n++;
      }
      const alpha = 1 + agree;
      const beta = 1 + n - agree;
      const mean = alpha / (alpha + beta);
      const sd = Math.sqrt((alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1)));
      return {
        faction,
        n,
        mean,
        low: Math.max(0, mean - Z90 * sd),
        high: Math.min(1, mean + Z90 * sd),
        seats: data.factions[faction].seats,
      };
    })
    .sort(
      (a, b) =>
        Number(b.n > 0) - Number(a.n > 0) || b.mean - a.mean || b.seats - a.seats,
    );
}

export type Confidence = 0 | 1 | 2;

/** 0 = low, 1 = medium, 2 = high (the top match's range clears the runner-up's mean). */
export function matchConfidence(matches: FactionMatch[], answeredCount: number): Confidence {
  if (answeredCount < 3 || matches.length < 2) return 0;
  return matches[0].low > matches[1].mean ? 2 : 1;
}

/**
 * The unanswered bill on which two factions disagreed most (total variation
 * distance above 0.5), or null if no remaining bill separates them.
 */
export function bestSeparator(
  bills: Bill[],
  answers: Answers,
  a: FactionId,
  b: FactionId,
): Bill | null {
  let best: { bill: Bill; distance: number } | null = null;
  for (const bill of bills) {
    if (answers[bill.id]) continue;
    const da = factionStances(bill, a);
    const db = factionStances(bill, b);
    if (!da || !db) continue;
    const distance = STANCES.reduce((acc, s) => acc + Math.abs(da[s] - db[s]), 0) / 2;
    if (distance > 0.5 && (!best || distance > best.distance)) best = { bill, distance };
  }
  return best?.bill ?? null;
}
