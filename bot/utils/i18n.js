const locales = {
  en: {
    pong: 'Pong!',
  },
  zh: {
    pong: '碰！',
  },
};

function loadLocale(locale) {
  const lang = locale?.startsWith('zh') ? 'zh' : 'en';
  return (key) => locales[lang][key] || key;
}

module.exports = { loadLocale };
