import type { CSSProperties, ReactNode } from 'react';

interface LinkWidgetProps {
  caption: string;
  /** Omitido en `variant="profile"` (no hay enlace). */
  href?: string;
  /** Abre una vista interna (sin `target="_blank"`). Requiere `aria-label` si no hay texto visible único. */
  onInternalNavigate?: () => void;
  icon?: ReactNode;
  className?: string;
  'aria-label'?: string;
  variant?: 'default' | 'profile';
  /** Foto del avatar circular (variante profile). */
  profileImage?: string;
  firstName?: string;
  lastName?: string;
  /** Subtítulo bajo el nombre (variante profile). */
  profileSubtitle?: string;
  /** Tamaño del bloque cuadrado principal en mobile (px). */
  iconSizeMobilePx?: number;
}

export default function LinkWidget({
  caption,
  href,
  onInternalNavigate,
  icon,
  className = '',
  'aria-label': ariaLabel,
  variant = 'default',
  profileImage = '/foto-joana.png',
  firstName = 'Joana',
  lastName = 'Castelló',
  profileSubtitle = 'Ingeniera · Creadora · DJ',
  iconSizeMobilePx,
}: LinkWidgetProps) {
  const profileShellClass = `flex h-full min-h-0 min-w-0 flex-col justify-start gap-2 px-[5px] ${className}`;
  const linkShellClass = `group flex h-full min-h-0 min-w-0 w-full flex-col items-end justify-start gap-2 px-[5px] md:justify-end ${className}`;

  const body =
    variant === 'profile' ? (
      <div className="flex h-full min-h-0 w-full min-w-0 flex-1 items-center justify-start gap-7 rounded-[22px] bg-[#3e3b36] py-5 pl-5 pr-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] max-md:gap-4 max-md:py-3 max-md:pl-4 max-md:pr-3">
        <div className="size-[76px] shrink-0 overflow-hidden rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.12)] max-md:size-[62px]">
          <img
            src={profileImage}
            alt=""
            width={152}
            height={152}
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left">
          <p className="font-sans text-xxl font-semibold leading-tight tracking-tight text-white">
            {firstName} {lastName}
          </p>
          <p className="font-sans text-sm font-medium leading-snug text-white/50">
            {profileSubtitle}
          </p>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-[#5a3e35] px-3 py-1 font-sans text-sm font-semibold leading-none text-[#ff7c4d]">
              Vibe Coding
            </span>
            <span className="inline-flex rounded-full bg-[#4d4a45] px-3 py-1 font-sans text-sm font-semibold leading-none text-white/85">
              IA
            </span>
          </div>
        </div>
      </div>
    ) : (
      <div className="relative aspect-square w-full min-w-0 shrink-0 overflow-hidden rounded-[26px] shadow-[0_14px_30px_rgba(0,0,0,0.12)] transition-transform duration-200 group-active:scale-[0.98] max-md:w-[var(--vibe-icon-size,128px)] max-md:self-end">
        {icon}
      </div>
    );

  const footer = (
    <span
      className={
        variant === 'profile'
          ? 'max-md:-mb-6 shrink-0 text-center text-xs font-medium leading-none text-neutral-800'
          : 'shrink-0 text-center text-[12px] font-medium leading-none text-neutral-800 max-md:w-[var(--vibe-icon-size,128px)] max-md:self-end'
      }
    >
      {caption}
    </span>
  );

  const mobileIconSizeStyle =
    iconSizeMobilePx !== undefined
      ? ({ '--vibe-icon-size': `${iconSizeMobilePx}px` } as CSSProperties)
      : undefined;

  if (variant === 'profile') {
    return (
      <div
        className={profileShellClass}
        role="group"
        aria-label={`${firstName} ${lastName}`}
      >
        {body}
        {footer}
      </div>
    );
  }

  if (onInternalNavigate) {
    return (
      <button
        type="button"
        onClick={onInternalNavigate}
        aria-label={ariaLabel ?? caption}
        className={`${linkShellClass} cursor-pointer border-0 bg-transparent p-0 text-inherit`}
        style={mobileIconSizeStyle}
      >
        {body}
        {footer}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={linkShellClass}
      style={mobileIconSizeStyle}
    >
      {body}
      {footer}
    </a>
  );
}
