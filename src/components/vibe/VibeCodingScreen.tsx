import { useCallback, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import ScreenBackButton from '../ScreenBackButton';
import { SA_COMMUNITY_EXTERNAL_URL } from '../../config/saCommunity';
import { TURNSTILE_SITE_KEY } from '../../config/security';
import { requestNewsletterSubscribe } from '../../lib/requestNewsletterSubscribe';
import TurnstileWidget from './TurnstileWidget';

const BG = '#05142b';
/** Fondo del modal de confirmación (navy). */
const DIALOG_MODAL_BG = '#162145';
const ACCENT_ORANGE = '#ff8522';

const BEEHIIV_TERMS_URL = 'https://www.beehiiv.com/tou';
const BEEHIIV_PRIVACY_URL = 'https://www.beehiiv.com/privacy';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function StarField() {
  const stars = useMemo(() => {
    const rand = mulberry32(0x5a1e2026);
    return Array.from({ length: 96 }, () => ({
      left: `${rand() * 100}%`,
      top: `${rand() * 100}%`,
      size: rand() * 2 + 0.5,
      opacity: rand() * 0.65 + 0.2,
    }));
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {stars.map((s) => (
        <span
          key={`${s.left}-${s.top}-${s.size}-${s.opacity}`}
          className="absolute rounded-full bg-white"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}

type IosEmailFieldProps = Readonly<{
  value: string;
  onChange: (v: string) => void;
  onWebsiteChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
}>;

function IosEmailField({
  value,
  onChange,
  onWebsiteChange,
  onSubmit,
  disabled,
  placeholder,
}: IosEmailFieldProps) {
  const submit = useCallback(() => {
    if (!disabled) onSubmit();
  }, [disabled, onSubmit]);

  return (
    <form
      className="relative w-full max-w-[340px]"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor="vibe-email" className="sr-only">
        Correo electrónico
      </label>
      <input
        id="vibe-email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-300 bg-white py-3.5 pl-5 pr-[3.25rem] text-[15px] text-neutral-900 shadow-none outline-none ring-0 placeholder:text-neutral-400 focus:border-gray-400 disabled:opacity-60"
      />
      <input
        type="text"
        name="website"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onWebsiteChange(e.target.value)}
        className="absolute left-[-9999px] top-[-9999px] h-px w-px opacity-0"
      />
      <button
        type="submit"
        disabled={disabled}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-400 bg-transparent text-neutral-500 transition-opacity disabled:opacity-40"
        aria-label="Enviar correo"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className="translate-x-px"
          aria-hidden
        >
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}

type VibeCodingScreenProps = Readonly<{
  onBack: () => void;
}>;

export default function VibeCodingScreen({ onBack }: VibeCodingScreenProps) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const onSubmit = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Introduce un correo válido.');
      return;
    }
    if (!consent) {
      setError('Debes aceptar el consentimiento para recibir el boletín.');
      return;
    }
    setError(null);
    setLoading(true);
    const result = await requestNewsletterSubscribe({
      email: trimmed,
      consent,
      captchaToken: captchaToken || undefined,
      website,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCaptchaToken('');
    setSuccessOpen(true);
  }, [captchaToken, consent, email, website]);

  const communityHref = SA_COMMUNITY_EXTERNAL_URL || undefined;

  return (
    <div
      className="relative flex min-h-0 min-w-0 flex-1 flex-col"
      style={{ backgroundColor: BG }}
    >
      <StarField />

      <header className="relative z-30 shrink-0 px-3 pb-4 pt-3 md:pb-5 md:pt-14">
        <div className="relative min-h-[44px]">
          <ScreenBackButton
            onBack={onBack}
            iconClassName="text-white"
            buttonClassName="hover:bg-white/10"
          />
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain px-5 pb-10 pt-4 md:pt-6">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <img
            src="/sa/logo-sa.png"
            alt="StrategIA Academy"
            className="mx-auto h-auto w-full max-w-[220px] object-contain"
            width={440}
            height={160}
            decoding="async"
            draggable={false}
          />

          <p className="mt-8 text-[15px] leading-relaxed text-white">
            ¿Quieres construir proyectos como este, crecer tu negocio con IA, o crear proyectos para otros y
            vivir de ello?
          </p>

          <p className="mt-6 text-[15px] font-semibold text-white">Deja tu correo y te cuento cómo.</p>

          <div className="mt-4 w-full max-w-[340px]">
            <IosEmailField
              value={email}
              onChange={setEmail}
              onWebsiteChange={setWebsite}
              onSubmit={onSubmit}
              disabled={loading}
              placeholder="tu@email.com"
            />
            <label className="mt-3 flex items-start gap-2 text-left text-sm text-neutral-200">
              <input
                type="checkbox"
                checked={consent}
                disabled={loading}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded-[3px] border border-white/80 bg-white accent-orange-500"
              />
              <span className="text-neutral-300">
                Doy mi consentimiento para recibir boletines por correo electrónico.{' '}
                <a
                  href={BEEHIIV_TERMS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  Términos de Uso
                </a>{' '}
                y{' '}
                <a
                  href={BEEHIIV_PRIVACY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  Política de Privacidad
                </a>
                .
              </span>
            </label>
            {TURNSTILE_SITE_KEY ? (
              <div className="mt-3">
                <TurnstileWidget siteKey={TURNSTILE_SITE_KEY} onTokenChange={setCaptchaToken} />
              </div>
            ) : null}
            {error ? (
              <p className="mt-2 text-left text-sm text-red-300" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {loading ? (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-[#05142b]/75 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="h-10 w-10 animate-spin text-white/90" strokeWidth={2} />
          <span className="sr-only">Suscribiendo…</span>
        </div>
      ) : null}

      {successOpen ? (
        <dialog
          open
          onCancel={(e) => {
            e.preventDefault();
            setSuccessOpen(false);
          }}
          className="absolute inset-0 z-40 m-0 flex max-h-none w-full max-w-none items-end justify-center border-0 bg-black/45 p-4 pb-8 backdrop-blur-[1px] sm:items-center sm:pb-4 [&::backdrop]:bg-transparent"
          aria-labelledby="vibe-success-title"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-[1.5rem] border border-white/10 px-8 py-8 text-center text-white shadow-xl"
            style={{ backgroundColor: DIALOG_MODAL_BG }}
          >
            <img
              src="/sa/lock.png"
              alt=""
              width={112}
              height={112}
              className="mx-auto h-14 w-auto max-w-[4.5rem] object-contain"
              decoding="async"
              draggable={false}
            />
            <h2 id="vibe-success-title" className="mt-6 text-xl font-bold leading-snug tracking-tight text-white">
              Plazas cerradas por ahora
            </h2>
            <p className="mt-4 text-base leading-snug text-neutral-200">
              Serás la primera en saber cuando abramos.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-neutral-300">
              <span className="font-semibold" style={{ color: ACCENT_ORANGE }}>
                Revisa tu correo
              </span>{' '}
              y acepta la confirmación — puede estar en spam o promociones.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {communityHref ? (
                <a
                  href={communityHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white bg-transparent py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/5 active:bg-white/10"
                >
                  Ver la Comunidad{' '}
                  <span aria-hidden className="text-lg leading-none">
                    →
                  </span>
                </a>
              ) : (
                <p className="rounded-xl border border-dashed border-white/25 px-3 py-3 text-sm leading-snug text-neutral-400">
                  Configura{' '}
                  <code className="rounded bg-black/30 px-1 text-neutral-200">VITE_SA_COMMUNITY_URL</code> en{' '}
                  <code className="rounded bg-black/30 px-1 text-neutral-200">.env</code> para el enlace de la
                  comunidad.
                </p>
              )}
              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                className="w-full rounded-xl border border-white/40 bg-transparent py-3 text-[15px] font-medium text-white transition-colors hover:border-white/55 hover:bg-white/5"
              >
                Cerrar
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
