import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('shows the greeting and the six sections', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Hola, soy Javier Vidal' })).toBeVisible();
  for (const name of ['Entrenamiento', 'La ruta', 'La carta', '¿Conversamos?', 'Bajo el capó']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeAttached();
  }
});

test('expands the early days of the route', async ({ page }) => {
  const toggle = page.getByRole('button', { name: /Los inicios/ });
  await expect(page.getByRole('heading', { name: 'Envision' })).toHaveCount(0);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('heading', { name: 'Envision' })).toBeVisible();
});

test('the day turns into night when scrolling to the end', async ({ page }) => {
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-phase', 'sunrise');
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await expect(html).toHaveAttribute('data-phase', 'night');
});
