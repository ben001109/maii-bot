# Kubernetes Manifests

這個資料夾包含在 Kubernetes 環境中部署 Maii Bot 的範例檔案。若使用 k3s 或其他發行版，可直接套用下列 YAML。

- `api-deployment.yaml`：部署與 Service 設定 API 服務
- `bot-deployment.yaml`：部署 Discord Bot，需要預先建立 `discord-token` secret
- `redis-deployment.yaml`：提供暫存資料庫
- `postgres-deployment.yaml`：提供永久資料庫

請依照實際路徑與環境調整 `hostPath` 等設定。
