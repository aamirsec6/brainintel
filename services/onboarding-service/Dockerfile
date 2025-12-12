# Dockerfile for Onboarding Service
# Build context: repository root
# Usage: docker build -f services/onboarding-service/Dockerfile .

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
COPY services/onboarding-service ./services/onboarding-service

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build shared modules first
RUN pnpm --filter "@retail-brain/*" build

# Build Onboarding Service
RUN pnpm --filter "@retail-brain/onboarding-service" build

# Set working directory to the service folder for runtime
WORKDIR /app/services/onboarding-service

# Expose port
EXPOSE 3005

# Start service
CMD ["node", "dist/index.js"]

