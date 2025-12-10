FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files first
COPY package.json pnpm-workspace.yaml tsconfig.json ./

# Copy lockfile if it exists
COPY pnpm-lock.yaml* ./

# Copy shared modules
COPY shared ./shared

# Copy dashboard app
COPY apps/dashboard ./apps/dashboard

# Install dependencies (allow pnpm to work without strict lockfile)
RUN pnpm install --no-frozen-lockfile

# Build shared modules
RUN pnpm --filter "@retail-brain/*" build

# Build dashboard
RUN pnpm --filter "@retail-brain/dashboard" build

# Expose port (Railway will set PORT env var)
EXPOSE 3100

# Start dashboard
CMD ["pnpm", "--filter", "@retail-brain/dashboard", "start"]

