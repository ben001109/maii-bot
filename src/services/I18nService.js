import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Logger from '../core/Logger.js';

/**
 * 國際化服務
 */
export class I18nService {
  constructor() {
    this.logger = Logger.createChildLogger('I18nService');
    this.cache = new Map();
    this.fallbackLocale = 'en';
    this.supportedLocales = ['en', 'zh', 'ja'];
    this.loadAllLocales();
  }

  /**
   * 加載所有語言包
   */
  loadAllLocales() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const langDir = path.resolve(__dirname, '../../bot/lang');

    try {
      for (const locale of this.supportedLocales) {
        const filePath = path.join(langDir, `${locale}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          this.cache.set(locale, JSON.parse(content));
          this.logger.debug(`語言包加載成功`, { locale });
        } else {
          this.logger.warn(`語言包文件不存在`, { locale, filePath });
          this.cache.set(locale, {});
        }
      }
      this.logger.info(`已加載 ${this.cache.size} 個語言包`);
    } catch (error) {
      this.logger.error('加載語言包失敗', { error: error.message });
      // 設置最小的回退語言包
      this.cache.set(this.fallbackLocale, {
        error_general: 'An error occurred',
        error_execute: 'Error executing command',
        pong: 'Pong!',
        balance: 'Your balance: {amount}',
        balance_check_success: 'Balance check completed',
        player_not_found: 'Player not found',
        insufficient_funds: 'Insufficient funds. Required: {requested}, Available: {available}',
        player_created: 'Player account created successfully',
        player_already_exists: 'Player account already exists'
      });
    }
  }

  /**
   * 檢測並標準化語言代碼
   * @param {string} locale Discord 語言代碼
   * @returns {string} 標準化的語言代碼
   */
  normalizeLocale(locale) {
    if (!locale) return this.fallbackLocale;

    // Discord 語言代碼轉換
    const localeMap = {
      'zh-TW': 'zh',
      'zh-CN': 'zh',
      'zh-HK': 'zh',
      'ja': 'ja',
      'en-US': 'en',
      'en-GB': 'en'
    };

    // 直接匹配
    if (localeMap[locale]) {
      return localeMap[locale];
    }

    // 前綴匹配
    const prefix = locale.split('-')[0];
    if (this.supportedLocales.includes(prefix)) {
      return prefix;
    }

    return this.fallbackLocale;
  }

  /**
   * 獲取翻譯函數
   * @param {string} locale 語言代碼
   * @returns {Function} 翻譯函數
   */
  getTranslator(locale) {
    const normalizedLocale = this.normalizeLocale(locale);
    const translations = this.cache.get(normalizedLocale) || {};
    const fallbackTranslations = this.cache.get(this.fallbackLocale) || {};

    return (key, variables = {}) => {
      return this.translate(key, variables, translations, fallbackTranslations);
    };
  }

  /**
   * 翻譯文本
   * @param {string} key 翻譯鍵
   * @param {Object} variables 變量替換
   * @param {Object} translations 主要翻譯
   * @param {Object} fallbackTranslations 回退翻譯
   * @returns {string} 翻譯後的文本
   */
  translate(key, variables = {}, translations = {}, fallbackTranslations = {}) {
    // 查找翻譯
    let template = translations[key] || fallbackTranslations[key] || key;

    // 變量替換
    return this.interpolate(template, variables);
  }

  /**
   * 變量插值
   * @param {string} template 模板字符串
   * @param {Object} variables 變量對象
   * @returns {string} 插值後的字符串
   */
  interpolate(template, variables = {}) {
    if (typeof template !== 'string') {
      return template;
    }

    return template.replace(/\{(\w+)\}/g, (match, key) => {
      if (variables.hasOwnProperty(key)) {
        return String(variables[key]);
      }
      return match; // 保持原樣如果變量不存在
    });
  }

  /**
   * 添加翻譯
   * @param {string} locale 語言代碼
   * @param {string} key 翻譯鍵
   * @param {string} value 翻譯值
   */
  addTranslation(locale, key, value) {
    const normalizedLocale = this.normalizeLocale(locale);
    if (!this.cache.has(normalizedLocale)) {
      this.cache.set(normalizedLocale, {});
    }
    
    const translations = this.cache.get(normalizedLocale);
    translations[key] = value;
    
    this.logger.debug('添加翻譯', { locale: normalizedLocale, key });
  }

  /**
   * 批量添加翻譯
   * @param {string} locale 語言代碼
   * @param {Object} translations 翻譯對象
   */
  addTranslations(locale, translations) {
    const normalizedLocale = this.normalizeLocale(locale);
    if (!this.cache.has(normalizedLocale)) {
      this.cache.set(normalizedLocale, {});
    }
    
    const existingTranslations = this.cache.get(normalizedLocale);
    Object.assign(existingTranslations, translations);
    
    this.logger.debug('批量添加翻譯', { 
      locale: normalizedLocale, 
      count: Object.keys(translations).length 
    });
  }

  /**
   * 獲取支持的語言列表
   * @returns {Array<string>} 支持的語言代碼列表
   */
  getSupportedLocales() {
    return [...this.supportedLocales];
  }

  /**
   * 檢查是否支持某個語言
   * @param {string} locale 語言代碼
   * @returns {boolean} 是否支持
   */
  isSupported(locale) {
    const normalizedLocale = this.normalizeLocale(locale);
    return this.supportedLocales.includes(normalizedLocale);
  }

  /**
   * 重新加載語言包
   * @param {string} locale 指定語言（可選）
   */
  reload(locale = null) {
    if (locale) {
      const normalizedLocale = this.normalizeLocale(locale);
      this.cache.delete(normalizedLocale);
      this.logger.info('重新加載語言包', { locale: normalizedLocale });
    } else {
      this.cache.clear();
      this.logger.info('重新加載所有語言包');
    }
    
    this.loadAllLocales();
  }

  /**
   * 獲取語言統計信息
   * @returns {Object} 語言包統計
   */
  getStats() {
    const stats = {};
    
    for (const [locale, translations] of this.cache.entries()) {
      stats[locale] = {
        keyCount: Object.keys(translations).length,
        loaded: true
      };
    }
    
    return stats;
  }
}

// 導出單例實例
export default new I18nService();
