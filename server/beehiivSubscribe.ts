export type SubscribeResult =
  | { ok: true }
  | { ok: false; error: string; statusCode: number };

/** Variables leídas solo desde el entorno (.env / panel del host). */
type Env = {
  BEEHIIV_API_BASE?: string;
  BEEHIIV_API_KEY?: string;
  BEEHIIV_PUBLICATION_ID?: string;
  BEEHIIV_SUBSCRIBE_TAG?: string;
  BEEHIIV_UTM_SOURCE?: string;
  BEEHIIV_UTM_MEDIUM?: string;
};

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
  const apiBase = env.BEEHIIV_API_BASE?.trim().replace(/\/$/, '') ?? '';
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
      error: `Newsletter sin configurar. Falta: ${missing.join(', ')}. Añádelos en .env (raíz del proyecto) y reinicia el servidor (npm run dev) o configúralos en el panel de tu hosting.`,
      statusCode: 503,
    };
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const createRes = await fetch(
    `${apiBase}/publications/${publicationId}/subscriptions`,
    {
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
    },
  );

  const createText = await createRes.text();
  let createJson: unknown;
  try {
    createJson = createText ? JSON.parse(createText) : {};
  } catch {
    return {
      ok: false,
      error: 'Respuesta inválida del servicio de newsletter.',
      statusCode: 502,
    };
  }

  if (!createRes.ok) {
    const msg =
      extractBeehiivError(createJson) ?? 'No se pudo completar la suscripción.';
    return {
      ok: false,
      error: msg,
      statusCode: createRes.status >= 400 && createRes.status < 600 ? createRes.status : 500,
    };
  }

  const subId = (createJson as { data?: { id?: string } }).data?.id;
  if (!subId) {
    return {
      ok: false,
      error: 'Respuesta incompleta del servicio de newsletter.',
      statusCode: 502,
    };
  }

  const tagRes = await fetch(
    `${apiBase}/publications/${publicationId}/subscriptions/${subId}/tags`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ tags: [subscribeTag] }),
    },
  );

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
    return { ok: false, error: msg, statusCode: tagRes.status };
  }

  return { ok: true };
}
