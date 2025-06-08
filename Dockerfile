FROM node:20
WORKDIR /app
COPY . .
RUN npm install --production || true
CMD ["npm", "start"]
