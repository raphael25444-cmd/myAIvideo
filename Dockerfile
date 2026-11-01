# Optional Next.js studio image (used by `docker compose --profile full up`).
# The platform builds/runs the web app directly; this is provided for
# self-hosting the full stack with Docker.
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
