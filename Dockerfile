# Stage 1: Build the React TypeScript frontend
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Hardened production container for Google Cloud Run
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built frontend assets
COPY --from=builder --chown=node:node /app/dist ./dist

# Copy backend server code
COPY --chown=node:node server ./server

# Run as non-root user for security best practices
USER node

EXPOSE 8080

CMD ["node", "server/index.js"]
