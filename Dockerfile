# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22-alpine
ARG NGINX_VERSION=alpine

FROM node:${NODE_VERSION} AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm build

FROM nginx:${NGINX_VERSION} AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget --quiet --spider --tries=1 http://127.0.0.1/healthz || exit 1
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
