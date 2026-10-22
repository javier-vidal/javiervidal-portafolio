# Imagen solo para desarrollo local. Produccion usa Cloudflare Pages.
FROM node:24-alpine

WORKDIR /app

RUN npm install -g pnpm@12.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 4210
CMD ["pnpm", "exec", "ng", "serve", "--host", "0.0.0.0"]
