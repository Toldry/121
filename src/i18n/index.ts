import type { Lang, ReasoningHeading, SourceType } from '../data/types';
import ar from './ar.json';
import en from './en.json';
import he from './he.json';
import ru from './ru.json';

export type Strings = typeof en & {
  headings: Record<ReasoningHeading, string>;
  sourceTypes: Record<SourceType, string>;
};

/** Reasoning-page strings exist only in reviewed languages; the rest fall back to English. */
const partial: Record<Lang, Partial<Strings>> = { en, he, ar, ru };

export const STRINGS: Record<Lang, Strings> = {
  en: en as Strings,
  he: { ...(en as Strings), ...partial.he },
  ar: { ...(en as Strings), ...partial.ar },
  ru: { ...(en as Strings), ...partial.ru },
};

export const LANGUAGE_NAMES: Record<Lang, string> = {
  he: 'עברית',
  ar: 'العربية',
  ru: 'Русский',
  en: 'English',
};

export const isRtl = (lang: Lang) => lang === 'he' || lang === 'ar';

export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    values[key] != null ? String(values[key]) : match,
  );
}

export function formatList(lang: Lang, items: string[]): string {
  try {
    return new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).format(items);
  } catch {
    return items.join(', ');
  }
}

/** Formats an ISO date (YYYY-MM-DD or YYYY-MM) for display. */
export function formatDate(lang: Lang, iso: string | null): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  const options: Intl.DateTimeFormatOptions = day
    ? { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }
    : { year: 'numeric', month: 'long', timeZone: 'UTC' };
  return new Intl.DateTimeFormat(lang, options).format(date);
}
