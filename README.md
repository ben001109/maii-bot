# Maii Bot

This repository holds the code for Maii Bot.

## Project tree

```
.
├── CHANGELOG.md
├── README.md
├── index.js
└── package.json
```
=======
# Restaurant Economy Game 餐飲系統遊戲

## English
This project aims to simulate Taiwan's economy in a restaurant management game. It is designed around a Discord bot and will support multiple platforms including web, desktop and mobile. All text should be internationalized.

### Features
- Discord bot with slash commands
- Express API server
- Placeholder directories for multiplatform clients
- Docker container support (basic)

### Requirements
- Node.js 20 or later

### Configuration
1. Copy `config.example.json` to `config.json` and add your Discord token.
2. Optionally adjust the API port.

### Usage
Run the API server:
```bash
npm run api
```
Run the Discord bot:
```bash
npm run bot
```

### Project Structure
```
.
├── API/
├── DCACT/
├── Dockerfile
├── README.md
├── TODO.md
├── bot/
│   ├── commands/
│   ├── handler/
│   └── utils/
├── config.example.json
├── config.js
├── index.js
├── multiplatform/
│   ├── Darwin/
│   ├── android/
│   ├── iOS/
│   ├── linux/
│   └── windows/
├── package.json
└── web/
```

## 中文
這個專案用來模擬台灣經濟系統的餐飲管理遊戲，核心為 Discord 機器人，並計畫支援網頁、桌面與行動裝置等多平台。所有文字皆需 i18n 處理。

### 特點
- 支援 Discord bot
- 基礎 Express API 服務
- 多平台目錄架構
- 整合 Docker 容器

### 系統需求
- Node.js 20 以上版本

### 設定檔
1. 複製 `config.example.json` 成 `config.json` 並填入 Discord token。
2. 可以修改 API 端口號。

### 執行方式
啟動 API 伺服器：
```bash
npm run api
```
啟動 Discord 機器人：
```bash
npm run bot
```

### 專案結構
```
.
├── API/
├── DCACT/
├── Dockerfile
├── README.md
├── TODO.md
├── bot/
│   ├── commands/
│   ├── handler/
│   └── utils/
├── config.example.json
├── config.js
├── index.js
├── multiplatform/
│   ├── Darwin/
│   ├── android/
│   ├── iOS/
│   ├── linux/
│   └── windows/
├── package.json
└── web/
```
=======
# Maii Bot

This is a minimal Node.js project with ESLint and Prettier configured.

## Commands

- `npm run lint` – run ESLint on the project files.
- `npm run format` – format the files using Prettier.
- `npm test` – run the simple test script.
- `docker compose up` – start the API and bot services.

## Docker Compose Usage

Start both services with:

```sh
docker compose up
```

The API service will be available at `http://localhost:3000`.

## Project Structure

```
.
├── api
│   └── index.js
├── bot
│   └── index.js
├── docker-compose.yml
├── eslint.config.mjs
├── .prettierrc
├── index.js
├── package.json
├── test.js
├── LICENSE
└── README.md
```

## Detailed Structure

```
maii-bot/
├── api
│   └── index.js
├── bot
│   └── index.js
├── docker-compose.yml
├── eslint.config.mjs
├── .prettierrc
├── index.js
├── package.json
├── test.js
├── LICENSE
└── README.md
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.