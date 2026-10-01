import { Fragment, type ReactNode } from 'react';
import { FACTIONS } from '../data';
import logos from '../data/logos.json';
import type { FactionId, Lang } from '../data/types';

interface LogoCredit {
  file: string;
  source: string;
  license: string;
  artist: string;
}

const LOGOS = logos as Record<FactionId, LogoCredit>;

/** A party's logo, or its initial when no freely licensed logo is available. */
export function FactionIcon({ id, lang }: { id: FactionId; lang: Lang }) {
  const logo = LOGOS[id];
  if (logo) {
    return <img className="faction-icon" src={`logos/${logo.file}`} alt="" loading="lazy" />;
  }
  const initial = Array.from(FACTIONS.factions[id].name[lang].replace(/^[«"]/, ''))[0];
  return (
    <span className="faction-icon faction-initial" aria-hidden="true">
      {initial}
    </span>
  );
}

export function FactionName({ id, lang }: { id: FactionId; lang: Lang }) {
  return (
    <span className="faction-label">
      <FactionIcon id={id} lang={lang} />
      <span>{FACTIONS.factions[id].name[lang]}</span>
    </span>
  );
}

/** "A, B and C", with each party shown with its icon. */
export function FactionList({ ids, lang }: { ids: FactionId[]; lang: Lang }) {
  const names = ids.map((id) => FACTIONS.factions[id].name[lang]);
  let parts: { type: string; value: string }[];
  try {
    parts = new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).formatToParts(names);
  } catch {
    parts = names.flatMap((value, i) => [
      ...(i ? [{ type: 'literal', value: ', ' }] : []),
      { type: 'element', value },
    ]);
  }
  let next = 0;
  return (
    <>
      {parts.map((part, i) =>
        part.type === 'element' ? (
          <FactionName key={i} id={ids[next++]} lang={lang} />
        ) : (
          <Fragment key={i}>{part.value}</Fragment>
        ),
      )}
    </>
  );
}

/** Fills {placeholders} in a template with React nodes. */
export function formatNodes(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((piece, i) => {
    const key = piece.match(/^\{(\w+)\}$/)?.[1];
    return <Fragment key={i}>{key && key in values ? values[key] : piece}</Fragment>;
  });
}
