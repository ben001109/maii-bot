# 🌟 MAII-Bot 鷗麥麥麥 Discord 經濟系統機器人

[![install](https://img.shields.io/badge/Install-%E5%AE%89%E8%A3%9D-blue)](./docs/INSTALL.md)
[![commands](https://img.shields.io/badge/Commands-%E6%8C%87%E4%BB%A4-orange)](./docs/COMMANDS.md)
[![todo](https://img.shields.io/badge/TODO-%E5%BE%85%E8%AB%AE%E9%A0%85-lightgrey)](./docs/TODO.md)
[![docker](https://img.shields.io/badge/Docker-%E5%AE%B9%E5%99%A8%E5%8C%96-blue)](./docs/Dockreize_Processing.md)

> 鷗麥社群專屬 Discord 經濟遊戲 BOT

## 專案簡介

（略）

## 文件索引

- [安裝部署](./docs/INSTALL.md)
- [指令說明](./docs/COMMANDS.md)
- [專案架構](./docs/ARCHITECTURE.md)
- [名詞解釋](./docs/GLOSSARY.md)
- [貢獻協作](./CONTRIBUTING.md)
- [待辦與 Roadmap](./TODO.md)
- [常見問題](./docs/FAQ.md)
- [更新紀錄](./CHANGELOG.md)
- [容器化說明](./docs/Dockreize_Processing.md)

## 快速開始（Docker）

使用 Docker Compose 快速啟動服務：

```bash
# 複製並編輯環境變數
cp .env.example .env
nano .env

# 建立並啟動容器
docker-compose up -d

# 查看日誌
docker-compose logs -f maii-bot