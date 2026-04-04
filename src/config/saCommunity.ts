/** URL pública de la comunidad: solo `VITE_SA_COMMUNITY_URL` en `.env`. */
export function normalizePublicHttpsUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return '';

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

export const SA_COMMUNITY_EXTERNAL_URL: string = normalizePublicHttpsUrl(
  import.meta.env.VITE_SA_COMMUNITY_URL ?? '',
);
