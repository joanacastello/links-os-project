import { describe, expect, it } from 'vitest';
import { validateSubscribePayload } from './subscribeValidation';

describe('validateSubscribePayload', () => {
  it('accepts a valid payload', () => {
    const result = validateSubscribePayload({
      email: 'User@Example.com ',
      consent: true,
      captchaToken: 'token',
      website: '',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.email).toBe('user@example.com');
  });

  it('rejects payload with extra fields', () => {
    const result = validateSubscribePayload({
      email: 'user@example.com',
      consent: true,
      role: 'admin',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.statusCode).toBe(400);
  });

  it('rejects when consent is not true', () => {
    const result = validateSubscribePayload({
      email: 'user@example.com',
      consent: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.publicError).toContain('Debes aceptar');
  });

  it('rejects when honeypot field is filled', () => {
    const result = validateSubscribePayload({
      email: 'user@example.com',
      consent: true,
      website: 'https://spam.test',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.publicError).toBe('Solicitud inválida.');
  });

  it('rejects invalid email shape without regex', () => {
    const cases = ['nope', 'a@b', 'user@@example.com', 'user name@example.com'];
    for (const email of cases) {
      const result = validateSubscribePayload({
        email,
        consent: true,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.publicError).toBe('Correo no válido.');
    }
  });
});
