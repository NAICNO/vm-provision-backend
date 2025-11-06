# Build stage
FROM --platform=linux/amd64 node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock ./

# Enable corepack and install ALL dependencies (including dev dependencies for building)
RUN corepack enable && yarn install --frozen-lockfile

# Copy source code and tsconfig
COPY . .

# Build TypeScript to JavaScript
RUN npx tsc

# Production stage
FROM --platform=linux/amd64 node:20-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies with optimizations
RUN corepack enable && \
    # Install only production dependencies
    yarn install \
      --production \
      --frozen-lockfile \
      --ignore-scripts \
      --prefer-offline \
      --no-optional && \
    # Remove unnecessary files from node_modules
    find node_modules -name "*.ts" -type f -delete && \
    find node_modules -name "*.md" -type f -delete && \
    find node_modules -name "*.map" -type f -delete && \
    find node_modules -type d -name "test" -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -type d -name "__tests__" -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -type d -name "docs" -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -type d -name "examples" -exec rm -rf {} + 2>/dev/null || true && \
    # Remove dev-only packages that shouldn't be in production
    rm -rf node_modules/typescript node_modules/@types && \
    # Clean up yarn cache and temp files
    yarn cache clean && \
    rm -rf /tmp/* /root/.yarn /root/.cache

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

ENV NODE_ENV=production

# Run compiled JavaScript instead of ts-node
CMD ["node", "dist/consumer.js"]
