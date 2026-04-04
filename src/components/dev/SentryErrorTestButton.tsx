/**
 * Solo en desarrollo: lanza un error para comprobar que Sentry lo recibe.
 * No se renderiza en build de producción.
 */
export default function SentryErrorTestButton() {
  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      onClick={() => {
        throw new Error('This is your first error!');
      }}
      className="fixed bottom-3 left-3 z-[9999] rounded-lg border border-red-500/80 bg-red-950/90 px-3 py-2 font-sans text-xs font-medium text-red-100 shadow-lg backdrop-blur-sm hover:bg-red-900/90"
    >
      Break the world (Sentry test)
    </button>
  );
}
