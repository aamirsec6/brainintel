# Dockerfile for Profile Service
# Build context: repository root
# Usage: docker build -f services/profile-service/Dockerfile .

FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@latest

# Copy root package files
COPY package.json pnpm-workspace.yaml tsconfig.json ./
COPY pnpm-lock.yaml* ./

# Copy shared modules
COPY shared ./shared

# Copy this service
COPY services/profile-service ./services/profile-service

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build shared modules first
RUN pnpm --filter "@retail-brain/*" build

# Build Profile Service
RUN pnpm --filter "@retail-brain/profile-service" build

# Set working directory to the service folder for runtime
WORKDIR /app/services/profile-service

# Expose port
EXPOSE 3003

# Start service
CMD ["node", "dist/index.js"]

