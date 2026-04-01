import { DOCK_SOCIAL_HREF } from '../config/socialLinks';
import { appIconShellClassName } from './LinkAppIcon';

const DOCK_ITEMS = [
  {
    label: 'Instagram',
    href: DOCK_SOCIAL_HREF.instagram,
    iconSrc: '/app-icons/instagram.png',
  },
  {
    label: 'TikTok',
    href: DOCK_SOCIAL_HREF.tiktok,
    iconSrc: '/app-icons/tiktok.png',
  },
  {
    label: 'YouTube',
    href: DOCK_SOCIAL_HREF.youtube,
    iconSrc: '/app-icons/youtube.png',
  },
  {
    label: 'LinkedIn',
    href: DOCK_SOCIAL_HREF.linkedin,
    iconSrc: '/app-icons/linkedin.png',
  },
] as const;

export default function LinksDock() {
  return (
    <div className="absolute bottom-2 left-2 right-2 z-30 flex flex-col items-center justify-center md:bottom-3 md:left-[10px] md:right-4">
      <div className="dock-glass grid h-20 w-full grid-cols-4 gap-x-1.5 gap-y-0 rounded-[30px] border border-black/10 px-3 py-2 shadow-[0_12px_32px_rgba(55,48,40,0.12)] md:gap-x-2.5 md:px-[15px]">
        {DOCK_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            className="flex touch-manipulation items-center justify-center"
          >
            <div className={appIconShellClassName}>
              <img src={item.iconSrc} alt="" width={74} height={74} draggable={false} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
