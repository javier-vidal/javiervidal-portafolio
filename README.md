# javiervidal.cl

Portafolio personal de Javier Vidal, Full Stack Developer.

- `frontend/`: Angular 22 con prerenderizado (SSG), publicado en Cloudflare Pages.
- `backend/`: API de contacto en Go (solo biblioteca estándar), publicada en Render.

## Requisitos

- Node 24 (definido en `.nvmrc`) y pnpm 12.15.0.
- Go 1.27.
- Docker, opcional, para levantar todo con Docker Compose.

## Desarrollo local

Antes del primer arranque, crea la configuración local de la API:

```bash
cp backend/.env.example backend/.env
```

Con Node y Go, en dos terminales:

```bash
# API: http://localhost:8090
cd backend
set -a && source .env && set +a && go run .

# Frontend: http://localhost:4210
nvm use
cd frontend
pnpm install
pnpm start
```

Con Docker Compose, desde la raíz:

```bash
docker compose up --build   # frontend en 4210 y API en 8090
docker compose watch        # además reconstruye la API al guardar cambios
```

## Pruebas y build

Desde `frontend/`:

```bash
pnpm test           # Pruebas unitarias (Vitest)
pnpm e2e            # Pruebas e2e (Playwright)
pnpm build          # HTML estático en dist/frontend/browser
```

La primera vez, antes de `pnpm e2e`, instala el navegador con `pnpm exec playwright install chromium`.

Desde `backend/`:

```bash
go test ./...       # Pruebas unitarias de la API
```

## API de contacto

- `POST /api/contact`: recibe el mensaje del formulario y lo envía por correo con Resend.
- `GET /api/health`: health check de Render; el frontend también lo usa para despertar la API,
  que en el plan gratuito se duerme tras 15 minutos sin uso.
