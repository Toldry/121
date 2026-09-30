# 121

**The 121st seat.** Vote on real bills from the Israeli Knesset and see which
parties voted the way you would have.

The Knesset has 120 seats; you take the 121st. Each card shows a bill, what it
does, and the main arguments for and against it. You vote For, Against or
Abstain, or skip if you don't know enough. The app then shows how every faction
actually voted, and over time which parties' records match yours best.

Hebrew, Arabic, Russian and English. No account; votes stay on your device.

> **Status: prototype.** The four bills in `src/data/bills/` are illustrative
> drafts. Per-faction counts, quotes and sources are placeholders; only the
> 64–0 reasonableness result and the headline tallies are real. The banner at
> the top of the app says so.

## Running it

Requires Node 22+.

```sh
npm install
npm run dev        # dev server at http://localhost:5173
npm test           # unit tests for the matching model
npm run validate   # checks bill data (also runs as part of build)
npm run build      # static site in dist/
```

These commands are the same in PowerShell.

The build is a static site with relative paths, so `dist/` can be hosted
anywhere (GitHub Pages, Netlify, Cloudflare Pages, a plain web server).

## How it works

```
      answer a bill                 update belief               pick next bill
  ┌──────────────────┐        ┌───────────────────────┐      ┌──────────────────────┐
  │ For / Against /  │ ─────▶ │ posterior over the 12 │ ───▶ │ max expected info    │
  │ Abstain / Skip   │        │ factions (Bayes)      │      │ gain × salience / 10 │
  └──────────────────┘        └───────────────────────┘      └──────────────────────┘
```

All of this lives in [`src/lib/model.ts`](src/lib/model.ts):

- **Faction stance.** A faction's vote on a bill becomes a distribution over
  For / Against / Abstain. Absent members are dropped: absence is missing
  data, never abstention. A declared boycott (the opposition walkout on the
  reasonableness vote) is counted as Against and marked as an inference.
- **Posterior.** Each faction is a hypothesis for "who you vote like". Your
  answers update a uniform prior, with 10% noise so a single disagreement
  can't eliminate a faction.
- **Next bill.** The unanswered bill with the highest expected reduction in
  posterior entropy, weighted by the bill's *salience* (1–10: how directly it
  touches deeply held convictions), so engaging bills come before technical
  ones. Two bills with the same split carry almost no new information after
  the first is answered, so repeats sink on their own.
- **Match score.** Agreement with each faction as a Beta posterior
  (abstaining is half-way between For and Against), shown with a 90% range
  rather than a flat percentage.
- **Separator.** On the results page, the remaining bill on which your top two
  factions disagreed most.

Skipping never counts toward a match.

## Adding a bill

Each bill is one JSON file in `src/data/bills/`, named `<id>.json`. See
[`src/data/types.ts`](src/data/types.ts) for the full schema. In short:

| Field | Meaning |
| --- | --- |
| `status` | `illustrative` (draft) or `verified` (hand-checked, official tallies) |
| `date` | `YYYY-MM-DD`, `YYYY-MM`, or `null` |
| `salience` | 1–10; gates how early the bill is shown |
| `votes` | per faction: `for`, `against`, `abstain`, `absent`; must add up to its seats |
| `boycottCountedAsAgainst` | factions whose absence was a declared protest |
| `text.{he,ar,ru,en}` | title, short title, stage, sponsor, summary, supporters' and opponents' arguments, "why this bill" |
| `reasoning.{he,en}` | long-form sections with numbered citations into `sources` |
| `sources` | type, title in Hebrew and English, and `url` (required once verified) |

`npm run validate` checks all of this: seat totals, missing translations,
citations pointing at sources that don't exist, and more.

Factions and their 2026 lists are in `src/data/factions.json`. UI text is in
`src/i18n/<lang>.json`. The long-form reasoning is published in Hebrew and
English only; Arabic and Russian show English with a notice until native
speakers have reviewed a translation.

## Data sources

- **Votes:** the Knesset's official OData API
  (`https://knesset.gov.il/OdataV4/ParliamentInfo/`), which has per-member
  vote tables. Hasadna's Open Knesset data is several years out of date for
  votes.
- **Protocols and history:** Hasadna's [knesset-data-pipelines](https://github.com/hasadna/knesset-data-pipelines)
  and committee and plenum protocols, used to draft the summaries and the
  sourced reasoning.

## Limits

- It compares you with how **25th-Knesset factions voted**. That is a record
  of the past, not a prediction of any 2026 list. Lists made mostly of new
  candidates can't be matched, and the app says so.
- Coalition discipline shapes most votes, so a vote is a proxy for a belief,
  not the belief itself.

## Roadmap

1. Replace the 4 illustrative bills with ~40 hand-checked ones and official
   vote records.
2. A script that pulls vote tallies from the Knesset API into `votes`.
3. Individual-member matching (unlocks after 15 votes).
4. Reader corrections: highlight a passage and dispute it, with a required
   source and a public correction log.
5. Native-speaker review of the Arabic and Russian texts.

The original Claude Design prototype is kept in [`prototype/`](prototype/) for
reference.
