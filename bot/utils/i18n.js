const locales = {
  en: {
    pong: 'Pong!',
    balance: (amount) => `Balance: ${amount}`,
    init_success: 'Player created',
    init_exists: 'Player already exists',
    error_execute: 'Error executing command',
  },
  zh: {
    pong: '碰！',
    balance: (amount) => `餘額：${amount}`,
    init_success: '玩家已建立',
    init_exists: '玩家已存在',
    error_execute: '執行指令時發生錯誤',
  },
};

export function loadLocale(locale) {
  const lang = locale?.startsWith('zh') ? 'zh' : 'en';
  return (key) => locales[lang][key] || key;
}
