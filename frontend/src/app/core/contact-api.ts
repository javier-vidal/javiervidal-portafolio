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

// Render duerme la API tras 15 minutos sin uso y tarda cerca de un minuto en despertar.
export const SEND_TIMEOUT_MS = 90_000;

const defaultFetch: typeof fetch = (input, init) => fetch(input, init);

/** Envia el mensaje a la API y traduce la respuesta a un resultado simple. Nunca lanza errores. */
export async function sendContact(
  apiUrl: string,
  payload: ContactPayload,
  fetchFn: typeof fetch = defaultFetch,
): Promise<ContactResult> {
  let response: Response;
  try {
    response = await fetchFn(`${apiUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    return { ok: false, code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR' };
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

/** Despierta la API con una peticion liviana; si falla no importa, el envio lo intentara igual. */
export function wakeApi(apiUrl: string, fetchFn: typeof fetch = defaultFetch): void {
  fetchFn(`${apiUrl}/api/health`, { cache: 'no-store' }).catch(() => undefined);
}
