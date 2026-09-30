import { useState } from 'react';
import type { Answer, Bill, Lang } from '../data/types';
import { format, formatDate, type Strings } from '../i18n';
import type { RankedBill } from '../lib/model';
import { Arrow } from './Reveal';

interface BillCardProps {
  t: Strings;
  lang: Lang;
  bill: Bill;
  deciding: boolean;
  hideSponsor: boolean;
  ranking: RankedBill | undefined;
  showAlgorithm: boolean;
  onAnswer: (answer: Answer) => void;
  onOpenReasoning: () => void;
  children?: React.ReactNode;
}

export function BillCard(props: BillCardProps) {
  const { t, lang, bill, deciding, hideSponsor, ranking, showAlgorithm } = props;
  const [whyOpen, setWhyOpen] = useState(false);
  const text = bill.text[lang];

  return (
    <article className="card bill" aria-labelledby={`bill-${bill.id}`}>
      <div className="bill-head">
        <div className="bill-meta">
          <span>{t.knesset}</span>
          <span>{text.stage}</span>
          {bill.date && <span>{formatDate(lang, bill.date)}</span>}
        </div>
        <h1 id={`bill-${bill.id}`} className="bill-title">
          {text.title}
        </h1>
        <div className="bill-tags">
          <span className={`sponsor${hideSponsor ? ' hidden' : ''}`}>
            {hideSponsor ? t.sponsorHidden : text.sponsor}
          </span>
          <button
            className="why-toggle"
            aria-expanded={whyOpen}
            aria-controls={`why-${bill.id}`}
            onClick={() => setWhyOpen((open) => !open)}
          >
            {t.why}
          </button>
        </div>
        {whyOpen && (
          <div id={`why-${bill.id}`} className="why-panel">
            <span>{text.whyThisBill}</span>
            {showAlgorithm && ranking && (
              <span className="algo-line">
                {format(t.algo, {
                  ig: ranking.gain.toFixed(2),
                  s: bill.salience,
                  o: Math.round(ranking.overlap * 100),
                })}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bill-section">
        <div className="eyebrow">{t.says}</div>
        <p className="bill-summary">{text.summary}</p>
      </div>

      <div className="arguments">
        <div className="bill-section argument pro">
          <div className="eyebrow">{t.pro}</div>
          <p>{text.supporters}</p>
        </div>
        <div className="bill-section argument con">
          <div className="eyebrow">{t.con}</div>
          <p>{text.opponents}</p>
        </div>
      </div>

      <div className="bill-foot">
        <span className="provenance">
          <span className="ai-badge">AI</span>
          {format(t.ai, { s: bill.sources.length })}
        </span>
        <button className="link-button" onClick={props.onOpenReasoning}>
          {t.readMore} <Arrow />
        </button>
      </div>

      {deciding && (
        <div className="vote-buttons">
          <div className="vote-grid">
            <button className="vote-btn for" onClick={() => props.onAnswer('for')}>
              {t.for}
            </button>
            <button className="vote-btn against" onClick={() => props.onAnswer('against')}>
              {t.against}
            </button>
            <button className="vote-btn abstain" onClick={() => props.onAnswer('abstain')}>
              {t.abstain}
            </button>
          </div>
          <button className="skip-btn" onClick={() => props.onAnswer('skip')}>
            {t.skip}
          </button>
        </div>
      )}
      {props.children}
    </article>
  );
}
