


# 貢獻指南 (CONTRIBUTING.md)

感謝你有興趣參與 maii-bot 的開發！本文件將指引你如何參與貢獻、遵循開發流程與維護標準。

---

## 📦 專案安裝與啟動

1. 複製專案
```bash
git clone https://github.com/你的帳號/maii-bot.git
cd maii-bot
```

2. 安裝依賴
```bash
npm install
```

3. 啟動開發模式
```bash
npm run start
```

---

## 📂 專案結構

- `/src/bot/commands/`：各種指令模組（包含 subcommand）。
- `/src/services/`：封裝邏輯與資料處理。
- `/src/utils/`：公用工具，例如日誌、隱私處理等。
- `/config/`：配置檔與環境變數。

---

## ✨ 如何提交 Pull Request

1. 請從 `main` 分支建立新分支進行開發：
```bash
git checkout -b feature/你的功能名稱
```

2. 開發完成後，請確認：
   - 程式風格一致（建議使用 `biome` 自動格式化）
   - 無語法錯誤（建議使用 TypeScript 檢查）

3. 發送 Pull Request，標題格式建議如下：
```
[feat] 新增 /enterprise create 自訂名稱支援
```

4. 請在 PR 中描述：
   - 功能目的
   - 修改檔案
   - 測試方式

---

## 🧪 測試規範

- 請確認所有新增指令回傳 embed 時皆使用 `replyWithPrivacy()`。
- 測試成功應該包含：
  - `/player start` 指令可執行
  - `/enterprise create` 可創建正確名稱與類型

---

## 🧼 程式風格

- 使用 `biome` 作為程式碼格式化工具（內建 ESLint & Prettier）
- 變數命名採用駝峰式（camelCase）
- 指令檔案使用小寫，使用 `/` 分隔分類

---

## 📋 其他

- Bug 回報請開 issue 並附上錯誤訊息與重現方式
- 功能建議也歡迎開 issue 討論

---

一起讓 maii-bot 更強大 🎉