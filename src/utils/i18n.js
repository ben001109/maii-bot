// src/utils/i18n.js

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {logger} from './Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 支援的語言列表
export const SUPPORTED_LANGUAGES = ['zh-TW', 'en-US'];
export const DEFAULT_LANGUAGE = 'zh-TW';

// 本地化字典 - 快取所有翻譯內容
const translations = {};

/**
 * 多語系處理器
 */
class I18nManager {
    constructor() {
        this.initialized = false;
        this.translations = translations;
    }

    /**
     * 初始化多語系系統
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) return;

        try {
            const localesDir = path.join(__dirname, '../locales');

            // 讀取每個支援的語言檔案
            for (const lang of SUPPORTED_LANGUAGES) {
                try {
                    const filePath = path.join(localesDir, `${lang}.json`);
                    const content = await fs.readFile(filePath, 'utf-8');
                    this.translations[lang] = JSON.parse(content);
                    logger.debug(`Loaded translations for ${lang}`);
                } catch (error) {
                    if (error.code === 'ENOENT') {
                        logger.warn(`Translation file for ${lang} not found, creating empty dictionary`);
                        this.translations[lang] = {};
                    } else {
                        logger.error(`Error loading translations for ${lang}:`, error);
                    }
                }
            }

            this.initialized = true;
            logger.info(`I18n initialized with ${Object.keys(this.translations).length} languages`);
        } catch (error) {
            logger.error('Failed to initialize i18n system:', error);
            throw error;
        }
    }

    /**
     * 取得翻譯文字
     * @param {string} key - 翻譯鍵值
     * @param {Object} options - 選項
     * @param {string} options.lang - 指定語言
     * @param {Object} options.vars - 替換變數
     * @param {string} options.fallback - 翻譯不存在時的預設值
     * @returns {string} 翻譯後的文字
     */
    t(key, options = {}) {
        if (!this.initialized) {
            logger.warn('I18n not initialized, using raw key');
            return key;
        }

        const lang = options.lang || DEFAULT_LANGUAGE;
        const vars = options.vars || {};
        const fallback = options.fallback || key;

        // 檢查語言是否支援
        if (!SUPPORTED_LANGUAGES.includes(lang)) {
            logger.warn(`Unsupported language: ${lang}, falling back to ${DEFAULT_LANGUAGE}`);
            lang = DEFAULT_LANGUAGE;
        }

        // 獲取翻譯
        let translation = this.translations[lang]?.[key];

        // 如果找不到翻譯，嘗試使用預設語言
        if (!translation && lang !== DEFAULT_LANGUAGE) {
            translation = this.translations[DEFAULT_LANGUAGE]?.[key];
            logger.debug(`Translation missing for ${lang}:${key}, using default language`);
        }

        // 如果預設語言也沒有，使用 fallback
        if (!translation) {
            logger.debug(`Translation missing for ${key} in all languages, using fallback`);
            translation = fallback;

            // 自動記錄缺失的翻譯
            this._recordMissingTranslation(key, lang);
        }

        // 替換變數 {varName} 格式
        if (vars && Object.keys(vars).length > 0) {
            Object.entries(vars).forEach(([varName, value]) => {
                const regex = new RegExp(`{${varName}}`, 'g');
                translation = translation.replace(regex, value);
            });
        }

        return translation;
    }

    /**
     * 記錄缺失的翻譯
     * @private
     * @param {string} key - 翻譯鍵值
     * @param {string} lang - 語言
     */
    async _recordMissingTranslation(key, lang) {
        try {
            const missingTranslationsPath = path.join(__dirname, '../locales/missing.json');

            // 讀取現有的缺失翻譯記錄
            let missingTranslations = {};
            try {
                const content = await fs.readFile(missingTranslationsPath, 'utf-8');
                missingTranslations = JSON.parse(content);
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    logger.error('Error reading missing translations file:', error);
                }
            }

            // 更新缺失翻譯
            if (!missingTranslations[lang]) {
                missingTranslations[lang] = {};
            }

            // 記錄缺失的翻譯和時間戳
            if (!missingTranslations[lang][key]) {
                missingTranslations[lang][key] = {
                    timestamp: new Date().toISOString(),
                    count: 1
                };
            } else {
                missingTranslations[lang][key].count++;
            }

            // 寫入檔案
            await fs.writeFile(
                missingTranslationsPath,
                JSON.stringify(missingTranslations, null, 2),
                'utf-8'
            );
        } catch (error) {
            logger.error('Failed to record missing translation:', error);
        }
    }

    /**
     * 設定用戶偏好語言
     * @param {string} userId - Discord 用戶 ID
     * @param {string} language - 語言代碼
     * @returns {Promise<boolean>} 設定是否成功
     */
    async setUserLanguage(userId, language) {
        if (!SUPPORTED_LANGUAGES.includes(language)) {
            return false;
        }

        try {
            // 儲存到 Redis (或資料庫)
            await redis.client.set(`user:${userId}:language`, language);
            return true;
        } catch (error) {
            logger.error(`Failed to set user language for ${userId}:`, error);
            return false;
        }
    }

    /**
     * 取得用戶偏好語言
     * @param {string} userId - Discord 用戶 ID
     * @returns {Promise<string>} 語言代碼
     */
    async getUserLanguage(userId) {
        try {
            const language = await redis.client.get(`user:${userId}:language`);
            return language || DEFAULT_LANGUAGE;
        } catch (error) {
            logger.error(`Failed to get user language for ${userId}:`, error);
            return DEFAULT_LANGUAGE;
        }
    }
}

// 創建並導出單例
export const i18n = new I18nManager();
export default i18n;

// 輔助函式，簡化翻譯調用
export function t(key, options = {}) {
    return i18n.t(key, options);
}
