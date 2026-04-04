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

type BeehiivFailure = Extract<SubscribeResult, { ok: false }>;

type BeehiivRuntimeConfig = {
  apiBase: string;
  apiKey: string;
  publicationId: string;
  subscribeTag: string;
  utmSource: string;
  utmMedium: string;
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

function parseResponseJson(text: string): { ok: true; json: unknown } | BeehiivFailure {
  try {
    return { ok: true, json: text ? JSON.parse(text) : {} };
  } catch {
    return {
      ok: false,
      publicError: 'No se pudo completar la suscripción. Inténtalo más tarde.',
      internalReason: 'Beehiiv response invalid JSON',
      statusCode: 502,
    };
  }
}

function resolveBeehiivRuntimeConfig(env: Env): BeehiivRuntimeConfig | BeehiivFailure {
  const apiBase = normalizeApiBase(env.BEEHIIV_API_BASE);
  const apiKey = env.BEEHIIV_API_KEY?.trim() ?? '';
  const publicationId = env.BEEHIIV_PUBLICATION_ID?.trim() ?? '';
  const subscribeTag = env.BEEHIIV_SUBSCRIBE_TAG?.trim() ?? '';
  const utmSource = env.BEEHIIV_UTM_SOURCE?.trim() ?? '';
  const utmMedium = env.BEEHIIV_UTM_MEDIUM?.trim() ?? '';

  if (apiBase && apiKey && publicationId && subscribeTag) {
    return { apiBase, apiKey, publicationId, subscribeTag, utmSource, utmMedium };
  }

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

function beehiivHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function createBeehiivSubscription(
  email: string,
  cfg: BeehiivRuntimeConfig,
): Promise<{ subId: string } | BeehiivFailure> {
  const headers = beehiivHeaders(cfg.apiKey);
  let createRes: Response;
  try {
    createRes = await fetch(`${cfg.apiBase}/publications/${cfg.publicationId}/subscriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: true,
        double_opt_override: 'not_set',
        utm_source: cfg.utmSource,
        utm_medium: cfg.utmMedium,
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

  const parsed = parseResponseJson(await createRes.text());
  if (!parsed.ok) {
    return {
      ok: false,
      publicError: parsed.publicError,
      internalReason: 'Beehiiv create subscription returned invalid JSON',
      statusCode: parsed.statusCode,
    };
  }

  if (!createRes.ok) {
    const providerMsg =
      extractBeehiivError(parsed.json) ?? 'No se pudo completar la suscripción.';
    return {
      ok: false,
      publicError: 'No se pudo completar la suscripción. Inténtalo de nuevo.',
      internalReason: `Beehiiv create subscription failed. HTTP=${createRes.status}, provider=${providerMsg}`,
      statusCode: createRes.status >= 400 && createRes.status < 600 ? createRes.status : 500,
    };
  }

  const subId = (parsed.json as { data?: { id?: string } }).data?.id;
  if (!subId) {
    return {
      ok: false,
      publicError: 'No se pudo completar la suscripción. Inténtalo más tarde.',
      internalReason: 'Beehiiv create subscription response missing subscription id',
      statusCode: 502,
    };
  }

  return { subId };
}

async function assignBeehiivSubscriptionTag(
  cfg: BeehiivRuntimeConfig,
  subId: string,
): Promise<SubscribeResult> {
  const headers = beehiivHeaders(cfg.apiKey);
  let tagRes: Response;
  try {
    tagRes = await fetch(
      `${cfg.apiBase}/publications/${cfg.publicationId}/subscriptions/${subId}/tags`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ tags: [cfg.subscribeTag] }),
      },
    );
  } catch {
    return {
      ok: false,
      publicError: 'No se pudo completar la suscripción. Inténtalo más tarde.',
      internalReason: 'Beehiiv tag assignment network failure',
      statusCode: 502,
    };
  }

  if (tagRes.ok) {
    return { ok: true };
  }

  const tagParsed = parseResponseJson(await tagRes.text());
  const tagJson = tagParsed.ok ? tagParsed.json : {};
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

export async function subscribeEmailToBeehiiv(
  email: string,
  env: Env = process.env,
): Promise<SubscribeResult> {
  const cfg = resolveBeehiivRuntimeConfig(env);
  if (!('apiBase' in cfg)) {
    return cfg;
  }

  const created = await createBeehiivSubscription(email, cfg);
  if ('ok' in created) {
    return created;
  }

  return assignBeehiivSubscriptionTag(cfg, created.subId);
}
