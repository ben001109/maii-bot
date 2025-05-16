# 📝 MAII-Bot 開發待辦事項（TODO）

集中紀錄尚未完成的功能與開發優先等級（P0 = 基礎、P1 = 進階、P2 = 長期／實驗）。

---

## 🟥 P0（基礎建設／必做）

### prismaClient.js
- [x] 使用 globalThis 優化開發模式下的 PrismaClient 實例重用
- [ ] 支援多資料庫來源
- [ ] 可選錯誤監控（結合 logger）

### redisClient.js
- [x] 將 Redis 所有事件掛載模組化處理
- [x] 使用 logger 統一日誌記錄格式與等級
- [ ] 支援從 .env 載入 Redis 連線資訊

### SlashHandler.js
- [ ] 支援無限巢狀資料夾結構載入（已實作）
- [ ] 錯誤載入記錄回傳主程式

### ReplyUtils.js
- [ ] 支援成功訊息回覆
- [ ] 支援 loading 狀態指示（deferReply）

### start.js
- [x] 陣列組合訊息
- [x] 統一錯誤流程

### profile.js
- [x] 抽出格式化函式
- [x] 金額千分位顯示

### enterprise/create.js
- [x] 整合企業服務並格式化回覆內容

### admin/reset.js
- [x] 重置指定玩家帳號資料

### admin/sync.js
- [x] 管理員 ID 配置
- [x] 未授權存取與日誌記錄

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

### ReplyUtils.js
- [ ] 多類型封裝（embed, warning）
- [ ] 錯誤訊息標準化
- [ ] i18n 多語系

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

---

## 開發建議：
1. 先完成 P0 必備模組與功能
2. 按需求與用戶體驗迭代 P1
3. 適時推進 P2 深度經濟遊戲化