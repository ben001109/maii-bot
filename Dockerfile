FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate || true

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
