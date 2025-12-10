FROM node:20-alpine

WORKDIR /app

# Install pnpm globally and ensure it's in PATH
RUN npm install -g pnpm@latest && \
    pnpm --version && \
    which pnpm

# Copy root package files first
COPY package.json pnpm-workspace.yaml tsconfig.json ./

# Copy lockfile if it exists (use shell to handle missing file gracefully)
COPY pnpm-lock.yaml* ./

# Copy shared modules
COPY shared ./shared

# Copy this service
COPY services/api-gateway ./services/api-gateway

# Install dependencies (allow pnpm to work without strict lockfile)
RUN pnpm install --no-frozen-lockfile

# Expose port
EXPOSE 3000

# Build shared modules first
RUN pnpm --filter "@retail-brain/*" build

# Build API Gateway
RUN pnpm --filter "@retail-brain/api-gateway" build

# Start service (use start for production, dev for development)
# Use sh -c to ensure pnpm is found in PATH
CMD ["sh", "-c", "pnpm --filter @retail-brain/api-gateway start"]

