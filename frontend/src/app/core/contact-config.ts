import { isDevMode } from '@angular/core';

export interface ContactConfig {
  apiUrl: string;
  turnstileSiteKey: string;
}

// Clave de prueba oficial de Cloudflare que siempre aprueba.
const LOCAL: ContactConfig = {
  apiUrl: 'http://localhost:8090',
  turnstileSiteKey: '1x00000000000000000000AA',
};

// TODO: Reemplazar al desplegar con la URL de Cloud Run y la site key real de Turnstile.
const PRODUCTION: ContactConfig = {
  apiUrl: 'https://REEMPLAZAR-API.run.app',
  turnstileSiteKey: 'REEMPLAZAR-SITE-KEY',
};

/** En desarrollo (ng serve) usa la API local; en el build de produccion, la publicada. */
export function contactConfig(): ContactConfig {
  return isDevMode() ? LOCAL : PRODUCTION;
}
