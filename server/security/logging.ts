import { createHash } from 'node:crypto';

type SecurityEvent = Record<string, unknown>;

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

export function anonymize(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return hashValue(trimmed);
}

export function logSecurityEvent(event: string, details: SecurityEvent): void {
  const payload = {
    type: 'security',
    event,
    at: new Date().toISOString(),
    ...details,
  };
  console.info(JSON.stringify(payload));
}
