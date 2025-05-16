# 🌟 MAII-Bot 鷗麥麥麥 Discord 經濟系統機器人

> **一款以「餐館與企業」為主題，支援多用戶經營與即時資料同步的 Discord Bot！**  
> 特色：支援 Redis/PostgreSQL 同步、個人化隱私控制、動態 Slash 指令、多模組經濟模擬，專為鷗賣麥麥社群量身打造。

---

## 🚀 專案簡介

MAII-Bot 以經濟模擬、產業鏈遊戲為主軸，讓 Discord 玩家在伺服器內經營企業、體驗模擬經濟循環。  
特色包含**玩家隱私自訂**、**資料多源快取同步**、**彈性擴充指令**、**現代團隊協作開發流程**等。  

---

## 📦 安裝方式

**需要 Node.js 20+、Redis、PostgreSQL（Prisma）**

```bash
git clone https://github.com/ben001109/maii-bot.git
cd maii-bot
mkdir config
touch config/config.json  # 設定資料庫/Redis/token
npm install
npx prisma generate       # 生成 Prisma client
npm run migrate           # (如有 schema 更新)
npm start
```

> **首次啟動請確保 Redis/PostgreSQL 已啟動，並依照 .env 格式填寫。**

---

## 🕹️ 指令一覽（簡要版）

- `/player start` — 建立個人遊戲資料
- `/player profile` — 查看個人資料與企業
- `/player private` — 設定回覆顯示/隱私
- `/player lookup` — 查詢他人公開資料（尊重隱私設定）
- `/enterprise create` — 創立企業
- `/admin sync` — 管理員同步 Redis/DB
- `/admin reset` — 管理員重置玩家資料

詳細指令可見 `src/bot/commands` 資料夾。

---

## 🛠️ 開發與協作

- **分支規範**：feature/、bugfix/、refactor/
- **日誌與錯誤追蹤**：皆會寫入 `maiibot.log` 與 Discord 日誌頻道（如有設置）
- **CI/CD**：建議加上 GitHub Actions/自動測試

---

## 📚 文件 & 進度

- 詳細功能規劃與進度請見 [`README.md`](./README.md) 內文
- 名詞解釋、常見問題、協作建議與 Roadmap 已整合於本文件

---

## 🙌 聯絡與貢獻

- **Discord**：[@鷗麥麥麥](https://discord.gg/omaimaimaii)
- **VTuber 官方站**：[vtuber-maii.com](https://vtuber-maii.com/)
- **GitHub Issues**：歡迎提問/回報 bug

---

## 📄 授權 License

本專案以 [MIT License](./LICENSE) 發布  
僅供學習、二創、非商業用途（如需商用請與作者聯絡）

---

> 由鷗麥麥麥社群與社群志工共同維護，誠徵貢獻者一起玩！

# 📌 MAII-Bot 專案文件補強

## 名詞解釋
- **Player（玩家）**：參與遊戲的 Discord 用戶，擁有個人資料及企業資產。
- **Enterprise（企業）**：玩家可創立的事業單位，包含不同型態與收益。
- **Profile（個人檔案）**：顯示玩家基本資料、隱私設定與擁有資產。
- **Sync（同步）**：將 Redis 快取資料寫入 PostgreSQL 的定期作業。
- **Admin（管理員）**：擁有特殊指令執行權限的 Discord 帳號。
- **ReplyVisibility（回覆顯示）**：指令回覆訊息的顯示範圍（公開/私人）。

## 專案進度快照
- **2025/05/17** — P0 完成度：80%，P1：10%，P2：0%（以 TODO 勾選進度為準）

## 需求歷程（Changelog）
- 2025/05/17 [新增] 補強隱私查詢與 profile 可搜尋功能
- 2025/05/16 [新增] 支援多層指令結構與 logger 日誌功能
- 2025/05/15 [調整] Redis/Prisma 同步機制優化
- 2025/05/14 [調整] 指令 handler 熱重載優化

## 常見疑難雜症 QA
- **如何重啟 BOT？**  
  `npm restart` 或直接重啟 `systemctl` 服務
- **Prisma 出現「Too many connections」？**  
  檢查是否正確使用 `globalThis` 單例，避免重複 new PrismaClient
- **Redis 無法連線？**  
  檢查 .env 設定，確認 Redis host/port 與密碼正確
- **Slash 指令載入錯誤？**  
  查看 `logger` 日誌，有路徑/格式錯誤時會有詳細紀錄
- **隱私設定失效？**  
  確認 `/player private` 指令邏輯，或是否正確引用 `replyWithPrivacy` 工具

## 文件與協作建議
- 每個指令檔案都需補充 JSDoc 或簡易說明，方便他人閱讀
- 建議所有新增/修改功能都記錄於 Changelog
- 分支命名建議：`feature/xxx`、ㄌ`bugfix/xxx`、`refactor/xxx`
- Pull Request 前請確保通過所有 linter/單元測試（可自建 `.github/workflows` CI 流程）

---

# 📝 MAII-Bot 開發待辦事項（TODO）

集中紀錄尚未完成的功能與開發優先等級（P0 = 基礎、P1 = 進階、P2 = 長期／實驗）。

---

## 🟥 P0（基礎建設／必做）

# database

### prismaClient.js
- [x] 使用 globalThis 優化開發模式下的 PrismaClient 實例重用
- [x] 可選錯誤監控（結合 logger）

### redisClient.js
- [x] 將 Redis 所有事件掛載模組化處理
- [x] 使用 logger 統一日誌記錄格式與等級
- [x] 支援從 .env 載入 Redis 連線資訊

### SlashHandler.js
- [x] 支援無限巢狀資料夾結構載入（已實作）
- [x] 錯誤載入記錄回傳主程式

### ReplyUtils.js
- [x] 支援成功訊息回覆
- [x] 支援 loading 狀態指示（deferReply）

### start.js
- [x] 陣列組合訊息
- [x] 統一錯誤流程
- [x] 改為整合至 /player 指令的子指令（start, profile）

# profile

### profile.js
- [x] 抽出格式化函式
- [x] 金額千分位顯示
- [x] 改為整合至 /player 指令的子指令（start, profile）

# player

### player.js
- [x] 整合 start, profile, private 為 /player 子指令
- [x] /player help 子指令

# enterprise

### enterprise/create.js
- [x] 整合企業服務並格式化回覆內容

# Admin

### admin/reset.js
- [x] 重置指定玩家帳號資料

### admin/sync.js
- [x] 管理員 ID 配置
- [x] 未授權存取與日誌記錄
- [ ] 改為每個 guild 可自訂管理員名單（儲存於資料庫或 Redis）
- [ ] 自動排程同步（可設每日/每週）

---

## 🟧 P1（進階功能／體驗優化）

### prismaClient.js
- [ ] Transaction Wrapper 工具

### redisClient.js
- [ ] 連線自動重試與警告通知
- [ ] 提供 ping 健康檢查

### SlashHandler.js
- [ ] 動態監聽/熱重載指令
- [ ] 支援 .ts 檔
- [ ] 自動註冊 metadata 檢查

### syncService.js
- [ ] 抽出同步單一玩家邏輯
- [ ] dry-run 模式
- [ ] 同步指定玩家 ID
- [ ] 進度條顯示
- [ ] 支援自動排程觸發（含時間設定與開關）

### ReplyUtils.js
- [x] 多類型封裝（embed, warning）
- [x] 錯誤訊息標準化
- [x] i18n 多語系

### start.js
- [ ] 顯示更多玩家初始資訊（職業等）
- [ ] 是否新帳號標註
- [ ] 抽出帳號初始化模組

### profile.js
- [ ] 查詢指定用戶 profile
- [ ] Embed 顯示
- [ ] 成就、歷史紀錄自訂欄位
- [ ] 多語系

### test.js
- [ ] MathUtils 工具
- [ ] N 個質數（進階）
- [ ] 指令命名 `/prime`

### enterprise/create.js
- [ ] 選擇型態/自訂名稱
- [ ] 創業上限、創業花費
- [ ] 創建後導引經營

### admin/reset.js
- [ ] 全服重置選項、二次確認
- [ ] 重置自動備份
- [ ] 日誌異常警報
- [ ] 多種重置範圍

### admin/sync.js
- [ ] dry-run 模擬
- [ ] 詳細進度條
- [ ] cooldown/防濫用
- [ ] 結果寫入日誌頻道
- [ ] 排程同步/狀態查詢


---

## 🟩 P2（長期／經濟系統 Roadmap）

- [ ] 玩家資產查詢/轉帳
- [ ] 企業經營與產業鏈模組（升級/招募/生產/銷售/利潤自動計算）
- [ ] 市場機制（買賣、價格浮動、競價、限價）
- [ ] 稅收與政策調控
- [ ] 銀行存款/貸款與自動利息
- [ ] 勞動市場/職業系統
- [ ] 投資理財/股市模擬
- [ ] 通膨通縮與經濟事件
- [ ] 每日/每月/年度排行榜、新聞
- [ ] 進階 API/自動監控/管理

### 上游產業（/enterprise）

#### enterprise.js
- [ ] 改造成上游產業供應商
- [ ] 企業類型選擇（農業、食品工廠、設備廠）
- [ ] 原料生產與供應系統
- [ ] 供應價格設定機制
- [ ] 生產力與品質升級
- [ ] 市場需求與價格波動
- [ ] 與 `/restaurant` 連動進貨機制
- [ ] 市場事件與供應鏈影響

---

## 經濟系統完整規劃

### 上游產業系統（/enterprise）
- [ ] 農業生產與食品加工細節
- [ ] 設備製造與物流系統
- [ ] 生產、升級、銷售等完整指令集

### 餐飲產業系統（/restaurant）
- [ ] 完善餐廳經營指令（菜單、庫存、員工、財務）
- [ ] 菜品研發與餐廳品質控制
- [ ] 連鎖與加盟管理系統

### 市場經濟循環（/market）
- [ ] 供需市場與價格浮動
- [ ] 通膨與經濟事件系統
- [ ] 金融市場與投資系統

### 勞動市場與職業系統（/career）
- [ ] 職業選擇與技能系統
- [ ] 兼職與打工機制

### 排行榜與獎勵系統（/leaderboard）
- [ ] 各類排行榜建立（財富、聲譽、營業額）
- [ ] 排行榜週期獎勵機制

### 自動化任務系統（Automation Tasks）
- [ ] 每日經濟事件生成
- [ ] 每週市場調整與報告
- [ ] 每月經濟總結與報告

---

## 餐飲模擬經營遊戲（/restaurant）

### restaurant/menu.js
- [ ] 新增菜品
- [ ] 調整價格
- [ ] 下架菜品

### restaurant/inventory.js
- [ ] 食材進貨
- [ ] 庫存顯示與逾期處理

### restaurant/staff.js
- [ ] 員工招募與解僱
- [ ] 員工訓練與技能成長
- [ ] 員工薪資管理

### restaurant/finance.js
- [ ] 顯示財務報表
- [ ] 利潤分析與趨勢圖

### restaurant/marketing.js
- [ ] 發起促銷活動
- [ ] 廣告投放與效果追蹤

### restaurant/research.js
- [ ] 食譜研發
- [ ] 食材搭配實驗系統

### restaurant.js
- [ ] 設施升級（座位數、廚房設備、裝潢）
- [ ] 顧客評價系統（聲譽與評價）
- [ ] 競爭者與市場分析（口味趨勢、價格浮動）
- [ ] 連鎖加盟（開設分店、加盟管理）
- [ ] 經濟事件系統（通貨膨脹、政策影響）
- [ ] 玩家互動（餐廳互訪、聯盟合作）


## 上游產業模組（/enterprise）

### enterprise/produce.js
- [ ] 開始生產
- [ ] 生產週期計算
- [ ] 存貨儲存與腐敗控制

### enterprise/price.js
- [ ] 設定產品價格
- [ ] 根據市場調整價格

---

## 開發建議：
1. 先完成 P0 必備模組與功能
2. 按需求與用戶體驗迭代 P1
3. 適時推進 P2 深度經濟遊戲化
### MathHandler.js 🚩 優先處理！
- [x] 常用數學計算封裝
- [x] 財務報表相關計算函式
- [x] 經濟指標計算工具
- [x] 提供 API 給其他模組調用