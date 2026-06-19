FROM oven/bun:1-alpine

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source code and config files
COPY src ./src
COPY public ./public
COPY components.json eslint.config.mjs next-env.d.ts next.config.ts postcss.config.mjs tsconfig.json ./

# Build the Next.js application
RUN bun run build

# Expose port
EXPOSE 3000

# Start Next.js in production mode
CMD ["bun", "run", "start"]
