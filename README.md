# javiervidal.cl

Portafolio personal de Javier Vidal, Full Stack Developer.

- `frontend/`: Angular 22 con prerenderizado (SSG), publicado en Cloudflare Pages.
- `backend/`: API de contacto en Go (próximamente).

## Requisitos

- Node 24 (definido en `.nvmrc`) y pnpm 12.15.0.
- Docker, opcional, para levantar todo con Docker Compose.

## Desarrollo local

Con Node:

```bash
nvm use
cd frontend
pnpm install
pnpm start          # http://localhost:4210
```

Con Docker Compose, desde la raíz:

```bash
docker compose up --build   # http://localhost:4210
```

## Pruebas y build

Desde `frontend/`:

```bash
pnpm test           # Pruebas unitarias (Vitest)
pnpm e2e            # Pruebas e2e (Playwright)
pnpm build          # HTML estático en dist/frontend/browser
```

La primera vez, antes de `pnpm e2e`, instala el navegador con `pnpm exec playwright install chromium`.
