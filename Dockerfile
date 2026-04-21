# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: test runner ──────────────────────────────────────────────────────
# mcr.microsoft.com/playwright ships all three browsers + OS dependencies
FROM mcr.microsoft.com/playwright:v1.59.1-noble AS runner

WORKDIR /app

# Copy pre-built node_modules from Stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Runtime configuration — overridable at docker run time via -e
ENV BASE_URL=https://demoqa.com
ENV CI=true

CMD ["npx", "playwright", "test"]
