const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;
const CAPTCHA_MAX_LENGTH = 2_048;

export type SubscribePayload = {
  email: string;
  consent: true;
  captchaToken?: string;
  website?: string;
};

type ValidationSuccess = {
  ok: true;
  payload: SubscribePayload;
};

type ValidationFailure = {
  ok: false;
  statusCode: number;
  publicError: string;
  internalReason: string;
};

export type ValidationResult = ValidationSuccess | ValidationFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateSubscribePayload(raw: unknown): ValidationResult {
  if (!isRecord(raw)) {
    return {
      ok: false,
      statusCode: 400,
      publicError: 'Solicitud inválida.',
      internalReason: 'Body is not a JSON object',
    };
  }

  const allowedKeys = new Set(['email', 'consent', 'captchaToken', 'website']);
  const unknownKeys = Object.keys(raw).filter((k) => !allowedKeys.has(k));
  if (unknownKeys.length > 0) {
    return {
      ok: false,
      statusCode: 400,
      publicError: 'Solicitud inválida.',
      internalReason: `Unexpected fields: ${unknownKeys.join(', ')}`,
    };
  }

  const emailRaw = raw.email;
  const consentRaw = raw.consent;
  const captchaTokenRaw = raw.captchaToken;
  const websiteRaw = raw.website;

  const email = typeof emailRaw === 'string' ? normalizeEmail(emailRaw) : '';
  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_RE.test(email)) {
    return {
      ok: false,
      statusCode: 400,
      publicError: 'Correo no válido.',
      internalReason: 'Email failed format or length validation',
    };
  }

  if (consentRaw !== true) {
    return {
      ok: false,
      statusCode: 400,
      publicError: 'Debes aceptar la política de privacidad.',
      internalReason: 'Consent is not true',
    };
  }

  const website = typeof websiteRaw === 'string' ? websiteRaw.trim() : '';
  if (website) {
    return {
      ok: false,
      statusCode: 400,
      publicError: 'Solicitud inválida.',
      internalReason: 'Honeypot was filled',
    };
  }

  const captchaToken =
    typeof captchaTokenRaw === 'string' ? captchaTokenRaw.trim() : undefined;
  if (captchaToken && captchaToken.length > CAPTCHA_MAX_LENGTH) {
    return {
      ok: false,
      statusCode: 400,
      publicError: 'Solicitud inválida.',
      internalReason: 'Captcha token too long',
    };
  }

  return {
    ok: true,
    payload: {
      email,
      consent: true,
      captchaToken,
      website: website || undefined,
    },
  };
}
