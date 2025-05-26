# 🚀 MAII-Bot 安裝部署指南

本文件將引導您完成 MAII-Bot Discord 機器人的安裝和部署。

## 目錄

- [系統需求](#系統需求)
- [快速部署（使用設定腳本）](#快速部署使用設定腳本)
- [手動安裝](#手動安裝)
- [Docker 部署](#docker-部署)
- [故障排除](#故障排除)

## 系統需求

- Node.js 18.x 或更高版本
- MySQL 8.0 或更高版本
- Redis 7.0 或更高版本
- Discord 應用程式與機器人權杖

如果使用 Docker 部署，只需要安裝：

- Docker Engine 20.10.0+
- Docker Compose v2.0.0+

## 快速部署（使用設定腳本）

我們提供了一個互動式設定腳本，簡化部署流程：

1. 確保您已安裝 Docker 和 Docker Compose
2. 複製專案庫並進入專案目錄：
   ```bash
   git clone https://github.com/your-org/maii-bot.git
   cd maii-bot
   ```

3. 執行設定腳本（如果無法執行，請先給予執行權限）：
   ```bash
   chmod +x manager.sh
   ./manager.sh
   ```

4. 按照提示輸入 Discord 機器人資訊和其他設定
5. 腳本完成後，啟動容器：
   ```bash
   docker-compose up -d
   ```

## 手動安裝

如果您希望手動設定，請按照以下步驟：

1. 複製 `.env.example` 為 `.env` 並編輯：
   ```bash
   cp .env.example .env
   nano .env
   ```

2. 安裝相依套件：
   ```bash
   npm install
   ```

3. 生成 Prisma 客戶端：
   ```bash
   npx prisma generate
   ```

4. 初始化資料庫：
   ```bash
   npx prisma migrate dev --name init
   ```

5. 啟動機器人：
   ```bash
   npm run start
   ```

## Docker 部署

使用 Docker Compose 進行部署：

1. 複製並編輯環境變數：
   ```bash
   cp .env.example .env
   nano .env
   ```

2. 啟動容器：
   ```bash
   docker-compose up -d
   ```

3. 監控日誌：
   ```bash
   docker-compose logs -f maii-bot
   ```

## 故障排除

如果遇到問題，請查看常見問題解答：

- **機器人無法連接到 Discord**：確認 TOKEN 是否正確，並檢查是否開啟了正確的機器人權限
- **資料庫連接錯誤**：確認 .env 中的資料庫配置是否正確
- **Redis 連接問題**：檢查 Redis 服務是否正常運行

若有更多問題，請參考 [常見問題](./FAQ.md) 或在 GitHub 上提交 Issue。