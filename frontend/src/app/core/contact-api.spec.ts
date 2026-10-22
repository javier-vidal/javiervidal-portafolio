import { ContactPayload, sendContact } from './contact-api';

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
});
