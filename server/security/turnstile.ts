type TurnstileEnv = {
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_EXPECTED_HOSTNAME?: string;
};

export type TurnstileResult =
  | { ok: true; skipped: boolean }
  | {
      ok: false;
      statusCode: number;
      publicError: string;
      internalReason: string;
    };

type SiteVerifyResponse = {
  success?: boolean;
  hostname?: string;
  'error-codes'?: string[];
};

export async function verifyTurnstileToken(params: {
  token: string | undefined;
  remoteIp: string | undefined;
  env?: TurnstileEnv;
}): Promise<TurnstileResult> {
  const env = params.env ?? process.env;
  const secret = env.TURNSTILE_SECRET_KEY?.trim() ?? '';
  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (!params.token) {
    return {
      ok: false,
      statusCode: 400,
      publicError: 'Completa la verificación anti-bot.',
      internalReason: 'Missing captcha token while Turnstile is enabled',
    };
  }

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', params.token);
  if (params.remoteIp) {
    body.set('remoteip', params.remoteIp);
  }

  let response: Response;
  try {
    response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      },
    );
  } catch {
    return {
      ok: false,
      statusCode: 502,
      publicError: 'No se pudo verificar la solicitud. Inténtalo de nuevo.',
      internalReason: 'Turnstile network request failed',
    };
  }

  let data: SiteVerifyResponse = {};
  try {
    data = (await response.json()) as SiteVerifyResponse;
  } catch {
    return {
      ok: false,
      statusCode: 502,
      publicError: 'No se pudo verificar la solicitud. Inténtalo de nuevo.',
      internalReason: 'Turnstile response is not valid JSON',
    };
  }

  if (!response.ok || data.success !== true) {
    return {
      ok: false,
      statusCode: 403,
      publicError: 'La verificación anti-bot ha fallado.',
      internalReason: `Turnstile rejected token. HTTP=${response.status}, codes=${(data['error-codes'] ?? []).join('|')}`,
    };
  }

  const expectedHostname = env.TURNSTILE_EXPECTED_HOSTNAME?.trim();
  if (expectedHostname && data.hostname !== expectedHostname) {
    return {
      ok: false,
      statusCode: 403,
      publicError: 'La verificación anti-bot ha fallado.',
      internalReason: `Turnstile hostname mismatch. expected=${expectedHostname}, actual=${data.hostname ?? 'none'}`,
    };
  }

  return { ok: true, skipped: false };
}
