FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENV VITE_BACKEND_URL=http://backend:5000

CMD ["npm", "run", "dev", "--", "--host"]
