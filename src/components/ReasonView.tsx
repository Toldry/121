import { useState } from 'react';
import type { Bill, Lang, ReasoningLang } from '../data/types';
import { REASONING_LANGUAGES } from '../data/types';
import { STRINGS, format, formatDate, isRtl, LANGUAGE_NAMES, type Strings } from '../i18n';
import { Arrow } from './Reveal';

interface ReasonViewProps {
  t: Strings;
  lang: Lang;
  bill: Bill;
  onBack: () => void;
}

/** The long-form, sourced reasoning behind a bill's short texts. */
export function ReasonView({ t, lang, bill, onBack }: ReasonViewProps) {
  const [activeSource, setActiveSource] = useState<number | null>(null);
  const reasoningLang: ReasoningLang = (REASONING_LANGUAGES as readonly string[]).includes(lang)
    ? (lang as ReasoningLang)
    : 'en';
  const rt = STRINGS[reasoningLang];
  const text = bill.text[reasoningLang];

  const jumpToSource = (n: number) => {
    setActiveSource(n);
    const el = document.getElementById(`src-${bill.id}-${n}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  };

  return (
    <div className="reason">
      <button className="link-button" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        <Arrow back /> {t.back}
      </button>
      {reasoningLang !== lang && (
        <div className="fallback-note">{format(t.fallback, { l: LANGUAGE_NAMES[lang] })}</div>
      )}
      <article dir={isRtl(reasoningLang) ? 'rtl' : 'ltr'} lang={reasoningLang}>
        <div className="bill-meta">
          <span>{rt.knesset}</span>
          <span>{text.stage}</span>
          {bill.date && <span>{formatDate(reasoningLang, bill.date)}</span>}
        </div>
        <h1>{text.title}</h1>
        <div className="bill-foot" style={{ paddingBottom: 6 }}>
          <span className="provenance">
            <span className="ai-badge">AI</span>
            {format(rt.ai, { s: bill.sources.length })}
          </span>
        </div>

        {bill.reasoning[reasoningLang].map((section, i) => (
          <section key={i}>
            <h2 className="serif">{rt.headings[section.heading]}</h2>
            {section.paragraphs.map((p, j) => (
              <p key={j}>
                {p.text}
                {p.cites.map((n) => (
                  <a
                    key={n}
                    className="cite"
                    href={`#src-${bill.id}-${n}`}
                    onClick={(e) => {
                      e.preventDefault();
                      jumpToSource(n);
                    }}
                  >
                    [{n}]
                  </a>
                ))}
              </p>
            ))}
            {section.quote && (
              <figure>
                <blockquote>{section.quote.text}</blockquote>
                <figcaption>
                  <span>— {section.quote.attribution}</span>
                  {section.quote.placeholder && <span className="placeholder-tag">{rt.sample}</span>}
                </figcaption>
              </figure>
            )}
          </section>
        ))}

        <section>
          <h2 className="serif">{rt.sources}</h2>
          <p className="muted" style={{ fontSize: 13 }}>
            {rt.sourcesNote}
          </p>
          <ol className="sources">
            {bill.sources.map((source, i) => {
              const n = i + 1;
              return (
                <li key={n} id={`src-${bill.id}-${n}`} className={activeSource === n ? 'active' : ''}>
                  <span className="n">[{n}]</span>
                  <span className="body">
                    <span className="type">{rt.sourceTypes[source.type]}</span>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.title[reasoningLang]}
                      </a>
                    ) : (
                      <span>{source.title[reasoningLang]}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </article>
      <p className="corrections">{t.corrections}</p>
    </div>
  );
}
