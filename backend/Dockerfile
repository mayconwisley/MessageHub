# syntax=docker/dockerfile:1
#
# Imagem do backend (NestJS). Multi-stage:
#   deps    -> instala node_modules uma única vez (cache por package*.json)
#   build   -> compila TypeScript -> dist/
#   runtime -> imagem final que roda a API
#
# Nota importante: as migrations do TypeORM (`npm run migration:run`) rodam via
# ts-node contra os arquivos .ts em src/infrastructure/database (ver data-source.ts,
# que referencia os caminhos com glob relativo a "src/"). Por isso a imagem final
# mantém as devDependencies (typescript, ts-node, tsconfig-paths) e o diretório
# src/ - não é possível "podar" para node_modules só de produção sem reescrever
# esse mecanismo de migrations.

ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    NPM_CONFIG_CACHE=/tmp/.npm
WORKDIR /app

RUN addgroup -S messagehub && adduser -S messagehub -G messagehub

COPY --from=deps --chown=messagehub:messagehub /app/node_modules ./node_modules
COPY --from=build --chown=messagehub:messagehub /app/dist ./dist
COPY --chown=messagehub:messagehub package.json ./
COPY --chown=messagehub:messagehub tsconfig.json tsconfig.build.json ./
COPY --chown=messagehub:messagehub src ./src

USER messagehub

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/health/live',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main"]
