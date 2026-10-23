import { ContactPayload, SEND_TIMEOUT_MS, sendContact, wakeApi } from './contact-api';

const payload: ContactPayload = {
  name: 'Ana Pérez',
  email: 'ana@example.com',
  message: 'Hola, quiero conversar.',
  website: '',
  elapsedMs: 5000,
  turnstileToken: 'token',
};

function respond(status: number, body: unknown, headers: Record<string, string> = {}): typeof fetch {
  return async () => new Response(JSON.stringify(body), { status, headers });
}

describe('sendContact', () => {
  it('posts the payload as JSON', async () => {
    let request: RequestInit | undefined;
    let url = '';
    const fetchFn: typeof fetch = async (input, init) => {
      url = String(input);
      request = init;
      return new Response('{"ok":true}', { status: 200 });
    };

    expect(await sendContact('http://localhost:8090', payload, fetchFn)).toEqual({ ok: true });
    expect(url).toBe('http://localhost:8090/api/contact');
    expect(request?.method).toBe('POST');
    expect(JSON.parse(String(request?.body))).toEqual(payload);
  });

  it('returns the code and fields of a validation error', async () => {
    const fetchFn = respond(400, { error: { code: 'VALIDATION_ERROR', fields: { email: 'invalid' }, requestId: 'x' } });
    expect(await sendContact('', payload, fetchFn)).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
      fields: { email: 'invalid' },
      retryAfterSeconds: undefined,
    });
  });

  it('reads Retry-After when the limit is reached', async () => {
    const fetchFn = respond(429, { error: { code: 'RATE_LIMITED' } }, { 'Retry-After': '600' });
    const result = await sendContact('', payload, fetchFn);
    expect(result).toMatchObject({ ok: false, code: 'RATE_LIMITED', retryAfterSeconds: 600 });
  });

  it('handles responses that are not JSON', async () => {
    const fetchFn: typeof fetch = async () => new Response('Bad Gateway', { status: 502 });
    expect(await sendContact('', payload, fetchFn)).toMatchObject({ ok: false, code: 'UNKNOWN_ERROR' });
  });

  it('reports a network error when the request fails', async () => {
    const fetchFn: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await sendContact('', payload, fetchFn)).toEqual({ ok: false, code: 'NETWORK_ERROR' });
  });

  it('gives up after a timeout long enough for a cold start', async () => {
    let signal: AbortSignal | null | undefined;
    const fetchFn: typeof fetch = async (_input, init) => {
      signal = init?.signal;
      throw new DOMException('The operation timed out.', 'TimeoutError');
    };
    expect(await sendContact('', payload, fetchFn)).toEqual({ ok: false, code: 'TIMEOUT' });
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(SEND_TIMEOUT_MS).toBeGreaterThanOrEqual(60_000);
  });
});

describe('wakeApi', () => {
  it('calls the health endpoint and ignores failures', async () => {
    const urls: string[] = [];
    const fetchFn: typeof fetch = async (input) => {
      urls.push(String(input));
      throw new TypeError('Failed to fetch');
    };
    expect(() => wakeApi('http://localhost:8090', fetchFn)).not.toThrow();
    await Promise.resolve();
    expect(urls).toEqual(['http://localhost:8090/api/health']);
  });
});
