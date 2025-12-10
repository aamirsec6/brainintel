FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files
COPY package.json pnpm-workspace.yaml ./
# Copy lockfile if it exists
COPY pnpm-lock.yaml* ./
# Copy TypeScript config needed for builds
COPY tsconfig.json ./

# Copy shared modules
COPY shared ./shared

# Copy this service
COPY services/event-collector ./services/event-collector

# Install dependencies (without frozen-lockfile for Railway compatibility)
RUN pnpm install

# Expose port
EXPOSE 3001

# Build shared modules first
RUN pnpm --filter "@retail-brain/*" build

# Build Event Collector
RUN pnpm --filter "@retail-brain/event-collector" build

# Start service (use start for production, dev for development)
CMD ["pnpm", "--filter", "@retail-brain/event-collector", "start"]

