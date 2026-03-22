FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY src ./src
COPY generated ./generated
COPY config.json ./config.json
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY --from=build /app/config.json ./config.json

EXPOSE 3100
ENV LOG_LEVEL=info
ENTRYPOINT ["node", "dist/index.js", "--transport", "http"]
