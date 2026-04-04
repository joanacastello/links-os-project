import { ChevronLeft } from 'lucide-react';

type ScreenBackButtonProps = Readonly<{
  onBack: () => void;
  /** Texto para lectores de pantalla. */
  label?: string;
  /** Color del icono (p. ej. `text-white/90`). */
  iconClassName?: string;
  /** Clases extra del botón (p. ej. hover sobre fondo oscuro). */
  buttonClassName?: string;
}>;

export default function ScreenBackButton({
  onBack,
  label = 'Volver al inicio',
  iconClassName = 'text-[#FEF8E8]',
  buttonClassName = 'hover:bg-white/10',
}: ScreenBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onBack}
      className={`absolute left-0 top-1 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors ${buttonClassName}`}
      aria-label={label}
    >
      <ChevronLeft className={`h-6 w-6 ${iconClassName}`} strokeWidth={2} />
    </button>
  );
}
