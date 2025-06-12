const locales = {
  en: {
    pong: 'Pong!',
    balance: (amount) => `Balance: ${amount}`,
  },
  zh: {
    pong: '碰！',
    balance: (amount) => `餘額：${amount}`,
  },
};

export function loadLocale(locale) {
  const lang = locale?.startsWith('zh') ? 'zh' : 'en';
  return (key) => locales[lang][key] || key;
}
