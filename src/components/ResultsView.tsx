import { BILLS, BILLS_BY_ID, FACTIONS } from '../data';
import type { Lang } from '../data/types';
import { format, type Strings } from '../i18n';
import {
  answeredBills,
  bestSeparator,
  factionMatches,
  factionStances,
  majorityStance,
  matchableFactions,
  type Answers,
} from '../lib/model';
import { FactionList, FactionName, formatNodes } from './FactionName';
import { MatchBar, percentText } from './MatchBar';
import { Arrow } from './Reveal';

/** Member-level matching unlocks after this many answered bills. */
const MEMBER_UNLOCK = 15;

interface ResultsViewProps {
  t: Strings;
  lang: Lang;
  answers: Answers;
  onKeepVoting: () => void;
  onGoToBill: (billId: string) => void;
  onClear: () => void;
}

export function ResultsView({ t, lang, answers, onKeepVoting, onGoToBill, onClear }: ResultsViewProps) {
  const answeredCount = answeredBills(BILLS, answers).length;
  const matches = factionMatches(FACTIONS, BILLS, answers);

  const withRecord = matches.filter((m) => m.n > 0);
  const [first, second] = withRecord;
  const separator =
    answeredCount > 0 && first && second ? bestSeparator(BILLS, answers, first.faction, second.faction) : null;

  const myVotes = Object.keys(answers)
    .filter((id) => BILLS_BY_ID[id])
    .map((id) => {
      const bill = BILLS_BY_ID[id];
      const answer = answers[id];
      const sided =
        answer === 'skip'
          ? []
          : matchableFactions(FACTIONS)
              .filter((f) => majorityStance(factionStances(bill, f)) === answer);
      return { id, bill, answer, sided };
    });

  return (
    <div className="results">
      <div className="results-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 className="serif">{t.results}</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            {format(t.basedOn, { n: answeredCount })}
          </span>
        </div>
        <button className="btn-primary" onClick={onKeepVoting}>
          {t.keepVoting} <Arrow />
        </button>
      </div>
      <p className="card historic">{t.historic}</p>

      <div className="results-layout">
        <section className="card match-list">
          {matches.map((m, i) => {
            const list = FACTIONS.factions[m.faction].list2026;
            return (
              <div key={m.faction} className="match-row">
                <span className="rank">{i + 1}</span>
                <div className="body">
                  <div className="names">
                    <span className="name">
                      <FactionName id={m.faction} lang={lang} />
                    </span>
                    <span className="list2026">{list ? format(t.runs, { x: list[lang] }) : t.notRunning}</span>
                  </div>
                  <MatchBar match={m} />
                </div>
                <span className="pct">{percentText(m)}</span>
              </div>
            );
          })}
          <p className="new-lists">{t.newLists}</p>
        </section>

        <aside className="results-aside">
          {first && second && answeredCount > 0 && (
            <div className="separator">
              <h3 className="serif">
                {formatNodes(t.sepT, {
                  a: <FactionName id={first.faction} lang={lang} />,
                  b: <FactionName id={second.faction} lang={lang} />,
                })}
              </h3>
              {separator ? (
                <>
                  <p>{separator.text[lang].title}</p>
                  <button onClick={() => onGoToBill(separator.id)}>
                    {t.sepGo} <Arrow />
                  </button>
                </>
              ) : (
                <p className="none">{t.sepNone}</p>
              )}
            </div>
          )}

          {myVotes.length > 0 && (
            <div className="card my-votes">
              <h3 className="serif">{t.yourVotes}</h3>
              {myVotes.map((v) => (
                <div key={v.id} className="my-vote">
                  <div className="top">
                    <span className="title">{v.bill.text[lang].short}</span>
                    <span className={`answer ${v.answer}`}>{v.answer === 'skip' ? t.skipped : t[v.answer]}</span>
                  </div>
                  {v.answer !== 'skip' && (
                    <span className="sided">
                      {v.sided.length ? (
                        <>
                          {t.sided}: <FactionList ids={v.sided} lang={lang} />
                        </>
                      ) : (
                        t.sidedNone
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="dashed-box members">
            <h3 className="serif">{t.membersT}</h3>
            <p>{format(t.membersB, { k: MEMBER_UNLOCK, n: answeredCount })}</p>
            <div className="bar" aria-hidden="true">
              <div style={{ width: `${Math.min(100, (answeredCount / MEMBER_UNLOCK) * 100)}%` }} />
            </div>
          </div>

          <div className="privacy-row">
            <span>{t.privacy}</span>
            <button className="clear-btn" onClick={onClear}>
              {t.clear}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
