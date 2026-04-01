import { useState } from 'react';
import AdventCalendarScreen from './components/advent/AdventCalendarScreen';
import PhoneFrame from './components/PhoneFrame';
import HomeScreenGrid from './components/HomeScreenGrid';
import LinksDock from './components/LinksDock';

function App() {
  const [view, setView] = useState<'home' | 'advent'>('home');

  return (
    <main className="flex min-h-svh flex-col items-center justify-start overflow-y-auto bg-[#B0ADA0] px-[clamp(0.5rem,2.4vw,1.75rem)] pt-[clamp(0.5rem,2.4vw,1.75rem)] pb-[clamp(1rem,3vw,2.5rem)]">
      <PhoneFrame
        innerScreenClassName={
          view === 'advent' ? 'bg-[#1D3F25]' : 'bg-[#E5DBCF]'
        }
        statusBarClassName={
          view === 'advent'
            ? 'text-[#FEF8E8] [&_.status-bar-pill]:border-[#FEF8E8]/35 [&_.status-bar-pill]:bg-white/10'
            : undefined
        }
      >
        {view === 'home' ? (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_-15%,rgba(255,255,255,0.5),transparent_52%),radial-gradient(ellipse_100%_70%_at_50%_110%,rgba(55,50,45,0.06),transparent_45%)]" />
        ) : null}
        <div
          className={`relative z-10 flex min-h-0 w-full flex-1 flex-col ${
            view === 'home'
              ? 'px-4 pb-[8.5rem] pt-4 md:pt-14'
              : 'min-h-0 flex-col px-0 pb-0 pt-0 md:pt-0'
          }`}
        >
          <div className="relative flex min-h-0 flex-1 flex-col">
            {view === 'home' ? (
              <HomeScreenGrid onOpenAdvent={() => setView('advent')} />
            ) : (
              <AdventCalendarScreen onBack={() => setView('home')} />
            )}
          </div>
        </div>
        {view === 'home' ? <LinksDock /> : null}
      </PhoneFrame>
    </main>
  );
}

export default App;
