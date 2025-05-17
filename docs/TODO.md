# 📝 MAII-Bot 開發待辦事項（TODO）

> 此檔案使用 GitHub 支援的 <details> 折疊區塊提升可讀性，請點擊展開各分區。

集中紀錄尚未完成的功能與開發優先等級（P0 = 基礎、P1 = 進階、P2 = 長期／實驗）。

---

# 🟥 P0（基礎建設／必做）

<details>
<summary><strong>資料庫與核心服務</strong></summary>

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

### MathHandler.js
- [x] 常用數學計算封裝
- [x] 財務報表相關計算函式
- [x] 經濟指標計算工具
- [x] 提供 API 給其他模組調用

</details>

<details>
<summary><strong>指令與模組</strong></summary>

### start.js
- [x] 陣列組合訊息
- [x] 統一錯誤流程
- [x] 改為整合至 /player 指令的子指令（start, profile）

### profile.js
- [x] 抽出格式化函式
- [x] 金額千分位顯示
- [x] 改為整合至 /player 指令的子指令（start, profile）

### player.js
- [x] 整合 start, profile, private 為 /player 子指令
- [x] /player help 子指令

### enterprise/create.js
- [x] 整合企業服務並格式化回覆內容

### Admin

#### admin/reset.js
- [x] 重置指定玩家帳號資料

#### admin/sync.js
- [x] 管理員 ID 配置
- [x] 未授權存取與日誌記錄
- [x] 改為每個 guild 可自訂管理員名單（儲存於資料庫或 Redis）

</details>

---

# 🟧 P1（進階功能／體驗優化）

<details>
<summary><strong>資料庫與核心服務</strong></summary>

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

</details>

<details>
<summary><strong>指令功能與優化</strong></summary>

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
- [x] 排程同步/狀態查詢

</details>

---

# 🟩 P2（長期／經濟系統 Roadmap）

<details>
<summary><strong>玩家經濟系統 & 市場機制</strong></summary>

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

</details>

<details>
<summary><strong>上游產業與產業鏈模組</strong></summary>

## 上游產業（/enterprise）

#### enterprise.js
- [ ] 改造成上游產業供應商
- [ ] 企業類型選擇（農業、食品工廠、設備廠）
- [ ] 原料生產與供應系統
- [ ] 供應價格設定機制
- [ ] 生產力與品質升級
- [ ] 市場需求與價格波動
- [ ] 與 `/restaurant` 連動進貨機制
- [ ] 市場事件與供應鏈影響

## 經濟系統完整規劃
- [ ] 各模組經濟循環、職業、排行榜、金融市場等（原清單細節保留）

</details>

<details>
<summary><strong>餐飲模擬經營遊戲（/restaurant）</strong></summary>

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

</details>

<details>
<summary><strong>上游產業模組（/enterprise）</strong></summary>

### enterprise/produce.js
- [ ] 開始生產
- [ ] 生產週期計算
- [ ] 存貨儲存與腐敗控制

### enterprise/price.js
- [ ] 設定產品價格
- [ ] 根據市場調整價格

</details>

---

# 💡 開發建議與順序

1. **先完成 P0 必做模組與所有基礎指令/服務**
2. **P1 以功能完整度、效能優化與多語系體驗為主，進階可讀性、維護性設計**
3. **P2 開始經濟模組，逐步遊戲化，按 Roadmap 推進（見詳細清單）**

---