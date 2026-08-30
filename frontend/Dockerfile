# syntax=docker/dockerfile:1
#
# Imagem do frontend (React + Vite). Multi-stage:
#   build   -> gera o bundle estático (dist/)
#   runtime -> serve o bundle com Nginx
#
# Importante: variáveis VITE_* são embutidas no bundle em tempo de BUILD (Vite
# não lê variáveis de ambiente em runtime). Por isso VITE_API_URL é um ARG do
# build, não uma variável de runtime do container Nginx. Para apontar para outra
# API, é necessário reconstruir a imagem com --build-arg VITE_API_URL=...

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
