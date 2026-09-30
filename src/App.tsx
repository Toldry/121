import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BILLS, BILLS_BY_ID, FACTIONS } from './data';
import { LANGUAGES, type Answer, type Lang } from './data/types';
import { STRINGS, isRtl } from './i18n';
import { rankBills, type Answers } from './lib/model';
import { load, save, type Settings } from './lib/storage';
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { VoteView } from './components/VoteView';
import { ReasonView } from './components/ReasonView';
import { ResultsView } from './components/ResultsView';

type Route = { view: 'vote' } | { view: 'results' } | { view: 'reason'; billId: string };

function parseRoute(hash: string): Route {
  const [view, id] = hash.replace(/^#\/?/, '').split('/');
  if (view === 'results') return { view: 'results' };
  if (view === 'reason' && id && BILLS_BY_ID[id]) return { view: 'reason', billId: id };
  return { view: 'vote' };
}

function routeHash(route: Route): string {
  return route.view === 'reason' ? `#/reason/${route.billId}` : `#/${route.view}`;
}

/** First visit: pick a language from the browser, defaulting to Hebrew. */
function browserLanguage(): Lang {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.slice(0, 2).toLowerCase();
    if (base === 'iw') return 'he';
    if ((LANGUAGES as readonly string[]).includes(base)) return base as Lang;
  }
  return 'he';
}

function nextBillId(answers: Answers): string | null {
  return rankBills(FACTIONS, BILLS, answers)[0]?.bill.id ?? null;
}

export function App() {
  const initial = useMemo(load, []);
  const [answers, setAnswers] = useState<Answers>(initial.votes);
  const [lang, setLang] = useState<Lang>(initial.lang ?? browserLanguage());
  const [settings, setSettings] = useState<Settings>(initial.settings);
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  const [currentId, setCurrentId] = useState<string | null>(() => nextBillId(initial.votes));
  const [revealed, setRevealed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number>();

  const t = STRINGS[lang];

  useEffect(() => {
    save({ votes: answers, lang, settings });
  }, [answers, lang, settings]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
    document.title = `121 · ${t.tag}`;
  }, [lang, t.tag]);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((next: Route) => {
    const hash = routeHash(next);
    if (location.hash === hash) window.scrollTo(0, 0);
    else location.hash = hash;
  }, []);

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const moveToNext = useCallback((nextAnswers: Answers) => {
    setCurrentId(nextBillId(nextAnswers));
    setRevealed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const answer = useCallback(
    (value: Answer) => {
      if (!currentId) return;
      const nextAnswers = { ...answers, [currentId]: value };
      setAnswers(nextAnswers);
      if (value === 'skip') {
        moveToNext(nextAnswers);
      } else if (settings.revealMode === 'end') {
        showToast(t.toastEnd);
        moveToNext(nextAnswers);
      } else {
        setRevealed(true);
      }
    },
    [answers, currentId, moveToNext, settings.revealMode, showToast, t.toastEnd],
  );

  const goToBill = useCallback(
    (billId: string) => {
      setCurrentId(billId);
      setRevealed(false);
      navigate({ view: 'vote' });
    },
    [navigate],
  );

  const clearVotes = useCallback(() => {
    setAnswers({});
    setCurrentId(nextBillId({}));
    setRevealed(false);
    navigate({ view: 'vote' });
  }, [navigate]);

  const answeredCount = Object.values(answers).filter((a) => a !== 'skip').length;

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skipLink}
      </a>
      <div className="banner" role="note">
        {t.proto}
      </div>
      <Header
        t={t}
        lang={lang}
        view={route.view}
        answeredCount={answeredCount}
        settingsOpen={settingsOpen}
        onLang={setLang}
        onNavigate={(view) => navigate({ view })}
        onToggleSettings={() => setSettingsOpen((open) => !open)}
      />
      {settingsOpen && <SettingsPanel t={t} settings={settings} onChange={setSettings} />}
      <main id="main" className="page">
        {route.view === 'vote' && (
          <VoteView
            t={t}
            lang={lang}
            answers={answers}
            currentId={currentId}
            revealed={revealed}
            settings={settings}
            onAnswer={answer}
            onNext={() => moveToNext(answers)}
            onOpenReasoning={(billId) => navigate({ view: 'reason', billId })}
            onResults={() => navigate({ view: 'results' })}
          />
        )}
        {route.view === 'reason' && (
          <ReasonView t={t} lang={lang} bill={BILLS_BY_ID[route.billId]} onBack={() => navigate({ view: 'vote' })} />
        )}
        {route.view === 'results' && (
          <ResultsView
            t={t}
            lang={lang}
            answers={answers}
            onKeepVoting={() => navigate({ view: 'vote' })}
            onGoToBill={goToBill}
            onClear={clearVotes}
          />
        )}
      </main>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
