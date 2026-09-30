import type { FactionMatch } from '../lib/model';

/** The 90% range as a band, with a tick at the estimate. */
export function MatchBar({ match }: { match: FactionMatch }) {
  const hasRecord = match.n > 0;
  return (
    <div className="range-track" aria-hidden="true">
      {hasRecord && (
        <>
          <span
            className="range-fill"
            style={{
              insetInlineStart: `${(match.low * 100).toFixed(1)}%`,
              width: `${((match.high - match.low) * 100).toFixed(1)}%`,
            }}
          />
          <span
            className="range-mark"
            style={{ insetInlineStart: `calc(${(match.mean * 100).toFixed(1)}% - 1.5px)` }}
          />
        </>
      )}
    </div>
  );
}

export function percentText(match: FactionMatch): string {
  return match.n > 0 ? `${Math.round(match.mean * 100)}%` : '—';
}
