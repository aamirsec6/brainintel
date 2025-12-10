FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./
COPY tsconfig.json ./

# Copy shared modules
COPY shared ./shared

# Copy dashboard app
COPY apps/dashboard ./apps/dashboard

# Install dependencies
RUN pnpm install

# Build shared modules
RUN pnpm --filter "@retail-brain/*" build

# Build dashboard
RUN pnpm --filter "@retail-brain/dashboard" build

# Expose port (Railway will set PORT env var)
EXPOSE 3100

# Start dashboard
CMD ["pnpm", "--filter", "@retail-brain/dashboard", "start"]

