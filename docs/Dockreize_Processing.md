# MAII-Bot 容器化流程

## 📦 專案結構假設

專案根目錄包含以下重要資料夾與檔案：

```
./src
├── bot
│   ├── commands/
│   ├── data/
│   ├── events/
│   ├── logs/
│   └── utils/
├── db/
├── redis/
├── services/
├── index.js
├── package.json
└── .env
```

## 🐳 Dockerfile 建立

在專案根目錄建立 `Dockerfile`：

```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate || true

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
```

## ⚙️ 建立 docker-compose.yml

```yaml
version: "3.9"
services:
  maii-bot:
    container_name: maii-bot
    build: .
    restart: unless-stopped
    env_file: .env
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - redis
      - mysql
    networks:
      - maii-net

  redis:
    image: redis:7
    container_name: redis
    restart: unless-stopped
    networks:
      - maii-net

  mysql:
    image: mysql:8
    container_name: mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: maii
      MYSQL_USER: bot
      MYSQL_PASSWORD: botpassword
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - maii-net

volumes:
  mysql_data:

networks:
  maii-net:
    driver: bridge
```

## 📂 .env 設定檔範例

```env
DISCORD_TOKEN=your_token_here
REDIS_URL=redis://redis:6379
DATABASE_URL=mysql://bot:botpassword@mysql:3306/maii
```

## 🚀 部署與執行

```bash
docker-compose up --build -d
docker-compose logs -f maii-bot
```

## 🧪 開發模式（可選）

若需熱重載開發模式，可搭配 `nodemon`：

```json
"scripts": {
"dev": "nodemon src/bot/index.js"
}
```

並在 `docker-compose.override.yml` 加入：

```yaml
services:
  maii-bot:
    command: [ "npm", "run", "dev" ]
```

---