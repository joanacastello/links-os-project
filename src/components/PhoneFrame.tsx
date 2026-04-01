interface PhoneFrameProps {
  children: React.ReactNode;
  /** Fondo del panel interior (pantalla con esquinas redondeadas). Por defecto tono crema del home. */
  innerScreenClassName?: string;
  /** Sobrescribe color de la barra de hora (p. ej. texto claro sobre fondo oscuro). */
  statusBarClassName?: string;
}

export default function PhoneFrame({
  children,
  innerScreenClassName = 'bg-[#E5DBCF]',
  statusBarClassName,
}: PhoneFrameProps) {
  return (
    <div className="relative mx-auto flex w-[400px] max-w-[calc(100vw-1rem)] shrink-0 flex-col items-center justify-center md:rounded-[40px] md:bg-[#B0ADA0] md:p-2 md:shadow-phone-device">
      <div
        className={`relative flex h-[720px] w-full shrink-0 flex-col overflow-hidden rounded-[34px] ${innerScreenClassName}`}
      >
        <div
          className={`absolute inset-x-0 top-0 z-20 hidden items-center justify-between px-6 pt-4 font-mono text-xs md:flex ${
            statusBarClassName ?? 'text-neutral-600'
          }`}
        >
          <span>17:22</span>
          <span className="status-bar-pill rounded-full border border-neutral-400/50 bg-white/30 px-1.5 py-0.5 text-[10px]">
            31
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

