# Build stage
FROM --platform=linux/amd64 node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock ./

# Enable corepack and install ALL dependencies (including dev dependencies for building)
RUN corepack enable && yarn install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client before building
RUN npx prisma generate

# Build the application
RUN yarn build

# Production stage
FROM --platform=linux/amd64 node:20-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies with additional optimizations
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
    rm -rf node_modules/typescript node_modules/@types node_modules/prisma && \
    # Clean up yarn cache and temp files
    yarn cache clean && \
    rm -rf /tmp/* /root/.yarn /root/.cache

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy environment file
COPY .env.production .env.production

# Copy prisma files if needed at runtime
COPY --from=builder /usr/src/app/prisma ./prisma

# Copy the generated Prisma Client from builder stage
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
