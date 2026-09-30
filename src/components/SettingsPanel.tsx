import type { Strings } from '../i18n';
import type { Settings } from '../lib/storage';

interface SettingsPanelProps {
  t: Strings;
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export function SettingsPanel({ t, settings, onChange }: SettingsPanelProps) {
  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });
  return (
    <section className="settings" aria-label={t.settings}>
      <label>
        {t.settingReveal}
        <select
          value={settings.revealMode}
          onChange={(e) => update({ revealMode: e.target.value as Settings['revealMode'] })}
        >
          <option value="each">{t.revealEach}</option>
          <option value="end">{t.revealEnd}</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.blindSponsor}
          onChange={(e) => update({ blindSponsor: e.target.checked })}
        />
        {t.settingBlind}
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.showAlgorithm}
          onChange={(e) => update({ showAlgorithm: e.target.checked })}
        />
        {t.settingAlgo}
      </label>
    </section>
  );
}
