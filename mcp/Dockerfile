FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist
COPY generated ./generated
COPY config.json ./config.json

EXPOSE 3100
ENV LOG_LEVEL=info
ENTRYPOINT ["node", "dist/index.js", "--transport", "http"]
