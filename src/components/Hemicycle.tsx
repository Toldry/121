import { useMemo } from 'react';
import type { Bill, FactionData, Stance } from '../data/types';

type SeatKind = Stance | 'absent' | 'inferred';

interface Seat {
  x: number;
  y: number;
  angle: number;
  radius: number;
}

/** Six rows, 120 seats, filled from one end of the arc to the other. */
const ROW_SIZES = [11, 15, 18, 22, 25, 29];
const CENTER_X = 200;
const BASE_Y = 196;
const SEAT_RADIUS = 6.4;

function seatPositions(): Seat[] {
  const seats: Seat[] = [];
  ROW_SIZES.forEach((count, row) => {
    const radius = 180 * (0.4 + row * 0.12);
    for (let k = 0; k < count; k++) {
      const angle = Math.PI - (k * Math.PI) / (count - 1);
      seats.push({
        x: CENTER_X + radius * Math.cos(angle),
        y: BASE_Y - radius * Math.sin(angle),
        angle,
        radius,
      });
    }
  });
  return seats.sort((a, b) => b.angle - a.angle || a.radius - b.radius);
}

const SEATS = seatPositions();

const SEAT_STYLE: Record<SeatKind, { fill: string; stroke: string; dashed?: boolean }> = {
  for: { fill: 'var(--for)', stroke: 'var(--for)' },
  against: { fill: 'var(--against)', stroke: 'var(--against)' },
  abstain: { fill: 'var(--abstain)', stroke: 'var(--abstain)' },
  absent: { fill: 'none', stroke: 'var(--rule-strong)' },
  inferred: { fill: 'none', stroke: 'var(--against)', dashed: true },
};

const YOU_FILL: Record<Stance, string> = {
  for: 'var(--for)',
  against: 'var(--against)',
  abstain: 'var(--abstain)',
};

function appear(delayMs: number) {
  return {
    transformBox: 'fill-box' as const,
    transformOrigin: 'center',
    animation: `seatIn .45s cubic-bezier(.2,.8,.2,1) ${delayMs}ms both`,
  };
}

interface HemicycleProps {
  data: FactionData;
  bill: Bill;
  you: Stance;
  youLabel: string;
  label: string;
}

/** The 120 seats coloured by how they voted, with the user as the 121st seat in the middle. */
export function Hemicycle({ data, bill, you, youLabel, label }: HemicycleProps) {
  const kinds = useMemo(() => {
    const out: SeatKind[] = [];
    for (const faction of data.seating) {
      const v = bill.votes[faction];
      const inferred = bill.boycottCountedAsAgainst.includes(faction);
      out.push(...Array<SeatKind>(v.for).fill('for'));
      out.push(...Array<SeatKind>(v.against).fill('against'));
      out.push(...Array<SeatKind>(v.abstain).fill('abstain'));
      out.push(...Array<SeatKind>(v.absent).fill(inferred ? 'inferred' : 'absent'));
    }
    return out;
  }, [data, bill]);

  return (
    <svg
      key={bill.id + you}
      className="hemicycle"
      viewBox="0 0 400 206"
      role="img"
      aria-label={label}
    >
      {SEATS.map((seat, i) => {
        const style = SEAT_STYLE[kinds[i] ?? 'absent'];
        return (
          <circle
            key={i}
            cx={seat.x.toFixed(1)}
            cy={seat.y.toFixed(1)}
            r={SEAT_RADIUS}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={1.4}
            strokeDasharray={style.dashed ? '2.4 1.8' : undefined}
            style={appear(i * 5)}
          />
        );
      })}
      <circle
        cx={CENTER_X}
        cy={176}
        r={13}
        fill={YOU_FILL[you]}
        stroke="var(--ink)"
        strokeWidth={2.5}
        style={appear(SEATS.length * 5 + 120)}
      />
      <text
        x={CENTER_X}
        y={150}
        textAnchor="middle"
        style={{ font: '600 12.5px var(--sans)', fill: 'var(--ink)' }}
      >
        {youLabel}
      </text>
    </svg>
  );
}
