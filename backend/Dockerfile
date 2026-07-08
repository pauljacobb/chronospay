FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY src/ ./src/
COPY migrations/ ./migrations/

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
