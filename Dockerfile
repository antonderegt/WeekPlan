FROM node:20-bookworm AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bookworm
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ libsqlite3-0 \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=builder /app/dist ./dist
ENV PORT=3000
ENV DB_PATH=/data/weekplan.db
EXPOSE 3000
CMD ["node", "server/index.js"]
