# ---------- BUILD ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx nest build


# ---------- RUNTIME ----------
FROM node:20-alpine

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --omit=dev

USER app
EXPOSE 5003

CMD ["node", "dist/src/main.js"]
