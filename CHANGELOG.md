## 進度記錄（2025-5-17）
## Progress Log (2025-5-17)

### 主要功能
### Major Features
- 完成指令 system 與 event system 實作，支援動態註冊與分派指令。
- Completed implementation of the command system and event system, supporting dynamic registration and dispatching.
- 實作 Redis 快取機制，並設計同步至 PostgreSQL 的資料持久化流程。
- Implemented Redis caching mechanism and designed a data persistence process synchronized to PostgreSQL.
- 新增玩家隱私功能，並設計 lookup 系統以查詢與控管玩家資料。
- Added player privacy features and designed a lookup system for querying and managing player data.
- 多路 logger 實作，支援不同層級與來源的日誌記錄，並整合完整錯誤追蹤機制。
- Implemented multi-channel logger supporting different levels and sources of log recording, integrated with a complete error tracking mechanism.
- 建立 Mattermost/Focalboard/GitLab 協作環境，支援專案任務追蹤與知識共享。
- Established Mattermost/Focalboard/GitLab collaboration environment supporting project task tracking and knowledge sharing.

### 修正
### Fixes
- 修正 Redis 與 PostgreSQL 資料同步過程中資料競爭問題。
- Fixed data race conditions during data synchronization between Redis and PostgreSQL.
- 調整指令 system 在高併發下的 thread-safety。
- Adjusted command system for thread-safety under high concurrency.
- 修復 lookup 系統在特殊字元查詢時的編碼錯誤。
- Fixed encoding errors in the lookup system when querying special characters.
- 解決 logger 在多執行緒情境下訊息遺失的問題。
- Resolved message loss issues in the logger under multithreaded scenarios.
- 修正 event system 處理異常時未正確回報錯誤的 bug。
- Fixed a bug where the event system did not correctly report errors during exception handling.

### 架構調整
### Architecture Adjustments
- 重組專案檔案結構，將指令、事件、資料存取、日誌等模組拆分為獨立目錄。
- Restructured project file organization, splitting command, event, data access, and logging modules into separate directories.
- 引入 Patch 歷程記錄機制，方便追蹤每次修改內容。
- Introduced a patch history recording mechanism for easy tracking of each modification.
- 優化資料存取層，將快取與資料庫操作解耦合。
- Optimized data access layer by decoupling cache and database operations.
- 增加單元測試與整合測試的目錄與範本。
- Added directories and templates for unit testing and integration testing.

### 測試與部署
### Testing and Deployment
- 建立自動化測試流程，確保指令與事件機制穩定。
- Established automated testing workflows to ensure stability of command and event mechanisms.
- 整合 CI/CD 部署腳本，支援自動推送至測試與正式環境。
- Integrated CI/CD deployment scripts supporting automatic push to testing and production environments.
- 在協作平台上設置自動通知與異常警示。
- Set up automatic notifications and anomaly alerts on collaboration platforms.

### 其他備註
### Other Notes
- 在開發過程中，針對多次 Patch 流程進行優化，提升協作效率。
- Optimized the multiple patch processes during development to improve collaboration efficiency.
- 文件持續補充，包含 API 說明、資料結構與協作流程。
- Continuously supplemented documentation, including API descriptions, data structures, and collaboration processes.
- 討論與決策過程均有記錄於協作平台，方便未來查閱。
- All discussion and decision-making processes are recorded on the collaboration platform for future reference.

### 本日 Patch 紀錄
### Today's Patch Records
- 管理員權限管理全面抽象化，整合 set/zset 型態自動修正，統一使用 adminControl 工具進行權限判斷與操作，徹底解決 Redis 型態錯誤（WRONGTYPE）。
- Fully abstracted administrator permission management, integrated automatic correction for set/zset types, unified use of the adminControl tool for permission judgment and operations, thoroughly resolving Redis type errors (WRONGTYPE).
- 所有 Discord bot reply 均根據玩家個人隱私設定（replyVisibility）動態決定 ephemeral 是否公開，並集中封裝 privacyHelper 判斷邏輯。
- All Discord bot replies dynamically determine ephemeral visibility based on player's personal privacy settings (replyVisibility), with privacyHelper judgment logic centralized.
- 新增 `/player start` 子指令，玩家可主動初始化帳號，並依照現有資料自動提示是否已建立過帳號。
- Added `/player start` subcommand allowing players to proactively initialize accounts, automatically prompting if an account already exists based on current data.
- player.js、admin.js 等指令全面改用高層工具方法呼叫，減少重複、提升安全性與維護效率。
- Commands like player.js and admin.js now fully use high-level utility method calls to reduce redundancy and improve security and maintenance efficiency.
- 修正管理員重複加入/移除時的提示，操作回饋更直觀。
- Fixed prompts for repeated administrator additions/removals, making operation feedback more intuitive.
- 調整 replyWithPrivacy、player profile 查詢等功能，所有隱私與公開狀態顯示完全同步玩家個人設定。
- Adjusted replyWithPrivacy and player profile queries so all privacy and public status displays fully synchronize with player's personal settings.
- 移除單獨的 privacyHelper 工具，將 `getEphemeralForPlayer` 直接內嵌於 `replyWithPrivacy.js`，所有訊息隱私自動判斷集中於一處，提升維護一致性。
- Removed the standalone privacyHelper tool, embedding `getEphemeralForPlayer` directly within `replyWithPrivacy.js`, centralizing all message privacy automatic judgments to improve maintenance consistency.
- enterprise、test 指令等所有玩家互動回覆，皆改為取得玩家資料後統一呼叫 `replyWithPrivacy`，由系統自動依據玩家隱私決定公開或私密。
- All player interaction replies such as enterprise and test commands now uniformly call `replyWithPrivacy` after retrieving player data, with the system automatically deciding public or private based on player privacy.
- 強化所有指令回覆體驗，從個人隱私設定到 ephemeral 回覆行為，皆全面同步並自動化，不需手動判斷。
- Enhanced all command reply experiences, fully synchronizing and automating from personal privacy settings to ephemeral reply behavior, eliminating manual judgment.
- 新增 `/enterprise create` 指令支援自訂企業名稱，並將參數傳入企業建立流程，名稱可由玩家輸入。
- Added `/enterprise create` command supporting custom enterprise names, passing parameters into the enterprise creation process, allowing player input for names.
- 調整 `createEnterprise` 與 `generateEnterprise` 函式邏輯，支援從參數中接收並儲存自訂名稱。
- Adjusted logic of `createEnterprise` and `generateEnterprise` functions to support receiving and storing custom names from parameters.
- 類型顯示邏輯從代碼轉換為對應中文名稱，提升訊息易讀性與使用者體驗。
- Type display logic converted from codes to corresponding Chinese names, improving message readability and user experience.
- 建立類型中英文對照表並整合於顯示訊息中，未來可擴充更多類型。
- Established a type Chinese-English correspondence table integrated into display messages, allowing future expansion of more types.