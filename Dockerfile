FROM node:22-alpine AS base
WORKDIR /app
COPY package.json bun.lock* ./
RUN npm install -g bun && bun install --production=false
COPY . .
RUN bunx prisma generate && bun run build
RUN addgroup -S agenthub && adduser -S agenthub -G agenthub && chown -R agenthub:agenthub /app
USER agenthub
EXPOSE 3000
CMD ["bun", "run", "start"]
