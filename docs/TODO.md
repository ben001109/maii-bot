# 📝 MAII-Bot 開發待辦事項（TODO）

# 📝 待辦事項清單

## 🔄 系統功能

### 核心功能

- [x] 基本 Discord 機器人架構設置
- [x] 指令系統實作
- [x] 資料庫連接設定
- [x] Redis 快取整合
- [x] 容器化設定 (Docker)
- [ ] CI/CD 自動部署流程
- [ ] 單元測試框架建立
- [ ] 效能監控與日誌系統優化

### 容器化與部署

- [x] Dockerfile 建立
- [x] docker-compose.yml 配置
- [x] 多環境變數設定 (.env.example)
- [ ] 生產環境安全性最佳化
- [ ] 備份恢復策略實作
- [ ] 自動擴展配置
- [ ] 容器健康檢查

## 💼 業務邏輯

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

### 遊戲功能

- [ ] 玩家排行榜
- [ ] 成就系統
- [ ] 任務/活動系統
- [ ] 商店與交易系統

## 📚 文件與品質

- [x] 基本架構文件
- [x] 安裝部署指南
- [x] 容器化文件
- [ ] API 文件完善
- [ ] 貢獻指南更新
- [ ] 程式碼風格規範文件

## 🧠 未來規劃

- [ ] 網頁管理介面
- [ ] 跨伺服器支援
- [ ] 插件系統
- [ ] 使用者自訂主題

---

*最後更新: 2025-06-01*
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
- [x] 優化 Redis 客戶端配置，增強連接穩定性與錯誤處理

### SlashHandler.js
- [x] 支援無限巢狀資料夾結構載入（已實作）
- [x] 錯誤載入記錄回傳主程式
- [x] 改進指令處理流程與錯誤處理

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
- [x] 初始化條件從金額改為 initialized flag
- [x] 使用 initializePlayer() 統一欄位補全
- [x] 子指令重構為 handler map 結構

### enterprise/create.js
- [x] 整合企業服務並格式化回覆內容
- [x] 玩家創業扣款處理
- [x] 創業冷卻提示支援遊戲與現實時間
- [x] 統計創業次數並顯示於訊息與 profile

### Admin

#### admin/reset.js
- [x] 重置指定玩家帳號資料

#### admin/sync.js
- [x] 管理員 ID 配置
- [x] 未授權存取與日誌記錄
- [x] 改為每個 guild 可自訂管理員名單（儲存於資料庫或 Redis）

### 權限系統

#### Permissions.js

- [x] 權限檢查工具實作
- [x] 中間件：權限檢查功能
- [x] 權限定義常數
- [ ] 角色與權限綁定
- [ ] 權限繼承關係

#### AdminManager.js

- [x] 管理員權限管理類實作
- [x] Redis 快取管理員信息
- [x] Prisma 持久儲存管理員數據
- [x] 權限檢查與驗證
- [ ] 權限變更審計日誌

</details>

---

# 🟧 P1（進階功能／體驗優化）

<details>
<summary><strong>資料庫與核心服務</strong></summary>

### prismaClient.js
- [x] Transaction Wrapper 工具

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


### start.js
- [ ] 顯示更多玩家初始資訊（職業等）
- [ ] 是否新帳號標註;
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
- [x] 選擇型態/自訂名稱（支援中文類型與玩家自訂名稱）
- [x] 類型顯示中文化（type → 中文對照表）
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

### i18n.js

- [x] 多語系翻譯字典架構設計
- [x] 指令與系統訊息支援 i18n 套件
- [x] 動態語言切換（根據玩家偏好或 guild 設定）
- [x] 翻譯缺失 fallback 與記錄
- [ ] 測試覆蓋主要指令輸出是否支援多語系

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

- [x] 建立初始原料表資料格式（以 JSON 存放於 /data/materials）
- [x] 實作 generate.js 將原料資料批次導入 Redis
- [x] 依產業類別（farm、factory）分類管理原料資料
- [ ] 設計「原料來源模式」：自產 vs 廠商叫貨
- [ ] 支援每種原料是否可自產與所需配方（recipe）
- [ ] 支援廠商叫貨系統：價格、冷卻、限購量
- [ ] 對應指令邏輯：/factory produce /vendor order

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

<details>
<summary><strong>遊戲循環與 Tick 系統</strong></summary>

### enterprise/erp_runtime.js
- [x] 整合所有每 tick 執行邏輯
- [x] 呼叫 timerHandler, earningtimer 等模組
- [x] 預留 passive 系統處理

### enterprise/earningtimer.js
- [x] 根據產業計算每秒收入並加總入帳

### handler/timerHandler.js
- [x] 推進每位玩家遊戲內時間
- [x] 遊戲時間與現實時間轉換（6:1）
- [x] 自動遞減冷卻計時

</details>

---

# 💡 開發建議與順序

## 🟩【玩家體驗優化】（可立即實裝/已具備前置）

1. Profile Embed 顯示  
   - 玩家個人資料用嵌入（Embed）方式輸出，現有 profile 指令和 privacy 機制可直接支援。
2. 公開 Profile 查詢  
   - `/player profile @user` 查他人，檢查 privacy 設定，必要時新增 `isProfilePublic` 欄位。
3. 個人隱私 UI  
   - `/player privacy` 指令，互動選單切換 profile 是否公開，直接更新隱私欄位。
4. `/player help` 重構  
   - 幫助訊息嵌入、分類整理，提升新手體驗。

---

## 🟧【管理功能強化】（可立即實裝/已具備前置）

1. Admin Sync/Reset 批次操作  
   - `/admin sync all`、`/admin reset batch`，批量處理所有玩家或企業，底層資料已齊全。
2. Dry-Run 模擬執行  
   - 支援管理指令 dry-run 選項，不動資料只預覽影響結果。
3. 批次任務進度條  
   - 長時間同步/重置顯示進度，進度條/百分比回報 Discord。
4. 自動備份  
   - 定時腳本或 `/admin backup` 導出主要資料表。
5. 異常狀況通知  
   - 錯誤、異常自動推播給管理員或警告頻道。

---

## 🟦【經濟系統初始模組】（可立即規劃）

1. 玩家資產查詢與轉帳  
   - `/player balance`、`/player transfer`，player 新增 balance 欄位即可。
2. 企業創立資本門檻  
   - `/enterprise create` 新增資金檢查，低於門檻不能創立並自動扣款。
3. 營收報表模擬  
   - `/enterprise revenue`，根據現有資料推算企業模擬營收。

---

> 上述項目皆可根據現有結構直接規劃與進行開發，建議從玩家體驗優化優先推進，並同步強化管理與經濟基礎功能，為長期遊戲化與模擬經濟鋪路。

---</file>
