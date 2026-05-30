# ---------- Stage 1: build the React SPA ----------
FROM node:20-alpine AS web-builder
WORKDIR /app/web

# Install web deps using lockfile when available for reproducible builds.
COPY web/package.json web/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest of the web source and build.
COPY web/ ./
RUN npm run build

# ---------- Stage 2: install server production deps ----------
FROM node:20-alpine AS server-deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# ---------- Stage 3: runtime image ----------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Server runtime deps
COPY --from=server-deps /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./

# Built SPA served by Express from web/dist
COPY --from=web-builder /app/web/dist ./web/dist

EXPOSE 3000

# Basic healthcheck — hits the SPA index (always 200 once server is up).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

USER node
CMD ["node", "server.js"]
