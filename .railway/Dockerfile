# Railway will use this Dockerfile when deploying from root
# This is a fallback - Railway should detect Dockerfile.api-gateway

FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@latest

# Copy root package files first (these must be in build context)
COPY package.json pnpm-workspace.yaml tsconfig.json ./
COPY pnpm-lock.yaml* ./

# Copy shared modules
COPY shared ./shared

# Copy this service
COPY services/api-gateway ./services/api-gateway

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build shared modules first
RUN pnpm --filter "@retail-brain/*" build

# Build API Gateway
RUN pnpm --filter "@retail-brain/api-gateway" build

# Set working directory to the service folder for runtime
WORKDIR /app/services/api-gateway

# Expose port
EXPOSE 3000

# Start service
CMD ["node", "dist/index.js"]

