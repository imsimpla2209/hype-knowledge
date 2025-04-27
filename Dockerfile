FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Production image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Set health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/retrieve/health').then(r => process.exit(r.ok ? 0 : 1))" || exit 1

# Start application
CMD ["node", "dist/app.js"] 