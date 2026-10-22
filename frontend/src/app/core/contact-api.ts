export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  website: string;
  elapsedMs: number;
  turnstileToken: string;
}

export type ContactResult =
  | { ok: true }
  | { ok: false; code: string; fields?: Record<string, string>; retryAfterSeconds?: number };

/** Envia el mensaje a la API y traduce la respuesta a un resultado simple. Nunca lanza errores. */
export async function sendContact(
  apiUrl: string,
  payload: ContactPayload,
  fetchFn: typeof fetch = (input, init) => fetch(input, init),
): Promise<ContactResult> {
  let response: Response;
  try {
    response = await fetchFn(`${apiUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, code: 'NETWORK_ERROR' };
  }

  if (response.ok) {
    return { ok: true };
  }

  const body = await response.json().catch(() => null);
  const retryAfter = Number(response.headers.get('Retry-After'));
  return {
    ok: false,
    code: body?.error?.code ?? 'UNKNOWN_ERROR',
    fields: body?.error?.fields,
    retryAfterSeconds: retryAfter > 0 ? retryAfter : undefined,
  };
}
