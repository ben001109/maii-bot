FROM node:18
WORKDIR /app
COPY . .
RUN npm install --production || true
CMD ["npm", "start"]
