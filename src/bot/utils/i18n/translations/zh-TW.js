// src/bot/utils/i18n/translations/zh-TW.js

export const zhTW = {
    common: {
        success: '成功',
        error: '錯誤',
        warning: '警告',
        info: '資訊',
        loading: '載入中...',
        confirm: '確認',
        cancel: '取消',
        yes: '是',
        no: '否',
        save: '儲存',
        edit: '編輯',
        delete: '刪除',
        back: '返回',
        next: '下一步',
        previous: '上一步',
        page: '頁面 {current}/{total}',
        timeFormat: 'YYYY年MM月DD日 HH:mm:ss',
        noData: '沒有資料',
        notFound: '找不到資料',
        unauthorized: '無權限執行此操作',
        timeRemaining: '剩餘時間：{time}'
    },
    player: {
        start: {
            alreadyRegistered: '您已經註冊了！使用 /player profile 查看您的資料。',
            success: '成功建立角色！歡迎加入鷗麥經濟系統！',
            initialMoney: '初始資金：${money}',
            newAccount: '這是一個新帳號！',
            occupation: '職業：{occupation}'
        },
        profile: {
            title: '{username} 的個人資料',
            money: '💰 資金',
            enterprises: '💼 企業數量',
            gameTime: '🕒 遊戲時間',
            occupation: '👨‍💼 職業',
            achievements: '🏆 成就',
            privateProfile: '此用戶的個人資料是私密的',
            notInitialized: '此用戶尚未初始化角色',
            customFields: '自訂欄位'
        },
        privacy: {
            updated: '隱私設定已更新',
            status: '目前狀態：{status}',
            public: '公開',
            private: '私密'
        },
        help: {
            title: '玩家指令幫助',
            description: '以下是可用的玩家指令：',
            start: '`/player start` - 建立角色',
            profile: '`/player profile [用戶]` - 查看角色資料',
            privacy: '`/player privacy` - 設定隱私選項'
        }
    },
    enterprise: {
        create: {
            success: '成功創建企業！',
            name: '企業名稱：{name}',
            type: '企業類型：{type}',
            cost: '創建成本：${cost}',
            cooldown: '創業冷卻期：{time}',
            insufficientFunds: '資金不足！創建企業需要 ${cost}',
            cooldownActive: '您處於創業冷卻期，需等待 {time} 後才能再次創業',
            typeSelection: '請選擇企業類型：',
            namePrompt: '請輸入企業名稱：',
            confirmCreate: '確認創建 {type} 類型的企業 "{name}"？這將花費 ${cost}',
            enterpriseLimit: '您已達到企業數量上限 ({limit})！'
        },
        types: {
            farm: '農場',
            factory: '工廠',
            restaurant: '餐廳',
            store: '商店',
            tech: '科技公司',
            finance: '金融機構'
        },
        manage: {
            title: '{name} 管理面板',
            revenue: '營收：${amount}',
            expenses: '支出：${amount}',
            profit: '利潤：${amount}',
            staff: '員工：{count}',
            level: '等級：{level}',
            upgrade: '升級',
            hire: '招募',
            market: '市場',
            notFound: '找不到您的企業，請確認企業 ID 或名稱'
        }
    },
    admin: {
        reset: {
            confirmUser: '確定要重置 {username} 的資料嗎？這個操作無法撤銷！',
            success: '成功重置 {username} 的資料',
            notFound: '找不到該使用者',
            unauthorized: '您沒有權限執行此操作'
        },
        sync: {
            start: '開始同步資料...',
            complete: '資料同步完成！共處理 {count} 筆記錄',
            inProgress: '同步進行中... ({current}/{total})',
            scheduled: '已排程定時同步，將於 {time} 執行',
            unauthorized: '您沒有權限執行此操作'
        }
    },
    errors: {
        generic: '發生錯誤，請稍後再試',
        database: '資料庫錯誤',
        notFound: '找不到資源',
        invalidInput: '無效的輸入',
        permissionDenied: '權限不足',
        cooldownActive: '指令冷卻中，請等待 {time}',
        notInitialized: '您尚未初始化角色，請使用 /player start 指令',
        alreadyExists: '資料已存在',
        notEnoughMoney: '資金不足',
        networkError: '網路錯誤，請稍後再試'
    }
};
