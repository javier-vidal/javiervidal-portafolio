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

// La site key es publica: Cloudflare la expone en el navegador. La clave secreta vive solo en Render.
const PRODUCTION: ContactConfig = {
  apiUrl: 'https://javiervidal-portafolio-api.onrender.com',
  turnstileSiteKey: '0x4AAAAAAFh2JDsSupKh3zLA',
};

/** En desarrollo (ng serve) usa la API local; en el build de produccion, la publicada. */
export function contactConfig(): ContactConfig {
  return isDevMode() ? LOCAL : PRODUCTION;
}
