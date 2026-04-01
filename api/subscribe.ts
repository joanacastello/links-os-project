import { subscribeEmailToBeehiiv } from '../server/beehiivSubscribe';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type VercelReq = {
  method?: string;
  body?: unknown;
};

type VercelRes = {
  status: (code: number) => VercelRes;
  setHeader: (k: string, v: string) => void;
  json: (body: unknown) => void;
  end: (body?: string) => void;
};

export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const raw = req.body as { email?: string } | undefined;
  const email = typeof raw?.email === 'string' ? raw.email.trim() : '';
  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Correo no válido.' });
    return;
  }

  const result = await subscribeEmailToBeehiiv(email);
  if (!result.ok) {
    res.status(result.statusCode).json({ error: result.error });
    return;
  }

  res.status(200).json({ ok: true });
}
