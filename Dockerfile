FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/env.template.js /etc/nginx/helix/env.template.js
COPY nginx/docker-entrypoint.d/30-render-helix-env.sh /docker-entrypoint.d/30-render-helix-env.sh
RUN chmod +x /docker-entrypoint.d/30-render-helix-env.sh
COPY --from=build /app/dist/atoll/browser /usr/share/nginx/html

EXPOSE 8000
