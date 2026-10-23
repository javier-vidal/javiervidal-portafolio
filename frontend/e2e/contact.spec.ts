import { Page, expect, test } from '@playwright/test';

const API_URL = 'http://localhost:8090/api/contact';
const HEALTH_URL = 'http://localhost:8090/api/health';

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

async function mockApi(
  page: Page,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
  delayMs = 0,
) {
  const requests: Record<string, unknown>[] = [];
  await page.route(API_URL, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS });
    }
    requests.push(route.request().postDataJSON());
    await new Promise((resolve) => setTimeout(resolve, delayMs));
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

let healthChecks = 0;

test.beforeEach(async ({ page }) => {
  healthChecks = 0;
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: FAKE_TURNSTILE }),
  );
  await page.route(HEALTH_URL, (route) => {
    healthChecks++;
    return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: '{"status":"ok"}' });
  });
  await page.goto('/');
  await page.locator('#contacto').scrollIntoViewIfNeeded();
});

test('offers LinkedIn first, before the form', async ({ page }) => {
  const linkedin = page.getByRole('link', { name: /Escríbeme por LinkedIn/ });
  await expect(linkedin).toBeVisible();
  await expect(linkedin).toHaveAttribute('href', /linkedin\.com\/in\//);
  await expect(linkedin).toHaveAttribute('target', '_blank');
  await expect(page.getByRole('heading', { name: '¿Prefieres escribirme directo?' })).toBeVisible();

  const linkedinFirst = await page.evaluate(() => {
    const link = document.querySelector('#contacto a.linkedin');
    const form = document.querySelector('#contacto form');
    return !!link && !!form && !!(link.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(linkedinFirst).toBe(true);
  await expect(page.getByRole('link', { name: 'dev@javiervidal.cl' })).toBeVisible();
});

test('suggests LinkedIn when the daily limit is reached', async ({ page }) => {
  await mockApi(page, 429, { error: { code: 'DAILY_LIMIT_REACHED', requestId: 'abc' } });
  await fillForm(page);
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect(page.getByRole('status')).toHaveText(/Escríbeme por LinkedIn/);
  await expect(page.getByRole('status')).not.toContainText('DAILY_LIMIT_REACHED');
});

test('wakes the API once when the contact section appears', async ({ page }) => {
  await expect.poll(() => healthChecks).toBe(1);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.locator('#contacto').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect(healthChecks).toBe(1);
});

test('tells the visitor to wait when the API is slow to answer', async ({ page }) => {
  await mockApi(page, 200, { ok: true }, {}, 4500);
  await fillForm(page);
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect(page.getByRole('status')).toHaveText(/Enviando, puede tardar unos segundos/);
  await expect(page.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText(/Gracias!/, { timeout: 10_000 });
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
