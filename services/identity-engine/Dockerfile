FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY shared ./shared
COPY services/identity-engine ./services/identity-engine

RUN pnpm install --frozen-lockfile
RUN pnpm -r --filter "@retail-brain/*" build
RUN pnpm --filter "@retail-brain/identity-engine" build

EXPOSE 3002

CMD ["pnpm", "--filter", "@retail-brain/identity-engine", "start"]

