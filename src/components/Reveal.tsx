import { FACTIONS } from '../data';
import type { Bill, Lang, Stance } from '../data/types';
import { format, type Strings } from '../i18n';
import { factionStances, majorityStance } from '../lib/model';
import { FactionList, FactionName } from './FactionName';
import { Hemicycle } from './Hemicycle';

interface RevealProps {
  t: Strings;
  lang: Lang;
  bill: Bill;
  you: Stance;
  onNext: () => void;
  onResults: () => void;
}

/** After a vote: how the Knesset voted, faction by faction, next to the user's answer. */
export function Reveal({ t, lang, bill, you, onNext, onResults }: RevealProps) {
  const text = bill.text[lang];
  const totals = { for: 0, against: 0, abstain: 0, absent: 0, inferred: 0 };

  const rows = FACTIONS.seating
    .map((id) => {
      const v = bill.votes[id];
      const inferred = bill.boycottCountedAsAgainst.includes(id);
      const seats = v.for + v.against + v.abstain + v.absent;
      totals.for += v.for;
      totals.against += v.against;
      totals.abstain += v.abstain;
      if (inferred) totals.inferred += v.absent;
      else totals.absent += v.absent;
      const majority = majorityStance(factionStances(bill, id));
      const pct = (n: number) => `${((n / seats) * 100).toFixed(1)}%`;
      return {
        id,
        seats,
        inferred,
        sided: majority === you,
        widths: {
          for: pct(v.for),
          against: pct(v.against + (inferred ? v.absent : 0)),
          abstain: pct(v.abstain),
        },
        counts: inferred ? '—' : `${v.for}–${v.against}${v.abstain ? ` · ${v.abstain}` : ''}`,
      };
    })
    .filter((row) => row.seats > 0)
    .sort((a, b) => b.seats - a.seats);

  const sidedIds = rows
    .filter((r) => r.sided && !FACTIONS.factions[r.id].individual)
    .map((r) => r.id);
  const notVoting = totals.absent + totals.inferred;

  const legend = [
    { key: 'for', label: t.lgFor, n: totals.for, fill: 'var(--for)', ring: 'var(--for)' },
    { key: 'against', label: t.lgAgainst, n: totals.against, fill: 'var(--against)', ring: 'var(--against)' },
    { key: 'abstain', label: t.lgAbstain, n: totals.abstain, fill: 'var(--abstain)', ring: 'var(--abstain)' },
    { key: 'absent', label: t.lgAbsent, n: totals.absent, fill: 'transparent', ring: 'var(--rule-strong)' },
    {
      key: 'inferred',
      label: t.lgInferred,
      n: totals.inferred,
      fill: 'transparent',
      ring: 'var(--against)',
      dashed: true,
    },
  ].filter((item) => item.n > 0);

  return (
    <section className="reveal" aria-live="polite">
      <div className="button-row">
        <button className="btn-primary" onClick={onNext}>
          {t.next} <Arrow />
        </button>
        <button className="btn-secondary" onClick={onResults}>
          {t.seeMatches}
        </button>
      </div>
      <div className="reveal-head">
        <h2 className="serif">{t.howVoted}</h2>
        <span className="you-chip">
          {t.you}
          <span className={`stance-pill ${you}`}>{t[you]}</span>
        </span>
      </div>
      <Hemicycle data={FACTIONS} bill={bill} you={you} youLabel={t.you} label={t.howVoted} />
      <ul className="legend">
        {legend.map((item) => (
          <li key={item.key}>
            <span
              className="legend-dot"
              style={{
                background: item.fill,
                borderColor: item.ring,
                borderStyle: item.dashed ? 'dashed' : 'solid',
              }}
            />
            {item.label}
            <span className="legend-count">{item.n}</span>
          </li>
        ))}
      </ul>
      <div className="reveal-notes">
        {text.voteNote && <p className="note dashed-box">{text.voteNote}</p>}
        {notVoting > 0 && <p>{format(t.absentNote, { x: notVoting })}</p>}
        {text.whatHappenedNext && <p className="later">{text.whatHappenedNext}</p>}
      </div>
      <div className="faction-rows">
        {rows.map((row) => (
          <div key={row.id} className={`faction-row${row.sided ? ' sided' : ''}`}>
            <span className="faction-name">
              <FactionName id={row.id} lang={lang} />
            </span>
            <div className="stack-bar" aria-hidden="true">
              <span className="for" style={{ width: row.widths.for }} />
              <span className={`against${row.inferred ? ' inferred' : ''}`} style={{ width: row.widths.against }} />
              <span className="abstain" style={{ width: row.widths.abstain }} />
            </div>
            <span className="faction-counts">{row.counts}</span>
          </div>
        ))}
      </div>
      <p className="sided-line">
        <span className="muted">{t.sided}:</span>{' '}
        <strong>{sidedIds.length ? <FactionList ids={sidedIds} lang={lang} /> : t.sidedNone}</strong>
      </p>
    </section>
  );
}

/** A forward arrow that points the reading direction. */
export function Arrow({ back = false }: { back?: boolean }) {
  return (
    <span aria-hidden="true" className="arrow">
      {back ? '←' : '→'}
    </span>
  );
}
