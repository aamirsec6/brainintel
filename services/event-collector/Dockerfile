FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files first
COPY package.json pnpm-workspace.yaml tsconfig.json ./

# Copy lockfile explicitly (if it exists, great; if not, pnpm will generate it)
COPY pnpm-lock.yaml ./

# Copy shared modules
COPY shared ./shared

# Copy this service
COPY services/event-collector ./services/event-collector

# Install dependencies (pnpm will work with or without lockfile)
RUN pnpm install --no-frozen-lockfile || pnpm install

# Expose port
EXPOSE 3001

# Build shared modules first
RUN pnpm --filter "@retail-brain/*" build

# Build Event Collector
RUN pnpm --filter "@retail-brain/event-collector" build

# Start service (use start for production, dev for development)
CMD ["pnpm", "--filter", "@retail-brain/event-collector", "start"]

