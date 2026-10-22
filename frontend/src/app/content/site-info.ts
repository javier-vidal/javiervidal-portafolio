export interface SiteDetail {
  label: string;
  text: string;
}

export interface LighthouseScore {
  label: string;
  score: number | null;
}

export const SITE_SECTION = {
  title: 'Bajo el capó',
  intro: 'Para los curiosos: así está construido este sitio.',
};

export const SITE_DETAILS: SiteDetail[] = [
  {
    label: 'Frontend',
    text: 'Angular 22 con componentes standalone y signals, TypeScript y CSS sin frameworks de estilos.',
  },
  {
    label: 'Rendimiento',
    text: 'Cada página se prerenderiza al compilar, así que el contenido llega listo al navegador, sin esperar a que cargue JavaScript.',
  },
  {
    label: 'Accesibilidad',
    text: 'Se adapta al modo oscuro del sistema y respeta la preferencia de reducir movimiento.',
  },
  {
    label: 'Calidad',
    text: 'Pruebas unitarias con Vitest y pruebas de extremo a extremo con Playwright, en escritorio y móvil.',
  },
  {
    label: 'Infraestructura',
    text: 'Publicado en Cloudflare Pages, con despliegue automático desde GitHub en cada cambio a la rama principal. En desarrollo, todo corre en contenedores con Docker.',
  },
];

// Un puntaje en null se muestra como pendiente.
export const LIGHTHOUSE_SCORES: LighthouseScore[] = [
  { label: 'Rendimiento', score: 100 },
  { label: 'Accesibilidad', score: 100 },
  { label: 'Buenas prácticas', score: 100 },
  { label: 'SEO', score: 100 },
];

export const LIGHTHOUSE_NOTE = 'Medido con PageSpeed Insights en móvil y escritorio · octubre 2026';

export const PAGESPEED_LINK = {
  label: 'Compruébalo tú mismo',
  href: 'https://pagespeed.web.dev/analysis?url=https://javiervidal.cl',
};

export const REPO_LINK = {
  label: 'Ver el código en GitHub',
  href: 'https://github.com/javier-vidal/javiervidal-portafolio',
};
