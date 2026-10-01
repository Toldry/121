import { LANGUAGES, type Lang } from '../data/types';
import { LANGUAGE_NAMES, isRtl, type Strings } from '../i18n';

interface HeaderProps {
  t: Strings;
  lang: Lang;
  view: 'vote' | 'results' | 'reason';
  answeredCount: number;
  settingsOpen: boolean;
  onLang: (lang: Lang) => void;
  onNavigate: (view: 'vote' | 'results') => void;
  onToggleSettings: () => void;
}

export function Header(props: HeaderProps) {
  const { t, lang, view, answeredCount, settingsOpen } = props;
  const onResults = view === 'results';
  const textDir = isRtl(lang) ? 'rtl' : 'ltr';
  // The header keeps one layout in every language, so the widgets don't jump
  // when switching between right-to-left and left-to-right.
  return (
    <header className="header" dir="ltr">
      <div className="brand">
        <span className="brand-mark" dir="ltr">
          121
        </span>
        <span className="brand-tag" dir={textDir}>
          {t.tag}
        </span>
      </div>
      <nav className="nav">
        <button
          className="nav-tab"
          dir={textDir}
          aria-current={onResults ? undefined : 'page'}
          onClick={() => props.onNavigate('vote')}
        >
          {t.navVote}
        </button>
        <button
          className="nav-tab"
          dir={textDir}
          aria-current={onResults ? 'page' : undefined}
          onClick={() => props.onNavigate('results')}
        >
          {t.navResults}
          <span className="count-pill">{answeredCount}</span>
        </button>
      </nav>
      <div className="header-tools">
        <div className="segmented" role="group" aria-label="Language">
          {LANGUAGES.map((code) => (
            <button
              key={code}
              lang={code}
              aria-pressed={code === lang}
              onClick={() => props.onLang(code)}
            >
              {LANGUAGE_NAMES[code]}
            </button>
          ))}
        </div>
        <button
          className="icon-button"
          aria-label={t.settings}
          title={t.settings}
          aria-expanded={settingsOpen}
          onClick={props.onToggleSettings}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7h10M18 7h2M4 17h2M10 17h10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="16" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="8" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </div>
    </header>
  );
}
