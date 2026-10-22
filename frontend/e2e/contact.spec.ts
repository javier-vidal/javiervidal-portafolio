import { Page, expect, test } from '@playwright/test';

const API_URL = 'http://localhost:8090/api/contact';

// Turnstile simulado: entrega un token al renderizar y otro nuevo despues de cada reset.
const FAKE_TURNSTILE = `
  window.turnstile = {
    render(el, opts) {
      this.opts = opts;
      setTimeout(() => {
        opts.callback('fake-token');
        el.textContent = 'Verificación simulada';
      }, 50);
      return 'widget-1';
    },
    reset() {
      window.__turnstileResets = (window.__turnstileResets || 0) + 1;
      setTimeout(() => this.opts.callback('fake-token-' + window.__turnstileResets), 50);
    },
    remove() {},
  };
`;

const CORS = {
  'Access-Control-Allow-Origin': 'http://localhost:4210',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Expose-Headers': 'Retry-After, X-Request-Id',
};

async function mockApi(page: Page, status: number, body: unknown, headers: Record<string, string> = {}) {
  const requests: Record<string, unknown>[] = [];
  await page.route(API_URL, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS });
    }
    requests.push(route.request().postDataJSON());
    return route.fulfill({
      status,
      headers: { ...CORS, ...headers },
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  return requests;
}

async function fillForm(page: Page, email = 'ana@example.com') {
  await page.getByLabel('Nombre').fill('Ana Pérez');
  await page.getByLabel('Correo', { exact: true }).fill(email);
  await page.getByLabel('Mensaje').fill('Hola, me gustaría conversar sobre un proyecto.');
  await expect(page.getByText('Verificación simulada')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: FAKE_TURNSTILE }),
  );
  await page.goto('/');
  await page.locator('#contacto').scrollIntoViewIfNeeded();
});

test('sends the message and shows a success message', async ({ page }) => {
  const requests = await mockApi(page, 200, { ok: true });
  await fillForm(page);
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect(page.getByRole('status')).toHaveText(/Gracias! Tu mensaje fue enviado/);
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    name: 'Ana Pérez',
    email: 'ana@example.com',
    website: '',
    turnstileToken: 'fake-token',
  });
  expect(typeof requests[0]['elapsedMs']).toBe('number');

  await expect(page.getByLabel('Nombre')).toHaveValue('');
  expect(await page.evaluate(() => (window as unknown as { __turnstileResets: number }).__turnstileResets)).toBe(1);
});

test('validates in the browser before calling the API', async ({ page }) => {
  const requests = await mockApi(page, 200, { ok: true });
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect(page.getByText('Escribe tu nombre.')).toBeVisible();
  await expect(page.getByText('Escribe tu correo.')).toBeVisible();
  await expect(page.getByLabel('Nombre')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Nombre')).toHaveAttribute('aria-describedby', 'contact-name-error');
  await expect(page.getByRole('status')).toHaveText(/Revisa los campos marcados/);
  expect(requests).toHaveLength(0);
});

test('shows field errors returned by the API', async ({ page }) => {
  await mockApi(page, 400, { error: { code: 'VALIDATION_ERROR', fields: { email: 'invalid' }, requestId: 'abc' } });
  await fillForm(page, 'ana@ejemplo.cl');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect(page.locator('#contact-email-error')).toHaveText(/Revisa el correo/);
  await expect(page.getByLabel('Correo', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('status')).not.toContainText('abc');
});

test('explains how long to wait when the limit is reached', async ({ page }) => {
  await mockApi(page, 429, { error: { code: 'RATE_LIMITED', requestId: 'abc' } }, { 'Retry-After': '600' });
  await fillForm(page);
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect(page.getByRole('status')).toHaveText(/Intenta de nuevo en 10 minutos/);
  await expect(page.getByRole('button', { name: 'Enviar mensaje' })).toBeEnabled();
});
