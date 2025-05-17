## 進度記錄（2025-5-17）

### 主要功能
- 完成指令 system 與 event system 實作，支援動態註冊與分派指令。
- 實作 Redis 快取機制，並設計同步至 PostgreSQL 的資料持久化流程。
- 新增玩家隱私功能，並設計 lookup 系統以查詢與控管玩家資料。
- 多路 logger 實作，支援不同層級與來源的日誌記錄，並整合完整錯誤追蹤機制。
- 建立 Mattermost/Focalboard/GitLab 協作環境，支援專案任務追蹤與知識共享。

### 修正
- 修正 Redis 與 PostgreSQL 資料同步過程中資料競爭問題。
- 調整指令 system 在高併發下的 thread-safety。
- 修復 lookup 系統在特殊字元查詢時的編碼錯誤。
- 解決 logger 在多執行緒情境下訊息遺失的問題。
- 修正 event system 處理異常時未正確回報錯誤的 bug。

### 架構調整
- 重組專案檔案結構，將指令、事件、資料存取、日誌等模組拆分為獨立目錄。
- 引入 Patch 歷程記錄機制，方便追蹤每次修改內容。
- 優化資料存取層，將快取與資料庫操作解耦合。
- 增加單元測試與整合測試的目錄與範本。

### 測試與部署
- 建立自動化測試流程，確保指令與事件機制穩定。
- 整合 CI/CD 部署腳本，支援自動推送至測試與正式環境。
- 在協作平台上設置自動通知與異常警示。

### 其他備註
- 在開發過程中，針對多次 Patch 流程進行優化，提升協作效率。
- 文件持續補充，包含 API 說明、資料結構與協作流程。
- 討論與決策過程均有記錄於協作平台，方便未來查閱。

### 本日 Patch 紀錄
- 管理員權限管理全面抽象化，整合 set/zset 型態自動修正，統一使用 adminControl 工具進行權限判斷與操作，徹底解決 Redis 型態錯誤（WRONGTYPE）。
- 所有 Discord bot reply 均根據玩家個人隱私設定（replyVisibility）動態決定 ephemeral 是否公開，並集中封裝 privacyHelper 判斷邏輯。
- 新增 `/player start` 子指令，玩家可主動初始化帳號，並依照現有資料自動提示是否已建立過帳號。
- player.js、admin.js 等指令全面改用高層工具方法呼叫，減少重複、提升安全性與維護效率。
- 修正管理員重複加入/移除時的提示，操作回饋更直觀。
- 調整 replyWithPrivacy、player profile 查詢等功能，所有隱私與公開狀態顯示完全同步玩家個人設定。
- 移除單獨的 privacyHelper 工具，將 `getEphemeralForPlayer` 直接內嵌於 `replyWithPrivacy.js`，所有訊息隱私自動判斷集中於一處，提升維護一致性。
- enterprise、test 指令等所有玩家互動回覆，皆改為取得玩家資料後統一呼叫 `replyWithPrivacy`，由系統自動依據玩家隱私決定公開或私密。
- 強化所有指令回覆體驗，從個人隱私設定到 ephemeral 回覆行為，皆全面同步並自動化，不需手動判斷。