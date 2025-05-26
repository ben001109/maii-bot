#!/bin/bash

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 版本信息
VERSION="1.0.0"

# 全局變數
NODE_VERSION="20" # Node.js 版本設定為 20
COMPOSE_CMD="docker compose" # 使用新版 Docker Compose 命令格式
OS_TYPE=""
COMMAND=""
AUTO_CONFIRM=0
VERBOSE=0
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(dirname "$(readlink -f "$0" 2>/dev/null || echo "$0")")
cd "$SCRIPT_DIR" || { echo -e "${RED}無法切換到腳本目錄${NC}"; exit 1; }

# 以下是所有函數定義
# =========================================================

# 顯示標題橫幅
show_banner() {
    echo -e "${BLUE}==============================================${NC}"
    echo -e "${BLUE}       MAII-Bot 管理工具 v${VERSION}       ${NC}"
    echo -e "${BLUE}==============================================${NC}"
    echo ""
}

# 顯示使用說明
show_usage() {
    show_banner
    echo -e "${CYAN}用法: ${SCRIPT_NAME} [選項] <命令>${NC}"
    echo ""
    echo -e "${YELLOW}命令:${NC}"
    echo -e "  ${GREEN}setup${NC}       - 初始化環境和配置"
    echo -e "  ${GREEN}start${NC}       - 啟動服務"
    echo -e "  ${GREEN}stop${NC}        - 停止服務"
    echo -e "  ${GREEN}restart${NC}     - 重新啟動服務"
    echo -e "  ${GREEN}status${NC}      - 查看服務狀態"
    echo -e "  ${GREEN}logs${NC}        - 查看日誌"
    echo -e "  ${GREEN}update${NC}      - 更新並重新啟動服務"
    echo -e "  ${GREEN}clean${NC}       - 清理環境（刪除容器和卷）"
    echo -e "  ${GREEN}reset${NC}       - 重置配置（刪除 .env 和 docker-compose.yml）"
    echo -e "  ${GREEN}check${NC}       - 檢查環境"
    echo -e "  ${GREEN}backup${NC}      - 備份資料庫"
    echo -e "  ${GREEN}restore${NC}     - 恢復資料庫"
    echo -e "  ${GREEN}help${NC}        - 顯示此幫助信息"
    echo ""
    echo -e "${YELLOW}選項:${NC}"
    echo -e "  ${GREEN}-y, --yes${NC}   - 自動確認所有提示（非交互模式）"
    echo -e "  ${GREEN}-v, --verbose${NC} - 顯示詳細輸出"
    echo -e "  ${GREEN}-h, --help${NC}  - 顯示此幫助信息"
    echo ""
    echo -e "${YELLOW}環境配置:${NC}"
    echo -e "  當前 Node.js 版本: ${CYAN}${NODE_VERSION}${NC}"
    echo -e "  更改 Node.js 版本可使用 '${SCRIPT_NAME} update' 命令"
    echo ""
    echo -e "${YELLOW}範例:${NC}"
    echo -e "  ${SCRIPT_NAME}                    # 顯示此幫助信息"
    echo -e "  ${SCRIPT_NAME} setup              # 初始化環境"
    echo -e "  ${SCRIPT_NAME} start              # 啟動服務"
    echo -e "  ${SCRIPT_NAME} update             # 更新服務"
    echo -e "  ${SCRIPT_NAME} --yes clean        # 無提示清理環境"
    echo ""
    echo -e "沒有提供命令時，自動顯示此幫助信息"
    echo -e "${YELLOW}必須指定一個命令才能執行操作${NC}"
    echo ""
}

    # 交互式詢問是/否問題，返回布爾值 (0=是，1=否)
    prompt_yes_no() {
    local prompt="$1"
    local default="${2:-y}"  # 預設值，沒有提供則為 y
    local response

    # 如果設置了自動確認標誌，直接返回是
    if [ $AUTO_CONFIRM -eq 1 ]; then
        return 0
    fi

    # 根據預設值調整提示
    if [ "$default" = "y" ] || [ "$default" = "Y" ]; then
        prompt="${prompt} (Y/n): "
    else
        prompt="${prompt} (y/N): "
    fi

    # 讀取用戶輸入
    read -p "$prompt" response

    # 如果用戶沒有輸入，使用預設值
    if [ -z "$response" ]; then
        response=$default
    fi

    # 將輸入轉換為小寫
    response=$(echo "$response" | tr '[:upper:]' '[:lower:]')

    # 檢查結果
    if [ "$response" = "y" ]; then
        return 0  # 是
    else
        return 1  # 否
    fi
    }

# 檢測操作系統類型
detect_os() {
  if [[ "$(uname)" == "Darwin" ]]; then
    echo "macos"
  elif [[ "$(uname)" == "Linux" ]]; then
    if [[ -f /etc/lsb-release ]]; then
      source /etc/lsb-release
      if [[ "$DISTRIB_ID" == "Ubuntu" ]]; then
        echo "ubuntu"
      else
        echo "linux"
      fi
    elif [[ -f /etc/os-release ]]; then
      source /etc/os-release
      if [[ "$ID" == "ubuntu" ]]; then
        echo "ubuntu"
      else
        echo "linux"
      fi
    else
      echo "linux"
    fi
  else
    echo "unknown"
  fi
}

# 在 main 函數中會檢測操作系統類型
# 這裡不需要提前檢測

# 檢查是否以 root 權限運行（用於某些操作）
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${YELLOW}注意: 非 root 使用者執行，某些操作可能需要權限${NC}"
        echo -e "${YELLOW}如果遇到權限問題，請使用 sudo 執行此腳本${NC}"
        sleep 2
    fi
}

# 檢查基本依賴
check_dependencies() {
    local missing_deps=0

    # 檢查 Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}錯誤: 未安裝 Docker${NC}"
        missing_deps=1
    else
        docker_version=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
        echo -e "${GREEN}✓ Docker 已安裝 (版本: $docker_version)${NC}"

        # 檢查 Docker 守護程序是否運行
        if ! docker info &> /dev/null; then
            echo -e "${RED}錯誤: Docker 守護程序未運行${NC}"

            if [[ "$OS_TYPE" == "macos" ]]; then
                # macOS 特定的 Docker 啟動方式
                echo -e "${YELLOW}在 macOS 上，請確保 Docker Desktop 已啟動${NC}"
                echo -e "${YELLOW}您可以在應用程式資料夾中找到 Docker Desktop 並啟動它${NC}"

                # 檢查 Docker Desktop 是否已安裝
                if [ -d "/Applications/Docker.app" ]; then
                    echo -e "${YELLOW}是否要嘗試啟動 Docker Desktop? (y/n): ${NC}"
                    read -r start_docker
                    if [[ "$start_docker" == "y" ]]; then
                        echo -e "${BLUE}正在嘗試啟動 Docker Desktop...${NC}"
                        open -a Docker
                        echo -e "${YELLOW}請等待 Docker Desktop 完全啟動後再繼續...${NC}"
                        sleep 10

                        # 再次檢查 Docker 是否運行
                        if ! docker info &> /dev/null; then
                            echo -e "${RED}Docker 仍未運行，請手動啟動 Docker Desktop 並等待它完全啟動後再執行此腳本${NC}"
                            exit 1
                        else
                            echo -e "${GREEN}✓ Docker 守護程序現在已運行${NC}"
                        fi
                    else
                        echo -e "${RED}請手動啟動 Docker Desktop 後再執行此腳本${NC}"
                        exit 1
                    fi
                else
                    echo -e "${RED}找不到 Docker Desktop，請確保它已正確安裝${NC}"
                    exit 1
                fi
            elif [[ "$OS_TYPE" == "ubuntu" ]] || [[ "$OS_TYPE" == "linux" ]]; then
                # Ubuntu/Linux 特定的 Docker 啟動方式
                echo -e "${YELLOW}在 Linux 上，嘗試啟動 Docker 服務...${NC}"

                # 檢查當前用戶是否在 docker 群組中
                if id -nG "$USER" | grep -qw "docker"; then
                    echo -e "${YELLOW}嘗試啟動 Docker 服務...${NC}"
                    if [[ "$OS_TYPE" == "ubuntu" ]]; then
                        echo -e "${YELLOW}執行: sudo systemctl start docker${NC}"
                        sudo systemctl start docker
                    else
                        echo -e "${YELLOW}執行: sudo service docker start${NC}"
                        sudo service docker start 2>/dev/null || sudo systemctl start docker
                    fi

                    # 等待 Docker 啟動
                    echo -e "${YELLOW}等待 Docker 服務啟動...${NC}"
                    sleep 5

                    # 再次檢查 Docker 是否運行
                    if ! docker info &> /dev/null; then
                        echo -e "${RED}Docker 服務無法啟動，請檢查系統日誌或手動啟動${NC}"
                        exit 1
                    else
                        echo -e "${GREEN}✓ Docker 服務已成功啟動${NC}"
                    fi
                else
                    echo -e "${RED}當前用戶 $(whoami) 不在 docker 群組中，這可能導致權限問題${NC}"
                    echo -e "${YELLOW}建議執行以下命令將用戶添加到 docker 群組:${NC}"
                    echo -e "${YELLOW}sudo usermod -aG docker $USER${NC}"
                    echo -e "${YELLOW}然後重新登入或重新啟動系統${NC}"

                    echo -e "${YELLOW}現在嘗試使用 sudo 啟動 Docker...${NC}"
                    sudo systemctl start docker || sudo service docker start
                    sleep 5

                    if ! sudo docker info &> /dev/null; then
                        echo -e "${RED}Docker 服務無法啟動，請檢查系統日誌${NC}"
                        exit 1
                    else
                        echo -e "${GREEN}✓ Docker 服務已成功啟動，但需要 sudo 權限${NC}"
                        echo -e "${YELLOW}腳本將繼續使用 sudo 執行 Docker 命令${NC}"
                    fi
                fi
            else
                echo -e "${RED}未知的操作系統類型，無法自動啟動 Docker${NC}"
                echo -e "${YELLOW}請手動啟動 Docker 後再執行此腳本${NC}"
                exit 1
            fi
        fi
    fi

    # 檢查 Docker Compose 版本
    check_docker_compose_version() {
        if command -v docker-compose &> /dev/null; then
            compose_cmd="docker-compose"
            compose_version=$(docker-compose --version | cut -d ' ' -f3 | cut -d ',' -f1)
            echo -e "  Docker Compose: ${GREEN}已安裝${NC} (獨立版本 $compose_version)"
            COMPOSE_CMD="docker-compose"
            return 0
        elif docker compose version &> /dev/null; then
            compose_cmd="docker compose"
            compose_version=$(docker compose version --short 2>/dev/null || docker compose version | head -n 1 | awk '{print $4}')
            echo -e "  Docker Compose: ${GREEN}已安裝${NC} (插件版本 $compose_version)"
            COMPOSE_CMD="docker compose"
            return 0
        else
            echo -e "  Docker Compose: ${RED}未安裝${NC}"
            return 1
        fi
    }

    # 在 check_dependencies 函數中使用上面的函數
    # 檢查 Docker Compose
    local missing_deps=0
    echo -e "檢查 Docker Compose..."
    if ! check_docker_compose_version; then
        missing_deps=1
    fi

    # 儲存 compose 命令供後續使用
    COMPOSE_CMD=$compose_cmd

    if [ $missing_deps -eq 1 ]; then
        echo -e "${YELLOW}請安裝缺少的依賴套件後再執行此腳本${NC}"
        if [[ "$OS_TYPE" == "macos" ]]; then
            echo -e "${YELLOW}在 macOS 上，建議使用 Docker Desktop，它包含 Docker 和 Docker Compose${NC}"
            echo -e "${YELLOW}下載地址: https://www.docker.com/products/docker-desktop/${NC}"
        elif [[ "$OS_TYPE" == "ubuntu" ]]; then
            echo -e "${YELLOW}在 Ubuntu 上安裝 Docker:${NC}"
            echo -e "${YELLOW}sudo apt update && sudo apt install -y docker.io${NC}"
            echo -e "${YELLOW}安裝 Docker Compose:${NC}"
            echo -e "${YELLOW}sudo apt install -y docker-compose${NC}"
            echo -e "${YELLOW}將用戶添加到 docker 群組:${NC}"
            echo -e "${YELLOW}sudo usermod -aG docker $USER && newgrp docker${NC}"
        else
            echo -e "${YELLOW}Docker 安裝指南: https://docs.docker.com/get-docker/${NC}"
            echo -e "${YELLOW}Docker Compose 安裝指南: https://docs.docker.com/compose/install/${NC}"
        fi
        exit 1
    fi

            # 設置 Node.js 版本
            echo -e "\n${CYAN}設置 Node.js 版本...${NC}"
            if [ $AUTO_CONFIRM -eq 1 ]; then
        # 在自動確認模式下使用預設版本
        echo -e "使用預設 Node.js 版本: ${NODE_VERSION}"
            else
        echo -e "當前 Node.js 版本設置為: ${NODE_VERSION}"
        if prompt_yes_no "是否要更改 Node.js 版本？"; then
            read -p "請輸入 Node.js 版本 (推薦: 20, 18, 16): " new_node_version
            if [[ -n "$new_node_version" ]]; then
                NODE_VERSION="$new_node_version"
                echo -e "${GREEN}Node.js 版本已設置為: ${NODE_VERSION}${NC}"
            else
                echo -e "${YELLOW}保持當前 Node.js 版本: ${NODE_VERSION}${NC}"
            fi
        else
            echo -e "${YELLOW}保持當前 Node.js 版本: ${NODE_VERSION}${NC}"
        fi
            fi

    # 檢查 Node.js 配置
    echo -e "\n${CYAN}1a. Node.js 配置:${NC}"
    echo -e "  配置的 Node.js 版本: ${NODE_VERSION}"
    if [ -f docker-compose.yml ]; then
        node_image=$(grep -o "image: node:.*" docker-compose.yml | head -1)
        echo -e "  Docker Compose 中使用的映像: ${node_image}"

        if [[ "$node_image" == *"node:${NODE_VERSION}"* ]]; then
            echo -e "  Node.js 版本一致性: ${GREEN}正確${NC}"
        else
            echo -e "  Node.js 版本一致性: ${RED}不一致${NC}"
            echo -e "  ${YELLOW}建議重新生成 Docker Compose 配置${NC}"
        fi
    else
        echo -e "  ${RED}找不到 docker-compose.yml 文件${NC}"
    fi
}

# 檢查 docker-compose.yml 並在需要時建立
check_docker_compose() {
    if [ ! -f docker-compose.yml ]; then
        echo -e "${YELLOW}警告: docker-compose.yml 不存在${NC}"
        if [ $AUTO_CONFIRM -eq 1 ] || prompt_yes_no "是否要建立預設的 docker-compose.yml?" 1; then
            echo -e "${GREEN}正在建立 docker-compose.yml...${NC}"

            # 建立預設的 docker-compose.yml
            cat > docker-compose.yml << 'EOL'
# 現代化的 Docker Compose 文件，無需 version 屬性

services:
  maii-bot:
    image: node:20-alpine
    container_name: maii-bot
    restart: unless-stopped
    working_dir: /app
    volumes:
      - ./:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    environment:
      - NODE_ENV=production
    command: >
      sh -c "npm install --omit=dev && 
             npx prisma generate && 
             npx prisma migrate deploy && 
             node src/index.js"
    networks:
      - maii-network

  postgres:
    image: postgres:14-alpine
    container_name: maii-postgres
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: dbpassword
      POSTGRES_USER: bot
      POSTGRES_DB: maii
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - maii-network
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    container_name: maii-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - maii-network
    ports:
      - "6379:6379"

networks:
  maii-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
EOL

            # 若有設置 NODE_VERSION，更新 docker-compose.yml 中的版本
            if [[ "$OS_TYPE" == "macos" ]]; then
                # macOS 需要不同的 sed 語法
                sed -i '' "s/image: node:20-alpine/image: node:${NODE_VERSION}-alpine/g" docker-compose.yml
            else
                sed -i "s/image: node:20-alpine/image: node:${NODE_VERSION}-alpine/g" docker-compose.yml
            fi

            echo -e "${GREEN}已建立 docker-compose.yml${NC}"
        else
            echo -e "${YELLOW}請手動建立 docker-compose.yml 後再執行此腳本${NC}"
            exit 1
        fi
    fi
}

# 驗證輸入不為空
validate_input() {
    local value=$1
    local name=$2

    if [ -z "$value" ]; then
        echo -e "${RED}錯誤: $name 不能為空${NC}"
        return 1
    fi
    return 0
}

# 解析命令行參數
parse_args() {
    # 重置全局變數（已在腳本頂部定義）
    AUTO_CONFIRM=0
    VERBOSE=0
    COMMAND=""  # 初始化為空

    # 檢查參數數量，如果沒有參數則顯示幫助並立即退出
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 0
    fi

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -y|--yes)
                AUTO_CONFIRM=1
                shift
                ;;
            -v|--verbose)
                VERBOSE=1
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            setup|start|stop|restart|status|logs|update|clean|reset|check|backup|restore)
                COMMAND="$1"
                shift
                ;;
            help)
                # help 命令只顯示幫助信息然後退出
                show_usage
                exit 0
                ;;
            *)
                echo -e "${RED}錯誤: 未知選項或命令 '$1'${NC}"
                echo -e "${YELLOW}使用 ${SCRIPT_NAME} help 獲取幫助信息${NC}"
                exit 1
                ;;
        esac
    done

    # 如果處理完所有參數後 COMMAND 仍為空，顯示錯誤
    if [[ -z "$COMMAND" ]]; then
        echo -e "${RED}錯誤: 未指定有效命令${NC}"
        echo -e "${YELLOW}使用 ${SCRIPT_NAME} help 獲取幫助信息${NC}"
        exit 1
    fi
}

# 顯示標題
show_header() {
    local title="$1"
    echo -e "${BLUE}==============================================${NC}"
    echo -e "${BLUE}       ${title}       ${NC}"
    echo -e "${BLUE}==============================================${NC}"
    echo ""
}

# 主函數定義 - 在所有其他函數調用之前
main() {
    # 檢查是否有命令行參數
    if [[ $# -eq 0 ]]; then
        # 沒有參數時，直接顯示幫助並退出
        show_usage
        exit 0
    fi

    # 解析命令行參數
    parse_args "$@"

    # 如果執行到這裡，說明有參數並且已經解析了有效命令

    # 檢測操作系統
    OS_TYPE=$(detect_os)

    if [ $VERBOSE -eq 1 ]; then
        echo -e "${BLUE}檢測到操作系統: ${OS_TYPE}${NC}"
        echo -e "${BLUE}腳本目錄: ${SCRIPT_DIR}${NC}"
        echo -e "${BLUE}腳本名稱: ${SCRIPT_NAME}${NC}"
        echo -e "${BLUE}運行模式: ${COMMAND}${NC}"
        if [ $AUTO_CONFIRM -eq 1 ]; then
            echo -e "${BLUE}自動確認: 是${NC}"
        fi
        echo ""
    fi

    # 執行對應的命令
    case "$COMMAND" in
        setup)
            run_setup
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            check_status
            ;;
        logs)
            show_logs
            ;;
        update)
            update_services
            ;;
        clean)
            clean_environment
            ;;
        reset)
            reset_configuration
            ;;
        check)
            check_environment
            ;;
        backup)
            backup_database
            ;;
        restore)
            restore_database
            ;;
        *)
            # 理論上這裡不會被執行到，因為 parse_args 已經過濾了無效命令
            echo -e "${RED}錯誤: 未知命令 '${COMMAND}'${NC}"
            show_usage
            exit 1
            ;;
    esac
}

# 設定執行函數
run_setup() {
    show_header "MAII-Bot Discord 機器人設定精靈"
    echo -e "${YELLOW}這個過程將幫助您設定 MAII-Bot 所需的環境變數${NC}"
    echo -e "${YELLOW}並準備 Docker 容器化環境${NC}"
    echo ""

    # 執行檢查
    check_root
    check_dependencies
    check_docker_compose

    # 執行核心設定流程
    perform_setup
}

# 實作 setup 函數的核心功能
perform_setup() {
    # 確認 .env 檔案是否存在
    if [ -f .env ]; then
        echo -e "${YELLOW}警告: .env 檔案已存在${NC}"
        if ! confirm_action "是否要覆蓋?" 0; then
            echo -e "${GREEN}設定已取消${NC}"
            return 0
        fi
    fi

    # 收集 Discord 相關資訊
    echo -e "${BLUE}Discord 設定${NC}"
    echo -e "${YELLOW}請前往 Discord Developer Portal 獲取相關資訊${NC}"
    echo -e "${YELLOW}https://discord.com/developers/applications${NC}"
    echo ""

    while true; do
        read -p "Discord Bot Token: " discord_token
        if validate_input "$discord_token" "Discord Bot Token"; then
            break
        fi
    done

    while true; do
        read -p "Discord 應用程式 ID: " discord_client_id
        if validate_input "$discord_client_id" "Discord 應用程式 ID"; then
            break
        fi
    done

    echo -e "${YELLOW}提示：機器人會自動同步所有加入的伺服器，無需手動指定伺服器 ID${NC}"

    # 收集資料庫設定
    echo -e "\n${BLUE}資料庫設定 (PostgreSQL)${NC}"
    read -p "資料庫名稱 [maii]: " db_name
    db_name=${db_name:-maii}

    read -p "資料庫使用者 [bot]: " db_user
    db_user=${db_user:-bot}

    read -p "資料庫密碼 [dbpassword]: " db_password
    db_password=${db_password:-dbpassword}

    # 機器人設定
    echo -e "\n${BLUE}機器人基本設定${NC}"
    echo -e "${YELLOW}斜線指令 (Slash Commands) 不需要前綴，直接使用 / 觸發${NC}"

    read -p "預設語言 [zh-TW]: " bot_language
    bot_language=${bot_language:-zh-TW}

    # 建立 .env 檔案
    echo -e "\n${GREEN}正在生成 .env 檔案...${NC}"

    cat > .env << EOL
# Discord 設定
DISCORD_TOKEN=${discord_token}
DISCORD_CLIENT_ID=${discord_client_id}

# 資料庫設定
DATABASE_URL=postgresql://${db_user}:${db_password}@postgres:5432/${db_name}

# Redis 設定
REDIS_URL=redis://redis:6379

# 機器人設定
BOT_LANGUAGE=${bot_language}

# 環境設定
NODE_ENV=production
LOG_LEVEL=info
EOL

    # 更新 docker-compose.yml 中的資料庫資訊
    echo -e "${GREEN}正在更新 docker-compose.yml...${NC}"

    # 根據操作系統使用適當的 sed 命令
    if [[ "$OS_TYPE" == "macos" ]]; then
        # macOS 上的 sed 命令需要不同的語法
        sed -i '' "s/POSTGRES_DB: maii/POSTGRES_DB: ${db_name}/g" docker-compose.yml || echo -e "${YELLOW}警告: 更新資料庫名稱失敗${NC}"
        sed -i '' "s/POSTGRES_USER: bot/POSTGRES_USER: ${db_user}/g" docker-compose.yml || echo -e "${YELLOW}警告: 更新資料庫使用者失敗${NC}"
        sed -i '' "s/POSTGRES_PASSWORD: dbpassword/POSTGRES_PASSWORD: ${db_password}/g" docker-compose.yml || echo -e "${YELLOW}警告: 更新資料庫密碼失敗${NC}"
    else
        # Linux 上的 sed 命令
        sed -i "s/POSTGRES_DB: maii/POSTGRES_DB: ${db_name}/g" docker-compose.yml || echo -e "${YELLOW}警告: 更新資料庫名稱失敗${NC}"
        sed -i "s/POSTGRES_USER: bot/POSTGRES_USER: ${db_user}/g" docker-compose.yml || echo -e "${YELLOW}警告: 更新資料庫使用者失敗${NC}"
        sed -i "s/POSTGRES_PASSWORD: dbpassword/POSTGRES_PASSWORD: ${db_password}/g" docker-compose.yml || echo -e "${YELLOW}警告: 更新資料庫密碼失敗${NC}"
    fi

    # 確保目錄權限正確
    echo -e "${GREEN}正在檢查目錄權限...${NC}"
    if [ -d "prisma" ]; then
        chmod -R 755 prisma || echo -e "${YELLOW}警告: 無法設定 prisma 目錄權限${NC}"
    fi

    if [ -d "node_modules" ]; then
        chmod -R 755 node_modules || echo -e "${YELLOW}警告: 無法設定 node_modules 目錄權限${NC}"
    fi

    # 顯示設定完成訊息
    echo -e "\n${GREEN}設定完成!${NC}"
    echo -e "${YELLOW}您現在可以使用以下命令啟動 MAII-Bot:${NC}"
    echo -e "  ${GREEN}${SCRIPT_NAME} start${NC}"
    echo ""
    echo -e "${YELLOW}若要查看更多指令幫助:${NC}"
    echo -e "  ${GREEN}${SCRIPT_NAME} help${NC}"

    # 添加操作系統特定說明
    if [[ "$OS_TYPE" == "ubuntu" ]] || [[ "$OS_TYPE" == "linux" ]]; then
        echo -e "\n${YELLOW}Ubuntu/Linux 特別說明:${NC}"
        echo -e "1. 如果遇到權限問題，請嘗試使用 sudo 執行命令"
        echo -e "2. 確保當前用戶已添加到 docker 群組 (sudo usermod -aG docker $USER)"
        echo -e "3. 對於生產環境，建議設置 Docker 和服務自動啟動:"
        echo -e "   ${GREEN}sudo systemctl enable docker${NC}"
    elif [[ "$OS_TYPE" == "macos" ]]; then
        echo -e "\n${YELLOW}macOS 特別說明:${NC}"
        echo -e "1. 請確保 Docker Desktop 在使用機器人前已經啟動"
        echo -e "2. 若需要讓 Docker Desktop 開機自動啟動，請在其設置中勾選相應選項"
        echo -e "3. 詳細指南請參考: docs/macOS_Docker_Setup.md"
    fi

    echo -e "\n${BLUE}==============================================${NC}"
    echo -e "${BLUE}       感謝使用 MAII-Bot 設定精靈!           ${NC}"
    echo -e "${BLUE}==============================================${NC}"

    # 提供更多指導
    echo -e "\n${YELLOW}重要提示:${NC}"
    echo -e "1. 機器人使用 Discord 的斜線指令系統，所有指令以 / 開頭"
    echo -e "2. 機器人啟動後會自動同步指令到所有已加入的伺服器"
    echo -e "3. 加入新伺服器時，指令會自動同步，無需手動操作"
    echo -e "4. 使用 /admin 相關指令可設置管理員權限"
    echo -e "5. 所有指令文件會自動從 commands 目錄讀取並註冊"
    echo -e "6. 機器人使用 PostgreSQL 資料庫，與 schema.prisma 的設置一致"
    echo ""

    # 詢問是否立即啟動服務
    if confirm_action "是否要立即啟動 MAII-Bot?" 1; then
        start_services
    fi
}

# 詢問確認
confirm_action() {
    local message="$1"
    local default_yes="$2"  # 1 表示預設是 yes，0 表示預設是 no

    if [ $AUTO_CONFIRM -eq 1 ]; then
        return 0  # 自動確認模式下，直接返回確認
    fi

    local prompt
    if [ "$default_yes" = "1" ]; then
        prompt="$message (Y/n): "
    else
        prompt="$message (y/N): "
    fi

    read -p "$prompt" response
    response=$(echo "$response" | tr '[:upper:]' '[:lower:]')

    if [ "$default_yes" = "1" ]; then
        [[ -z "$response" || "$response" = "y" || "$response" = "yes" ]]
    else
        [[ "$response" = "y" || "$response" = "yes" ]]
    fi
}

# 確保 Docker 正在運行
ensure_docker_running() {
    local silent="${1:-1}"  # 默認不靜默

    if ! docker info &> /dev/null; then
        if [ "$silent" -eq 0 ]; then
            return 1
        fi

        echo -e "${YELLOW}Docker 未運行，嘗試啟動...${NC}"

        if [[ "$OS_TYPE" == "macos" ]]; then
            # macOS 上啟動 Docker Desktop
            if [ -d "/Applications/Docker.app" ]; then
                echo -e "${YELLOW}嘗試啟動 Docker Desktop...${NC}"
                open -a Docker
                echo -e "${YELLOW}等待 Docker Desktop 啟動...${NC}"

                # 等待 Docker 啟動，最多等待 30 秒
                local counter=0
                while ! docker info &> /dev/null && [ $counter -lt 30 ]; do
                    echo -n "."
                    sleep 1
                    counter=$((counter+1))
                done
                echo ""

                if docker info &> /dev/null; then
                    echo -e "${GREEN}Docker 已成功啟動${NC}"
                    return 0
                else
                    echo -e "${RED}Docker 啟動失敗，請手動啟動 Docker Desktop${NC}"
                    return 1
                fi
            else
                echo -e "${RED}找不到 Docker Desktop，請確保已安裝${NC}"
                return 1
            fi
        elif [[ "$OS_TYPE" == "ubuntu" ]] || [[ "$OS_TYPE" == "linux" ]]; then
            # Ubuntu/Linux 上啟動 Docker 服務
            echo -e "${YELLOW}嘗試啟動 Docker 服務...${NC}"

            if sudo systemctl start docker &> /dev/null || sudo service docker start &> /dev/null; then
                echo -e "${YELLOW}等待 Docker 服務啟動...${NC}"
                sleep 5

                if docker info &> /dev/null; then
                    echo -e "${GREEN}Docker 服務已成功啟動${NC}"
                    return 0
                else
                    echo -e "${RED}Docker 服務啟動失敗${NC}"
                    return 1
                fi
            else
                echo -e "${RED}無法啟動 Docker 服務，請檢查 Docker 安裝${NC}"
                return 1
            fi
        else
            echo -e "${RED}未知的操作系統類型，無法自動啟動 Docker${NC}"
            return 1
        fi
    fi

    return 0  # Docker 已運行
}

# 檢查是否已經配置
check_configured() {
    if [ ! -f .env ] || [ ! -f docker-compose.yml ]; then
        echo -e "${YELLOW}警告: 尚未完成配置，請先運行 setup 命令${NC}"
        if confirm_action "是否現在運行設定精靈?" 0; then
            run_setup
        else
            exit 1
        fi
    fi
}

# 啟動服務
start_services() {
    show_header "啟動 MAII-Bot 服務"

    # 檢查配置
    check_configured

    # 檢查 Docker 運行狀態
    ensure_docker_running

    echo -e "${GREEN}正在啟動 MAII-Bot...${NC}"

    # 根據 Docker Compose 命令格式啟動服務
    if [[ "$OS_TYPE" == "ubuntu" ]] || [[ "$OS_TYPE" == "linux" ]]; then
        # 檢查是否需要 sudo
        if ! docker info &> /dev/null && sudo docker info &> /dev/null; then
            echo -e "${YELLOW}使用 sudo 啟動服務${NC}"
            sudo $COMPOSE_CMD up -d
        else
            $COMPOSE_CMD up -d
        fi
    else
        $COMPOSE_CMD up -d
    fi

    # 檢查是否成功啟動
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}MAII-Bot 已啟動!${NC}"
        echo -e "${YELLOW}可使用以下命令查看日誌:${NC}"
        echo -e "  ${GREEN}$0 logs${NC}"
    else
        echo -e "${RED}啟動失敗，請檢查錯誤訊息${NC}"
        echo -e "${YELLOW}嘗試運行以下命令查看詳細錯誤:${NC}"
        echo -e "  ${GREEN}$0 logs${NC}"
    fi
}

# 停止服務
stop_services() {
    show_header "停止 MAII-Bot 服務"

    # 檢查配置
    check_configured

    # 檢查 Docker 運行狀態
    ensure_docker_running

    echo -e "${YELLOW}正在停止 MAII-Bot...${NC}"

    # 根據 Docker Compose 命令格式停止服務
    if [[ "$OS_TYPE" == "ubuntu" ]] || [[ "$OS_TYPE" == "linux" ]]; then
        # 檢查是否需要 sudo
        if ! docker info &> /dev/null && sudo docker info &> /dev/null; then
            echo -e "${YELLOW}使用 sudo 停止服務${NC}"
            sudo $COMPOSE_CMD down
        else
            $COMPOSE_CMD down
        fi
    else
        $COMPOSE_CMD down
    fi

    # 檢查是否成功停止
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}MAII-Bot 已停止!${NC}"
    else
        echo -e "${RED}停止失敗，請檢查錯誤訊息${NC}"
    fi
}

# 重啟服務
restart_services() {
    show_header "重啟 MAII-Bot 服務"

    # 檢查配置
    check_configured

    # 檢查 Docker 運行狀態
    ensure_docker_running

    echo -e "${YELLOW}正在重啟 MAII-Bot...${NC}"

    # 根據 Docker Compose 命令格式重啟服務
    if [[ "$OS_TYPE" == "ubuntu" ]] || [[ "$OS_TYPE" == "linux" ]]; then
        # 檢查是否需要 sudo
        if ! docker info &> /dev/null && sudo docker info &> /dev/null; then
            echo -e "${YELLOW}使用 sudo 重啟服務${NC}"
            sudo $COMPOSE_CMD restart
        else
            $COMPOSE_CMD restart
        fi
    else
        $COMPOSE_CMD restart
    fi

    # 檢查是否成功重啟
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}MAII-Bot 已重啟!${NC}"
        echo -e "${YELLOW}可使用以下命令查看日誌:${NC}"
        echo -e "  ${GREEN}$0 logs${NC}"
    else
        echo -e "${RED}重啟失敗，請檢查錯誤訊息${NC}"
    fi
}

# 查看服務狀態
check_status() {
    show_header "MAII-Bot 服務狀態"

    # 檢查配置
    check_configured

    # 檢查 Docker 運行狀態
    if ! ensure_docker_running 0; then
        echo -e "${RED}Docker 未運行，無法檢查服務狀態${NC}"
        return 1
    fi

    echo -e "${CYAN}容器狀態:${NC}"
    docker ps --filter "name=maii-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    echo -e "\n${CYAN}資源使用情況:${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(docker ps -q --filter "name=maii-")
}

# 查看日誌
show_logs() {
    show_header "MAII-Bot 服務日誌"

    # 檢查配置
    check_configured

    # 檢查 Docker 運行狀態
    if ! ensure_docker_running 0; then
        echo -e "${RED}Docker 未運行，無法查看日誌${NC}"
        return 1
    fi

    echo -e "${YELLOW}顯示 MAII-Bot 最近日誌 (Ctrl+C 停止查看)${NC}"

    # 檢查是否需要 sudo
    if [[ "$OS_TYPE" == "ubuntu" ]] || [[ "$OS_TYPE" == "linux" ]]; then
        if ! docker info &> /dev/null && sudo docker info &> /dev/null; then
            sudo $COMPOSE_CMD logs -f maii-bot
        else
            $COMPOSE_CMD logs -f maii-bot
        fi
    else
        $COMPOSE_CMD logs -f maii-bot
    fi
}

# 更新服務
update_services() {
    show_header "更新 MAII-Bot 服務"

    # 檢查配置
    check_configured

    # 檢查 Docker 運行狀態
    ensure_docker_running

    echo -e "${GREEN}正在更新 MAII-Bot...${NC}"

    # 拉取最新代碼
    echo -e "${YELLOW}拉取最新代碼...${NC}"
    git pull

    # 重新啟動服務
    echo -e "${YELLOW}重新啟動服務...${NC}"
    restart_services

    echo -e "${GREEN}MAII-Bot 已更新並重啟!${NC}"
}

# 清理環境
clean_environment() {
    show_header "清理 MAII-Bot 環境"

    if ! confirm_action "此操作將刪除所有容器和卷，但保留配置文件。是否繼續?" 0; then
        echo -e "${YELLOW}操作已取消${NC}"
        return
    fi

    # 檢查 Docker 運行狀態
    ensure_docker_running

    echo -e "${YELLOW}正在停止並移除所有容器...${NC}"
    $COMPOSE_CMD down -v

    echo -e "${GREEN}環境已清理完成!${NC}"
}

# 重置配置
reset_configuration() {
    show_header "重置 MAII-Bot 配置"

    if ! confirm_action "此操作將刪除 .env 和 docker-compose.yml 配置文件。是否繼續?" 0; then
        echo -e "${YELLOW}操作已取消${NC}"
        return
    fi

    # 停止所有服務
    if [ -f docker-compose.yml ]; then
        echo -e "${YELLOW}停止所有服務...${NC}"
        $COMPOSE_CMD down
    fi

    # 刪除配置文件
    echo -e "${YELLOW}刪除配置文件...${NC}"
    rm -f .env docker-compose.yml

    echo -e "${GREEN}配置已重置!${NC}"
    echo -e "${YELLOW}可使用以下命令重新配置:${NC}"
    echo -e "  ${GREEN}$0 setup${NC}"
}

# 檢查環境
check_environment() {
    show_header "檢查 MAII-Bot 環境"

    # 檢查系統環境
    echo -e "${CYAN}系統信息:${NC}"
    echo -e "  操作系統: ${OS_TYPE}"
    echo -e "  主機名: $(hostname)"
    echo -e "  用戶: $(whoami)"

    # 檢查依賴
    echo -e "\n${CYAN}檢查依賴:${NC}"
    check_dependencies

    # 檢查配置文件
    echo -e "\n${CYAN}配置文件:${NC}"
    if [ -f .env ]; then
        echo -e "  .env: ${GREEN}存在${NC}"
        # 檢查必要的環境變量是否已設置
        if grep -q "DISCORD_TOKEN" .env && grep -q "DATABASE_URL" .env; then
            echo -e "  配置: ${GREEN}關鍵設置已完成${NC}"
        else
            echo -e "  配置: ${RED}缺少關鍵設置${NC}"
        fi
    else
        echo -e "  .env: ${RED}不存在${NC}"
    fi

    # 創建 prisma 目錄和 schema.prisma 文件（如果不存在）
    if [ ! -d "prisma" ]; then
        mkdir -p prisma
    fi

    if [ ! -f "prisma/schema.prisma" ]; then
        echo -e "\n${CYAN}正在生成 Prisma Schema 文件...${NC}"
        cat > prisma/schema.prisma << EOL
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Player {
  id        String   @id @default(uuid())
  discordId String   @unique
  money     Int      @default(500)
  privacy   Json?
  enterprises String[] @default([])
}
// 這是 Prisma 的資料庫結構定義文件

// 管理員表格
model Admin {
  id          String   @id @default(uuid())
  discordId   String   @unique // Discord 用戶 ID
  username    String   // Discord 用戶名
  permissions String[] // 權限列表
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("admins")
  @@index([discordId])
}

// 用戶表格
model User {
  id        String   @id @default(uuid())
  discordId String   @unique // Discord 用戶 ID
  username  String   // Discord 用戶名
  balance   Int      @default(0) // 用戶餘額
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
  @@index([discordId])
}

// 交易記錄表格
model Transaction {
  id          String   @id @default(uuid())
  userId      String   // 用戶 ID
  amount      Int      // 金額 (正數表示收入，負數表示支出)
  description String   // 交易描述
  type        String   // 交易類型 (daily, work, transfer, shop, etc.)
  createdAt   DateTime @default(now())

  @@map("transactions")
  @@index([userId])
  @@index([type])
}

model Enterprise {
  id        String   @id @default(uuid())
  owner     String
  name      String
  type      String
  level     Int      @default(1)
  income    Int      @default(100)
  createdAt DateTime @default(now())
}
EOL
        echo -e "${GREEN}Prisma Schema 文件已生成${NC}"
    fi

    if [ -f docker-compose.yml ]; then
        echo -e "  docker-compose.yml: ${GREEN}存在${NC}"
    else
        echo -e "  docker-compose.yml: ${RED}不存在${NC}"
    fi

    # 檢查容器狀態
    if ensure_docker_running 0; then
        echo -e "\n${CYAN}容器狀態:${NC}"
        docker ps --filter "name=maii-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo -e "  ${RED}無法獲取容器狀態${NC}"
    else
        echo -e "\n${RED}Docker 未運行，無法檢查容器狀態${NC}"
    fi

    echo -e "\n${GREEN}環境檢查完成!${NC}"
}

# 備份資料庫
backup_database() {
    show_header "備份 MAII-Bot 資料庫"

    # 檢查配置
    check_configured

    # 檢查 Docker 運行狀態
    ensure_docker_running

    # 創建備份目錄
    mkdir -p backups

    # 生成備份文件名
    backup_file="backups/maii_backup_$(date +%Y%m%d_%H%M%S).sql"

    echo -e "${YELLOW}正在備份資料庫...${NC}"

    # 執行備份命令
    docker exec maii-postgres pg_dump -U bot maii > "$backup_file"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}資料庫已備份至: ${backup_file}${NC}"
    else
        echo -e "${RED}備份失敗，請檢查錯誤訊息${NC}"
        rm -f "$backup_file"
    fi
}

    # 恢復資料庫
    restore_database() {
    show_header "恢復 MAII-Bot 資料庫"

    # 檢查配置
    check_configured

    # 檢查 Docker 運行狀態
    ensure_docker_running

    # 檢查備份目錄
    if [ ! -d backups ] || [ -z "$(ls -A backups 2>/dev/null)" ]; then
        echo -e "${RED}沒有找到備份文件${NC}"
        return
    fi

    # 顯示可用的備份文件
    echo -e "${CYAN}可用備份文件:${NC}"
    ls -1 backups/*.sql 2>/dev/null | nl

    # 選擇備份文件
    echo -e "${YELLOW}請輸入要恢復的備份文件編號:${NC}"
    read -p "> " backup_num

    backup_file=$(ls -1 backups/*.sql 2>/dev/null | sed -n "${backup_num}p")

    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}無效的選擇${NC}"
        return
    fi

    echo -e "${YELLOW}將恢復備份: ${backup_file}${NC}"
    if ! confirm_action "此操作將覆蓋當前資料庫。是否繼續?" 0; then
        echo -e "${YELLOW}操作已取消${NC}"
        return
    fi

    echo -e "${YELLOW}正在恢復資料庫...${NC}"

    # 恢復資料庫
    cat "$backup_file" | docker exec -i maii-postgres psql -U bot maii

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}資料庫已恢復!${NC}"
        echo -e "${YELLOW}正在重啟服務...${NC}"
        restart_services
    else
        echo -e "${RED}恢復失敗，請檢查錯誤訊息${NC}"
    fi
    }

    # ============================================
    # 腳本結束，確保所有函數都已定義完成
    # 在這裡調用主函數，並傳遞所有命令行參數
    # ============================================
    main "$@"
