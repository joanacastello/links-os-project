import { appIconShellClassName } from './LinkAppIcon';

const DOCK_ITEMS = [
  {
    label: 'Instagram',
    href: 'https://example.com/instagram',
    iconSrc: '/app-icons/instagram.png',
  },
  {
    label: 'TikTok',
    href: 'https://example.com/tiktok',
    iconSrc: '/app-icons/tiktok.png',
  },
  {
    label: 'YouTube',
    href: 'https://example.com/youtube',
    iconSrc: '/app-icons/youtube.png',
  },
  {
    label: 'LinkedIn',
    href: 'https://example.com/linkedin',
    iconSrc: '/app-icons/linkedin.png',
  },
] as const;

export default function LinksDock() {
  return (
    <div className="absolute bottom-3 left-[10px] right-4 z-20 flex flex-col items-center justify-center">
      <div className="dock-glass grid h-20 w-full grid-cols-4 gap-x-1.5 gap-y-0 rounded-[30px] border border-black/10 px-[15px] py-2 shadow-[0_12px_32px_rgba(55,48,40,0.12)] md:gap-x-2.5">
        {DOCK_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            className="flex items-center justify-center"
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
