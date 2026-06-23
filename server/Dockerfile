# syntax=docker/dockerfile:1

# --- Build stage: install all deps and compile TypeScript (src -> dist) ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
# drizzle.config.ts is needed by `db:push` (drizzle-kit) when this stage is
# reused as the compose `tools` service for one-off DB tasks (db:push / db:seed).
COPY drizzle.config.ts ./
RUN npm run build

# Pre-create the uploads dir owned by `node` here too — this stage is reused as
# the compose `tools` service, whose `db:seed` writes local-driver photos. Matching
# the runtime stage's ownership makes the shared uploads-data volume initialize as
# node:node no matter which service mounts it first (order-independent).
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# --- Runtime stage: production deps + compiled output only ---
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Swagger UI loads this spec at runtime (when ENABLE_API_DOCS=true). It lives at
# the cwd (/app) because express.static("openapi.json") resolves relative to it.
COPY openapi.json ./

# Local storage driver writes uploads here (UPLOAD_DIR defaults to "uploads",
# i.e. /app/uploads). /app is root-owned, so pre-create the dir owned by the
# runtime user; a named volume mounted here in compose inherits this ownership.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Run as the image's built-in non-root user.
USER node

# PORT is read at runtime (defaults to 3000 in the app); EXPOSE is documentation.
EXPOSE 3000
CMD ["node", "dist/index.js"]
