import { useEffect, useState } from 'react';

/** Contenedor de la pantalla redondeada; usado para portales (p. ej. overlay Proyectos edge-to-edge). */
export const PHONE_INNER_SCREEN_ELEMENT_ID = 'phone-inner-screen';

type PhoneFrameProps = Readonly<{
  children: React.ReactNode;
  /** Fondo del panel interior (pantalla con esquinas redondeadas). Por defecto tono crema del home. */
  innerScreenClassName?: string;
  /** Sobrescribe color de la barra de hora (p. ej. texto claro sobre fondo oscuro). */
  statusBarClassName?: string;
  /** Escala proporcional del contenido en mobile (sin encoger el marco/fondo). */
  enableMobileContentScale?: boolean;
}>;

function getNowLabel() {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

const MOBILE_FRAME_BASE_HEIGHT = 622;
const MOBILE_FRAME_VERTICAL_MARGIN = 12;

export default function PhoneFrame({
  children,
  innerScreenClassName = 'bg-[#E5DBCF]',
  statusBarClassName,
  enableMobileContentScale = false,
}: PhoneFrameProps) {
  const [timeLabel, setTimeLabel] = useState(getNowLabel);
  const [mobileScale, setMobileScale] = useState(1);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    const id = globalThis.setInterval(() => setTimeLabel(getNowLabel()), 1000 * 30);
    return () => globalThis.clearInterval(id);
  }, []);

  useEffect(() => {
    const mql = globalThis.matchMedia('(max-width: 767px)');

    const updateMobileScale = () => {
      const mobile = mql.matches;
      setIsMobileLayout(mobile);
      if (!mobile) {
        setMobileScale(1);
        return;
      }

      const viewportHeight =
        globalThis.visualViewport?.height ?? globalThis.innerHeight;
      const availableHeight = Math.max(0, viewportHeight - MOBILE_FRAME_VERTICAL_MARGIN);
      const scale = Math.min(1, availableHeight / MOBILE_FRAME_BASE_HEIGHT);
      setMobileScale(scale);
    };

    updateMobileScale();
    globalThis.addEventListener('resize', updateMobileScale);
    mql.addEventListener('change', updateMobileScale);

    return () => {
      globalThis.removeEventListener('resize', updateMobileScale);
      mql.removeEventListener('change', updateMobileScale);
    };
  }, []);

  return (
    <div
      className="relative mx-auto flex w-[384px] max-w-[min(384px,calc(100vw-0.75rem))] shrink-0 flex-col items-center justify-center max-md:fixed max-md:bottom-[0.375rem] max-md:top-[0.375rem] max-md:left-1/2 max-md:mx-0 max-md:h-[calc(100svh-0.75rem)] max-md:w-[min(384px,calc(100vw-0.75rem))] max-md:items-stretch max-md:justify-stretch md:max-w-[calc(100vw-1rem)] md:rounded-[40px] md:bg-black md:p-2 md:shadow-phone-device"
      style={isMobileLayout ? { transform: 'translateX(-50%)' } : undefined}
    >
      <div
        id={PHONE_INNER_SCREEN_ELEMENT_ID}
        className={`relative flex h-[min(720px,calc(100svh-8px))] w-full shrink-0 flex-col overflow-hidden rounded-[34px] md:h-[800px] max-md:h-full ${innerScreenClassName}`}
        style={
          enableMobileContentScale && isMobileLayout
            ? {
                height: `${100 / mobileScale}%`,
                transform: `scale(${mobileScale})`,
                transformOrigin: 'top center',
              }
            : undefined
        }
      >
        <div
          className={`absolute inset-x-0 top-0 z-[200] hidden h-12 px-6 pt-4 font-sans text-xs md:flex ${
            statusBarClassName ?? 'text-neutral-600'
          }`}
        >
          <div className="absolute left-6 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <span className="text-base font-bold leading-none tracking-tight">{timeLabel}</span>
            <span
              className="h-[18px] w-[18px] bg-current"
              aria-hidden
              style={{
                WebkitMaskImage: "url('/status-icons/heart.svg')",
                maskImage: "url('/status-icons/heart.svg')",
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
              }}
            />
          </div>

          <div
            className="status-bar-pill absolute left-1/2 top-1/2 h-[26px] w-[112px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black"
            aria-hidden
          />

          <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-inherit" aria-hidden>
            <span
              className="h-[14px] w-[18px] bg-current"
              style={{
                WebkitMaskImage: "url('/status-icons/wifi.svg')",
                maskImage: "url('/status-icons/wifi.svg')",
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
              }}
            />
            <span
              className="h-[14px] w-[16px] bg-current"
              style={{
                WebkitMaskImage: "url('/status-icons/connection.svg')",
                maskImage: "url('/status-icons/connection.svg')",
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
              }}
            />
            <span
              className="h-[14px] w-[24px] bg-current"
              style={{
                WebkitMaskImage: "url('/status-icons/battery.svg')",
                maskImage: "url('/status-icons/battery.svg')",
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
              }}
            />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

