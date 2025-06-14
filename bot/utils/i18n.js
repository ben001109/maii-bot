import fs from 'node:fs';

const langDir = new URL('../lang/', import.meta.url);
const cache = {};

export function loadLocale(locale) {
  const lang = locale?.startsWith('zh')
    ? 'zh'
    : locale?.startsWith('ja')
      ? 'ja'
      : 'en';
  if (!cache[lang]) {
    const file = new URL(`${lang}.json`, langDir);
    try {
      cache[lang] = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      cache[lang] = {};
    }
  }
  return (key, vars = {}) => {
    const template = cache[lang][key] || key;
    return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  };
}
