const EMAIL_MAX_LENGTH = 254;
const EMAIL_LOCAL_MAX_LENGTH = 64;
const EMAIL_DOMAIN_MAX_LENGTH = 253;

/** Formato razonable para newsletter, sin regex (evita avisos ReDoS en análisis estático). */
export function isValidSubscribeEmailFormat(email: string): boolean {
  if (email.length === 0 || email.length > EMAIL_MAX_LENGTH) return false;
  for (let i = 0; i < email.length; ) {
    const code = email.codePointAt(i);
    if (code === undefined || code <= 32) return false;
    i += code > 0xffff ? 2 : 1;
  }
  const at = email.indexOf('@');
  if (at <= 0) return false;
  if (email.includes('@', at + 1)) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (
    local.length === 0 ||
    local.length > EMAIL_LOCAL_MAX_LENGTH ||
    domain.length === 0 ||
    domain.length > EMAIL_DOMAIN_MAX_LENGTH
  ) {
    return false;
  }
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  if (!domain.includes('.')) return false;
  const labels = domain.split('.');
  return !labels.some((label) => label.length === 0);
}

export type SubscribePayload = {
  email: string;
  consent: true;
  website?: string;
};

type ValidationSuccess = {
  ok: true;
  payload: SubscribePayload;
};

export type ValidationFailure = {
  ok: false;
  statusCode: number;
  publicError: string;
  internalReason: string;
};

export type ValidationResult = ValidationSuccess | ValidationFailure;

export function isValidationFailure(r: ValidationResult): r is ValidationFailure {
  return r.ok === false;
}

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

  const allowedKeys = new Set(['email', 'consent', 'website']);
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
  const websiteRaw = raw.website;

  const email = typeof emailRaw === 'string' ? normalizeEmail(emailRaw) : '';
  if (!email || !isValidSubscribeEmailFormat(email)) {
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
      publicError: 'Debes aceptar el consentimiento para recibir el boletín.',
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

  return {
    ok: true,
    payload: {
      email,
      consent: true,
      website: website || undefined,
    },
  };
}
