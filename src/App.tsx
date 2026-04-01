import { useState } from 'react';
import AdventCalendarScreen from './components/advent/AdventCalendarScreen';
import PhoneFrame from './components/PhoneFrame';
import HomeScreenGrid from './components/HomeScreenGrid';
import LinksDock from './components/LinksDock';
import VibeCodingScreen from './components/vibe/VibeCodingScreen';

type AppView = 'home' | 'advent' | 'vibe';

function App() {
  const [view, setView] = useState<AppView>('home');

  const innerScreenClassName =
    view === 'advent'
      ? 'bg-[#1D3F25]'
      : view === 'vibe'
        ? 'bg-[#05142b]'
        : 'bg-[#E5DBCF]';

  const statusBarClassName =
    view === 'advent'
      ? 'text-[#FEF8E8] [&_.status-bar-pill]:border-[#FEF8E8]/35 [&_.status-bar-pill]:bg-white/10'
      : view === 'vibe'
        ? 'text-white/85 [&_.status-bar-pill]:border-white/30 [&_.status-bar-pill]:bg-white/10'
        : undefined;

  return (
    <main className="flex min-h-svh flex-col items-center justify-start overflow-y-auto overflow-x-hidden bg-[#B0ADA0] px-[clamp(0.375rem,2vw,1.5rem)] pt-[clamp(0.375rem,2vw,1.5rem)] pb-[clamp(0.75rem,2.5vw,2.25rem)]">
      <PhoneFrame innerScreenClassName={innerScreenClassName} statusBarClassName={statusBarClassName}>
        {view === 'home' ? (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_-15%,rgba(255,255,255,0.5),transparent_52%),radial-gradient(ellipse_100%_70%_at_50%_110%,rgba(55,50,45,0.06),transparent_45%)]" />
        ) : null}
        <div
          className={`relative z-10 flex min-h-0 w-full flex-1 flex-col ${
            view === 'home'
              ? 'max-md:px-2.5 max-md:pb-24 max-md:pt-3 px-4 pb-[8.5rem] pt-4 md:pt-14'
              : 'min-h-0 flex-col px-0 pb-0 pt-0 md:pt-0'
          }`}
        >
          <div className="relative flex min-h-0 flex-1 flex-col">
            {view === 'home' ? (
              <HomeScreenGrid
                onOpenAdvent={() => setView('advent')}
                onOpenVibe={() => setView('vibe')}
              />
            ) : null}
            {view === 'advent' ? (
              <AdventCalendarScreen onBack={() => setView('home')} />
            ) : null}
            {view === 'vibe' ? <VibeCodingScreen onBack={() => setView('home')} /> : null}
          </div>
        </div>
        {view === 'home' ? <LinksDock /> : null}
      </PhoneFrame>
    </main>
  );
}

export default App;
