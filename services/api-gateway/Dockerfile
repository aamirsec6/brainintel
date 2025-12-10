FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
# Copy TypeScript config needed for builds
COPY tsconfig.json ./

# Copy shared modules
COPY shared ./shared

# Copy this service
COPY services/api-gateway ./services/api-gateway

# Install dependencies
RUN pnpm install --frozen-lockfile

# Expose port
EXPOSE 3000

# Start service
CMD ["pnpm", "--filter", "@retail-brain/api-gateway", "dev"]

