# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app

COPY . .
RUN npm install
RUN npm run build

# Stage 2: Run
FROM node:20
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

CMD ["node", "dist/apps/iam/src/main.js"]
