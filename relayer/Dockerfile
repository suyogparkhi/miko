# Use the official Node.js runtime as the base image
FROM node:18-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S relayer -u 1001

# Set the working directory
WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder --chown=relayer:nodejs /app/node_modules ./node_modules

# Copy the rest of the application code
COPY --chown=relayer:nodejs . .

# Create secrets directory with proper permissions
RUN mkdir -p secrets && chown relayer:nodejs secrets

# Switch to non-root user
USER relayer

# Expose the port the app runs on
EXPOSE 8080

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"] 