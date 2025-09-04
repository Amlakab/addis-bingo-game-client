# Stage 1: Build Next.js
FROM node:18 AS builder

WORKDIR /app

# Copy package.json and lock files first
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Build app
RUN npm run build

# Stage 2: Run production build
FROM node:18

WORKDIR /app

# Copy only the build output and node_modules
COPY --from=builder /app ./

EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]
