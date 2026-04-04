import { useState } from 'react';
import AdventCalendarScreen from './components/advent/AdventCalendarScreen';
import PhoneFrame from './components/PhoneFrame';
import HomeScreenGrid from './components/HomeScreenGrid';
import LinksDock from './components/LinksDock';
import OnAnemScreen from './components/projects/OnAnemScreen';
import Zero2HeroScreen from './components/projects/Zero2HeroScreen';
import VibeCodingScreen from './components/vibe/VibeCodingScreen';

type AppView = 'home' | 'advent' | 'vibe' | 'zero2hero' | 'onanem';

function App() {
  const [view, setView] = useState<AppView>('home');
  const [openProjectsFolderOnHome, setOpenProjectsFolderOnHome] = useState(false);

  const innerScreenClassName =
    view === 'advent'
      ? 'bg-[#1D3F25]'
      : view === 'vibe'
        ? 'bg-[#05142b]'
        : view === 'zero2hero'
          ? 'bg-white'
          : view === 'onanem'
            ? 'bg-white'
        : 'bg-[#E5DBCF]';

  const statusBarClassName =
    view === 'advent'
      ? 'text-[#FEF8E8] [&_.status-bar-pill]:border-[#FEF8E8]/35 [&_.status-bar-pill]:bg-white/10'
      : view === 'vibe'
        ? 'text-white/85 [&_.status-bar-pill]:border-white/30 [&_.status-bar-pill]:bg-white/10'
        : undefined;

  const openProjectView = (target: 'zero2hero' | 'onanem') => {
    setOpenProjectsFolderOnHome(false);
    setView(target);
  };

  const handleProjectBack = () => {
    setOpenProjectsFolderOnHome(true);
    setView('home');
  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-start overflow-x-hidden bg-[#B0ADA0] max-md:h-svh max-md:overflow-hidden max-md:px-0 max-md:pb-0 max-md:pt-0 md:overflow-y-auto md:px-[clamp(0.375rem,2vw,1.5rem)] md:pb-[clamp(0.75rem,2.5vw,2.25rem)] md:pt-[clamp(0.375rem,2vw,1.5rem)]">
      <PhoneFrame
        innerScreenClassName={innerScreenClassName}
        statusBarClassName={statusBarClassName}
        enableMobileContentScale={view === 'home'}
      >
        {view === 'home' ? (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_-15%,rgba(255,255,255,0.5),transparent_52%),radial-gradient(ellipse_100%_70%_at_50%_110%,rgba(55,50,45,0.06),transparent_45%)]" />
        ) : null}
        <div
          className={`relative z-10 flex min-h-0 w-full flex-1 flex-col ${
            view === 'home'
              ? 'pointer-events-none max-md:px-2.5 max-md:pb-24 max-md:pt-3 px-4 pb-[8.5rem] pt-4 md:pt-14'
              : 'min-h-0 flex-col px-0 pb-0 pt-0 md:pt-0'
          }`}
        >
          <div className={`relative flex min-h-0 flex-1 flex-col ${view === 'home' ? 'pointer-events-auto' : ''}`}>
            {view === 'home' ? (
              <HomeScreenGrid
                onOpenAdvent={() => setView('advent')}
                onOpenVibe={() => setView('vibe')}
                onOpenZero2Hero={() => openProjectView('zero2hero')}
                onOpenOnAnem={() => openProjectView('onanem')}
                openProjectsFolderOnMount={openProjectsFolderOnHome}
                onProjectsFolderOpenHandled={() => setOpenProjectsFolderOnHome(false)}
              />
            ) : null}
            {view === 'advent' ? (
              <AdventCalendarScreen onBack={() => setView('home')} />
            ) : null}
            {view === 'vibe' ? <VibeCodingScreen onBack={() => setView('home')} /> : null}
            {view === 'zero2hero' ? <Zero2HeroScreen onBack={handleProjectBack} /> : null}
            {view === 'onanem' ? <OnAnemScreen onBack={handleProjectBack} /> : null}
          </div>
        </div>
        {view === 'home' ? <LinksDock /> : null}
      </PhoneFrame>
    </main>
  );
}

export default App;
