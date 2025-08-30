# Stage 1: Build the NestJS application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker caching
COPY package*.json ./

# Install all dependencies including devDependencies for the build step
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Create the final, lightweight production image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy the production dependencies from the builder stage
# A multi-stage build's primary purpose is to copy only what is needed for production.
# The builder stage needs dev dependencies for the build, but the final stage does not.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 5000

# Command to start the application
CMD ["node", "dist/main"]