FROM node:20-alpine

WORKDIR /app

# Install pnpm globally and ensure it's in PATH
RUN npm install -g pnpm@latest && \
    pnpm --version && \
    which pnpm

# Set PATH to include npm global bin (where pnpm is installed)
ENV PATH="/usr/local/bin:${PATH}"

# Verify pnpm is accessible
RUN which pnpm && pnpm --version

# Copy root package files first
COPY package.json pnpm-workspace.yaml tsconfig.json ./

# Copy lockfile if it exists (use shell to handle missing file gracefully)
COPY pnpm-lock.yaml* ./

# Copy shared modules
COPY shared ./shared

# Copy this service
COPY services/event-collector ./services/event-collector

# Install dependencies (allow pnpm to work without strict lockfile)
RUN pnpm install --no-frozen-lockfile

# Expose port
EXPOSE 3001

# Build shared modules first
RUN pnpm --filter "@retail-brain/*" build

# Build Event Collector
RUN pnpm --filter "@retail-brain/event-collector" build

# Start service (use start for production, dev for development)
# Use sh -c with explicit PATH to ensure pnpm is found
CMD ["sh", "-c", "export PATH=/usr/local/bin:$PATH && which pnpm && pnpm --version && pnpm --filter @retail-brain/event-collector start"]

