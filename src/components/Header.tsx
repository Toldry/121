import { LANGUAGES, type Lang } from '../data/types';
import { LANGUAGE_NAMES, type Strings } from '../i18n';

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
  return (
    <header className="header">
      <div className="brand">
        <span className="brand-mark" dir="ltr">
          121
        </span>
        <span className="brand-tag">{t.tag}</span>
      </div>
      <nav className="nav">
        <button
          className="nav-tab"
          aria-current={onResults ? undefined : 'page'}
          onClick={() => props.onNavigate('vote')}
        >
          {t.navVote}
        </button>
        <button
          className="nav-tab"
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
