import { useState } from 'react';
import AdventCalendarScreen from './components/advent/AdventCalendarScreen';
import PhoneFrame from './components/PhoneFrame';
import HomeScreenGrid from './components/HomeScreenGrid';
import LinksDock from './components/LinksDock';
import OnAnemScreen from './components/projects/OnAnemScreen';
import Zero2HeroScreen from './components/projects/Zero2HeroScreen';
import VibeCodingScreen from './components/vibe/VibeCodingScreen';

type AppView = 'home' | 'advent' | 'vibe' | 'zero2hero' | 'onanem';

const INNER_SCREEN_CLASS: Record<AppView, string> = {
  home: 'bg-[#E5DBCF]',
  advent: 'bg-[#1D3F25]',
  vibe: 'bg-[#05142b]',
  zero2hero: 'bg-white',
  onanem: 'bg-white',
};

const STATUS_BAR_CLASS: Partial<Record<AppView, string>> = {
  advent:
    'text-[#FEF8E8] [&_.status-bar-pill]:border-[#FEF8E8]/35 [&_.status-bar-pill]:bg-white/10',
  vibe: 'text-white/85 [&_.status-bar-pill]:border-white/30 [&_.status-bar-pill]:bg-white/10',
};

const CONTENT_OUTER_HOME =
  'pointer-events-none max-md:px-2.5 max-md:pb-24 max-md:pt-3 px-4 pb-[8.5rem] pt-4 md:pt-14';
const CONTENT_OUTER_OTHER = 'min-h-0 flex-col px-0 pb-0 pt-0 md:pt-0';

type ActiveScreenProps = {
  view: AppView;
  openProjectsFolderOnHome: boolean;
  onOpenProjectsFolderHandled: () => void;
  onOpenAdvent: () => void;
  onOpenVibe: () => void;
  onOpenZero2Hero: () => void;
  onOpenOnAnem: () => void;
  onBackHome: () => void;
  onProjectBack: () => void;
};

function ActiveScreen({
  view,
  openProjectsFolderOnHome,
  onOpenProjectsFolderHandled,
  onOpenAdvent,
  onOpenVibe,
  onOpenZero2Hero,
  onOpenOnAnem,
  onBackHome,
  onProjectBack,
}: Readonly<ActiveScreenProps>) {
  switch (view) {
    case 'home':
      return (
        <HomeScreenGrid
          onOpenAdvent={onOpenAdvent}
          onOpenVibe={onOpenVibe}
          onOpenZero2Hero={onOpenZero2Hero}
          onOpenOnAnem={onOpenOnAnem}
          openProjectsFolderOnMount={openProjectsFolderOnHome}
          onProjectsFolderOpenHandled={onOpenProjectsFolderHandled}
        />
      );
    case 'advent':
      return <AdventCalendarScreen onBack={onBackHome} />;
    case 'vibe':
      return <VibeCodingScreen onBack={onBackHome} />;
    case 'zero2hero':
      return <Zero2HeroScreen onBack={onProjectBack} />;
    case 'onanem':
      return <OnAnemScreen onBack={onProjectBack} />;
    default:
      return null;
  }
}

function App() {
  const [view, setView] = useState<AppView>('home');
  const [openProjectsFolderOnHome, setOpenProjectsFolderOnHome] = useState(false);

  const innerScreenClassName = INNER_SCREEN_CLASS[view];
  const statusBarClassName = STATUS_BAR_CLASS[view];

  const openProjectView = (target: 'zero2hero' | 'onanem') => {
    setOpenProjectsFolderOnHome(false);
    setView(target);
  };

  const handleProjectBack = () => {
    setOpenProjectsFolderOnHome(true);
    setView('home');
  };

  const isHome = view === 'home';
  const contentOuterClass = isHome ? CONTENT_OUTER_HOME : CONTENT_OUTER_OTHER;
  const contentInnerClass = isHome ? 'pointer-events-auto' : '';

  return (
    <main className="flex min-h-svh flex-col items-center justify-start overflow-x-hidden bg-[#B0ADA0] max-md:h-svh max-md:overflow-hidden max-md:px-0 max-md:pb-0 max-md:pt-0 md:overflow-y-auto md:px-[clamp(0.375rem,2vw,1.5rem)] md:pb-[clamp(0.75rem,2.5vw,2.25rem)] md:pt-[clamp(0.375rem,2vw,1.5rem)]">
      <PhoneFrame
        innerScreenClassName={innerScreenClassName}
        statusBarClassName={statusBarClassName}
        enableMobileContentScale={isHome}
      >
        {isHome ? (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_-15%,rgba(255,255,255,0.5),transparent_52%),radial-gradient(ellipse_100%_70%_at_50%_110%,rgba(55,50,45,0.06),transparent_45%)]" />
        ) : null}
        <div
          className={`relative z-10 flex h-full min-h-0 w-full flex-1 flex-col ${contentOuterClass}`}
        >
          <div className={`relative flex h-full min-h-0 flex-1 flex-col ${contentInnerClass}`}>
            <ActiveScreen
              view={view}
              openProjectsFolderOnHome={openProjectsFolderOnHome}
              onOpenProjectsFolderHandled={() => setOpenProjectsFolderOnHome(false)}
              onOpenAdvent={() => setView('advent')}
              onOpenVibe={() => setView('vibe')}
              onOpenZero2Hero={() => openProjectView('zero2hero')}
              onOpenOnAnem={() => openProjectView('onanem')}
              onBackHome={() => setView('home')}
              onProjectBack={handleProjectBack}
            />
          </div>
        </div>
        {isHome ? <LinksDock /> : null}
      </PhoneFrame>
    </main>
  );
}

export default App;
