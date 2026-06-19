FROM oven/bun:1-alpine

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./

# Install production dependencies
RUN bun install --production

# Copy source code and migrations
COPY src ./src
COPY drizzle ./drizzle
COPY tsconfig.json ./

# Expose Hono server port
EXPOSE 8000

# Start API server
CMD ["bun", "src/index.ts"]
