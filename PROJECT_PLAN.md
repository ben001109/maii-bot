# MAII-Bot Project Plan

## 中文

1. **專案簡介**
   - MAII-Bot 是一個結合經濟模擬、企業經營與 RPG 元素的 Discord 機器人，透過 Slash Commands 與玩家互動。

2. **核心功能**
   - 玩家帳號建立與隱私控制
   - 企業創建、升級與收益計算
   - 經濟系統與交易機制
   - 冷卻與遊戲時間模擬
   - 管理員指令與數據同步
   - 自動指令同步與日誌管理

3. **技術架構**
   - Node.js 與 Discord.js 開發 Bot
   - Redis 作為快取與狀態儲存
   - PostgreSQL + Prisma ORM 作為資料庫
   - winston 日誌管理
   - Docker 與 Docker Compose 部署
   - CI/CD 自動化測試與部署

4. **專案目標**
   - 重構舊版程式碼
   - 實作隱私設定
   - 自動化指令同步
   - 建立遊戲內時間與收益循環
   - 完整錯誤日誌管理
   - 支援多人協作

5. **開發計畫與工作分工**
   - P1：架構重構、基礎功能完成
   - P2：隱私控制與指令同步
   - P3：時間循環、收益計算與冷卻
   - P4：自動化測試與錯誤監控
   - P5：Docker 化與 CI/CD
   - P6：後續優化與多平台擴展

6. **開發流程與協作說明**
   - 使用 GitHub 版本控管與 Issue 管理
   - 主要分支為 main、dev
   - 透過 Pull Request 進行代碼審查
   - GitHub Actions 執行 CI/CD
   - Docker Compose 部署測試與正式環境
   - 以 FocalBoard 管理進度

7. **部署說明**
   - Docker Compose 啟動 Bot、Redis、PostgreSQL
   - 環境變數管理機密
   - GitHub Actions 自動部署
   - 集中日誌輸出便於排錯

8. **專案管理與文檔**
   - CHANGELOG.md 記錄版本更新
   - TODO.md 整理待辦事項
   - README.md 說明架構與環境建置
   - FocalBoard 追蹤進度

9. **未來規劃**
   - 任務與成就系統
   - 多平台整合
   - 監控與通知系統
   - 擴充企業類型與經濟模型
   - 研發系統與排行榜

---

## English

1. **Project Introduction**
   - MAII-Bot is a Discord bot that combines economic simulation, company management and RPG elements using Slash Commands for player interaction.

2. **Core Features**
   - Player account creation with privacy control
   - Company creation, upgrades and profit calculation
   - Economy and trading system
   - Cooldown and game time simulation
   - Admin commands with data sync
   - Automatic command sync and log management

3. **Technical Stack**
   - Node.js and Discord.js for the bot
   - Redis for caching and state storage
   - PostgreSQL with Prisma ORM
   - Logging with winston
   - Docker and Docker Compose deployment
   - CI/CD for automated tests and deployment

4. **Project Goals**
   - Refactor legacy code
   - Implement privacy settings
   - Automate command synchronization
   - Game time and profit loops
   - Complete error logging
   - Support collaborative development

5. **Development Phases**
   - P1: Architecture refactor and basic features
   - P2: Privacy controls and command sync
   - P3: Time loop, profit calc and cooldown system
   - P4: Automated tests and error monitoring
   - P5: Dockerization and CI/CD
   - P6: Optimization and multi-platform expansion

6. **Workflow**
   - GitHub for version control and issues
   - Main and dev branches
   - Pull Requests for code review
   - GitHub Actions for CI/CD
   - Docker Compose for testing and production
   - FocalBoard for progress tracking

7. **Deployment**
   - Docker Compose launches bot, Redis and PostgreSQL
   - Environment variables manage secrets
   - GitHub Actions deploy new versions
   - Centralized logs for troubleshooting

8. **Documentation**
   - CHANGELOG.md for version updates
   - TODO.md for tasks
   - README.md for structure and setup
   - FocalBoard for task management

9. **Future Plans**
   - Quest and achievement systems
   - Multi-platform integration
   - Monitoring and notification
   - More company types and economic models
   - R&D system and leaderboards

