export type SubscribeResult =
  | { ok: true }
  | {
      ok: false;
      publicError: string;
      internalReason: string;
      statusCode: number;
    };

/** Variables leídas solo desde el entorno (.env / panel del host). */
type Env = {
  BEEHIIV_API_BASE?: string;
  BEEHIIV_API_KEY?: string;
  BEEHIIV_PUBLICATION_ID?: string;
  BEEHIIV_SUBSCRIBE_TAG?: string;
  BEEHIIV_UTM_SOURCE?: string;
  BEEHIIV_UTM_MEDIUM?: string;
};

const DEFAULT_BEEHIIV_API_BASE = 'https://api.beehiiv.com/v2';

function normalizeApiBase(raw: string | undefined): string {
  const value = raw?.trim() || DEFAULT_BEEHIIV_API_BASE;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'api.beehiiv.com') {
      return '';
    }
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return '';
  }
}

function extractBeehiivError(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const errs = (body as { errors?: Array<{ message?: string }> }).errors;
  if (Array.isArray(errs) && errs[0]?.message) return errs[0].message;
  return undefined;
}

export async function subscribeEmailToBeehiiv(
  email: string,
  env: Env = process.env,
): Promise<SubscribeResult> {
  const apiBase = normalizeApiBase(env.BEEHIIV_API_BASE);
  const apiKey = env.BEEHIIV_API_KEY?.trim() ?? '';
  const publicationId = env.BEEHIIV_PUBLICATION_ID?.trim() ?? '';
  const subscribeTag = env.BEEHIIV_SUBSCRIBE_TAG?.trim() ?? '';
  const utmSource = env.BEEHIIV_UTM_SOURCE?.trim() ?? '';
  const utmMedium = env.BEEHIIV_UTM_MEDIUM?.trim() ?? '';

  if (!apiBase || !apiKey || !publicationId || !subscribeTag) {
    const missing: string[] = [];
    if (!apiBase) missing.push('BEEHIIV_API_BASE');
    if (!apiKey) missing.push('BEEHIIV_API_KEY');
    if (!publicationId) missing.push('BEEHIIV_PUBLICATION_ID');
    if (!subscribeTag) missing.push('BEEHIIV_SUBSCRIBE_TAG');
    return {
      ok: false,
      publicError: 'Servicio de newsletter no disponible en este momento.',
      internalReason: `Missing Beehiiv env vars: ${missing.join(', ')}`,
      statusCode: 503,
    };
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  let createRes: Response;
  try {
    createRes = await fetch(`${apiBase}/publications/${publicationId}/subscriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: true,
        double_opt_override: 'not_set',
        utm_source: utmSource,
        utm_medium: utmMedium,
      }),
    });
  } catch {
    return {
      ok: false,
      publicError: 'No se pudo completar la suscripción. Inténtalo más tarde.',
      internalReason: 'Beehiiv create subscription network failure',
      statusCode: 502,
    };
  }

  const createText = await createRes.text();
  let createJson: unknown;
  try {
    createJson = createText ? JSON.parse(createText) : {};
  } catch {
    return {
      ok: false,
      publicError: 'No se pudo completar la suscripción. Inténtalo más tarde.',
      internalReason: 'Beehiiv create subscription returned invalid JSON',
      statusCode: 502,
    };
  }

  if (!createRes.ok) {
    const providerMsg =
      extractBeehiivError(createJson) ?? 'No se pudo completar la suscripción.';
    return {
      ok: false,
      publicError: 'No se pudo completar la suscripción. Inténtalo de nuevo.',
      internalReason: `Beehiiv create subscription failed. HTTP=${createRes.status}, provider=${providerMsg}`,
      statusCode: createRes.status >= 400 && createRes.status < 600 ? createRes.status : 500,
    };
  }

  const subId = (createJson as { data?: { id?: string } }).data?.id;
  if (!subId) {
    return {
      ok: false,
      publicError: 'No se pudo completar la suscripción. Inténtalo más tarde.',
      internalReason: 'Beehiiv create subscription response missing subscription id',
      statusCode: 502,
    };
  }

  let tagRes: Response;
  try {
    tagRes = await fetch(`${apiBase}/publications/${publicationId}/subscriptions/${subId}/tags`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tags: [subscribeTag] }),
    });
  } catch {
    return {
      ok: false,
      publicError: 'No se pudo completar la suscripción. Inténtalo más tarde.',
      internalReason: 'Beehiiv tag assignment network failure',
      statusCode: 502,
    };
  }

  if (!tagRes.ok) {
    const tagText = await tagRes.text();
    let tagJson: unknown;
    try {
      tagJson = tagText ? JSON.parse(tagText) : {};
    } catch {
      tagJson = {};
    }
    const msg =
      extractBeehiivError(tagJson) ??
      'Suscripción creada, pero no se pudo aplicar la etiqueta.';
    return {
      ok: false,
      publicError: 'No se pudo completar la suscripción. Inténtalo de nuevo.',
      internalReason: `Beehiiv tag assignment failed. HTTP=${tagRes.status}, provider=${msg}`,
      statusCode: tagRes.status,
    };
  }

  return { ok: true };
}
