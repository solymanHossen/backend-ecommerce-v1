# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user for security
USER node

# Expose the port
EXPOSE 5000

# Start the application
CMD ["node", "dist/app.js"]
