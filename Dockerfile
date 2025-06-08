FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY . .
CMD ["node", "index.js"]
=======
FROM node:20
WORKDIR /app
COPY . .
RUN npm install --production || true
CMD ["npm", "start"]

