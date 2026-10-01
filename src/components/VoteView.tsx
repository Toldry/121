import { BILLS, BILLS_BY_ID, FACTIONS } from '../data';
import type { Answer, Lang } from '../data/types';
import { format, type Strings } from '../i18n';
import {
  answeredBills,
  factionMatches,
  matchConfidence,
  rankBills,
  type Answers,
} from '../lib/model';
import type { Settings } from '../lib/storage';
import { BillCard } from './BillCard';
import { FactionName } from './FactionName';
import { MatchBar, percentText } from './MatchBar';
import { Arrow, Reveal } from './Reveal';

interface VoteViewProps {
  t: Strings;
  lang: Lang;
  answers: Answers;
  currentId: string | null;
  revealed: boolean;
  settings: Settings;
  onAnswer: (answer: Answer) => void;
  onNext: () => void;
  onOpenReasoning: (billId: string) => void;
  onResults: () => void;
}

export function VoteView(props: VoteViewProps) {
  const { t, lang, answers, currentId, revealed, settings } = props;
  const bill = currentId ? BILLS_BY_ID[currentId] : null;
  const answer = bill ? answers[bill.id] : undefined;
  const showReveal = !!bill && revealed && !!answer && answer !== 'skip';
  const answeredCount = answeredBills(BILLS, answers).length;

  // Rank the current bill as it was when it was chosen, i.e. without its own answer.
  const answersBefore = { ...answers };
  if (bill) delete answersBefore[bill.id];
  const ranking = bill ? rankBills(FACTIONS, BILLS, answersBefore).find((r) => r.bill.id === bill.id) : undefined;

  const order = [
    ...Object.keys(answers).filter((id) => BILLS_BY_ID[id]),
    ...BILLS.map((b) => b.id).filter((id) => !answers[id]),
  ];
  const seenCount = Object.keys(answers).filter((id) => BILLS_BY_ID[id]).length;

  const matches = factionMatches(FACTIONS, BILLS, answers);
  const confidence = matchConfidence(matches, answeredCount);

  return (
    <div className="vote-layout">
      <section className="vote-main">
        <div className="progress">
          <span className="progress-text">{format(t.progress, { n: seenCount, t: BILLS.length })}</span>
          <div className="pips" aria-hidden="true">
            {order.map((id) => {
              const a = answers[id];
              const cls = a && a !== 'skip' ? a : id === currentId ? 'current' : '';
              return <span key={id} className={`pip ${cls}`} />;
            })}
          </div>
        </div>

        {bill ? (
          <BillCard
            key={bill.id}
            t={t}
            lang={lang}
            bill={bill}
            selected={showReveal ? answer : undefined}
            hideSponsor={settings.blindSponsor && !showReveal}
            ranking={ranking}
            showAlgorithm={settings.showAlgorithm}
            onAnswer={props.onAnswer}
            onOpenReasoning={() => props.onOpenReasoning(bill.id)}
          >
            {showReveal && (
              <Reveal
                t={t}
                lang={lang}
                bill={bill}
                you={answer}
                onNext={props.onNext}
                onResults={props.onResults}
              />
            )}
          </BillCard>
        ) : (
          <div className="card done">
            <h2 className="serif">{t.done}</h2>
            <p className="muted">{t.doneB}</p>
            <button className="btn-primary" onClick={props.onResults}>
              {t.seeMatches} <Arrow />
            </button>
          </div>
        )}
      </section>

      <aside className="vote-aside">
        <div className="card so-far">
          <div className="so-far-head">
            <h3 className="serif">{t.soFar}</h3>
            {answeredCount > 0 && <span className="eyebrow">{t.confidence[confidence]}</span>}
          </div>
          {answeredCount === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              {t.soFarEmpty}
            </p>
          ) : (
            <>
              {matches.slice(0, 5).map((m) => (
                <div key={m.faction} className="so-far-row">
                  <div className="label">
                    <FactionName id={m.faction} lang={lang} />
                    <span className="mono">{percentText(m)}</span>
                  </div>
                  <MatchBar match={m} />
                </div>
              ))}
              <button className="link-button" style={{ alignSelf: 'flex-start' }} onClick={props.onResults}>
                {t.seeMatches} <Arrow />
              </button>
            </>
          )}
        </div>
        <p className="privacy-note">{t.privacy}</p>
        {settings.showAlgorithm && (
          <div className="dashed-box queue">
            <div className="eyebrow">{t.queueT}</div>
            {rankBills(FACTIONS, BILLS, answers).map((r, i) => (
              <div key={r.bill.id} className={`queue-row${i === 0 ? ' top' : ''}`}>
                <span className="name">{r.bill.text[lang].short}</span>
                <span className="mono">{r.score.toFixed(2)}</span>
                <span className="detail">
                  {format(t.algo, {
                    ig: r.gain.toFixed(2),
                    s: r.bill.salience,
                    o: Math.round(r.overlap * 100),
                  })}
                </span>
              </div>
            ))}
            <p className="muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
              {t.queueNote}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
