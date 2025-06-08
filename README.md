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
