# syntax=docker/dockerfile:1
#
# Imagem do backend (NestJS). Multi-stage:
#   deps    -> instala node_modules uma única vez (cache por package*.json)
#   build   -> compila TypeScript -> dist/
#   runtime -> imagem final que roda a API
#
# Migrations TypeScript exigem src/ e ts-node; por isso existe um target
# `migration` separado. A imagem `runtime` fica somente com dist/ e dependências
# de produção, reduzindo tamanho e superfície de ataque.

ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM deps AS production-deps
RUN npm prune --omit=dev

FROM build AS migration
ENV NODE_ENV=production
RUN addgroup -S messagehub && adduser -S messagehub -G messagehub
USER messagehub

FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    NPM_CONFIG_CACHE=/tmp/.npm
WORKDIR /app

RUN addgroup -S messagehub && adduser -S messagehub -G messagehub

COPY --from=production-deps --chown=messagehub:messagehub /app/node_modules ./node_modules
COPY --from=build --chown=messagehub:messagehub /app/dist ./dist
COPY --chown=messagehub:messagehub package.json ./

USER messagehub

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/health/live',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main"]
