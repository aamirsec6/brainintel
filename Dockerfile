# Root Dockerfile for Railway
# Railway will use this as fallback, but docker-compose.yml should be used instead
# This file exists to prevent Railway errors

FROM node:20-alpine

WORKDIR /app

# This is a placeholder - Railway should use docker-compose.yml
# If you see this, configure Railway to use docker-compose.yml or Nixpacks

RUN echo "This Dockerfile is a placeholder. Please configure Railway to use docker-compose.yml or switch to Nixpacks builder."

CMD ["echo", "Configure Railway to use docker-compose.yml or Nixpacks"]

