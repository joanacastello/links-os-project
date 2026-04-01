import { ADVENT_ROWS, type AdventDay } from '../../data/adventDays';
import ScreenBackButton from '../ScreenBackButton';

const BG = '#1D3F25';
const CARD = '#FEF8E8';
const CARD_TEXT = '#1D3F25';
const CARD_TEXT_MUTED = 'rgba(29, 63, 37, 0.72)';

function dayLabel(n: number) {
  return `DÍA ${String(n).padStart(2, '0')}`;
}

function AdventCard({ item, className = '' }: { item: AdventDay; className?: string }) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative flex min-h-[96px] flex-col rounded-2xl p-2 shadow-md shadow-black/25 transition-transform active:scale-[0.98] ${className}`}
      style={{ backgroundColor: CARD }}
    >
      <p
        className="text-[12px] font-semibold uppercase tracking-wider"
        style={{ color: CARD_TEXT_MUTED }}
      >
        {dayLabel(item.day)}
      </p>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-1">
        <img
          src="/adviento/regalo.png"
          alt=""
          width={80}
          height={80}
          draggable={false}
          className="h-9 w-auto max-w-[72px] object-contain"
          decoding="async"
        />
      </div>
      <p
        className="text-center text-[12px] font-bold leading-tight"
        style={{ color: CARD_TEXT }}
      >
        {item.title}
      </p>
    </a>
  );
}

interface AdventCalendarScreenProps {
  onBack: () => void;
}

export default function AdventCalendarScreen({ onBack }: AdventCalendarScreenProps) {
  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      style={{ backgroundColor: BG }}
    >
      <header className="shrink-0 px-3 pb-2 pt-3 md:pt-14">
        <div className="relative">
          <ScreenBackButton onBack={onBack} />
          <div className="mx-auto flex flex-col items-center px-10 pt-8">
            <img
              src="/adviento/logo-adviento.png"
              alt="Calendario de adviento"
              className="mx-auto h-auto w-full max-w-[200px] object-contain"
              width={560}
              height={200}
              decoding="async"
            />
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-2">
        <div className="mx-auto flex max-w-md flex-col gap-2.5">
          {ADVENT_ROWS.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={row.length === 2 ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-1 gap-2.5'}
            >
              {row.map((item) => (
                <AdventCard key={item.day} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
