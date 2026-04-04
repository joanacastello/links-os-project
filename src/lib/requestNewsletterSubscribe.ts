export type NewsletterSubscribeOutcome =
  | { ok: true }
  | { ok: false; error: string };

type NewsletterSubscribeRequest = {
  email: string;
  consent: boolean;
  website?: string;
};

export async function requestNewsletterSubscribe(
  payload: NewsletterSubscribeRequest,
): Promise<NewsletterSubscribeOutcome> {
  const res = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data: { error?: string } = {};
  try {
    data = (await res.json()) as { error?: string };
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    return {
      ok: false,
      error: data.error ?? 'No se pudo completar la suscripción. Inténtalo de nuevo.',
    };
  }

  return { ok: true };
}
