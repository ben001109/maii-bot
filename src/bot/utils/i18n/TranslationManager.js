// src/bot/utils/i18n/TranslationManager.js

import {logger} from '../Logger.js';
import {translations} from './translations/index.js';

/**
 * 獲取翻譯文本
 * @param {String} key - 翻譯鍵值，使用點符號指定嵌套路徑
 * @param {String} locale - 語言代碼
 * @param {Object} params - 替換參數
 * @returns {String} 翻譯後的文本
 */
export function getTranslation(key, locale = 'zh-TW', params = {}) {
    try {
        // 如果沒有提供有效的語言，使用默認語言
        if (!translations[locale]) {
            logger.warn(`未找到語言 "${locale}" 的翻譯，使用默認語言 "zh-TW"`);
            locale = 'zh-TW';
        }

        // 使用點符號分割鍵值路徑
        const keys = key.split('.');

        // 遞歸查找翻譯值
        let value = translations[locale];
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // 如果在指定語言中找不到鍵值，嘗試在默認語言中查找
                if (locale !== 'zh-TW') {
                    logger.warn(`在 "${locale}" 中未找到鍵 "${key}"，使用默認語言 "zh-TW"`);
                    return getTranslation(key, 'zh-TW', params);
                }

                // 如果在默認語言中也找不到，返回鍵值
                logger.warn(`未找到鍵 "${key}" 的翻譯`);
                return key;
            }
        }

        // 如果值不是字符串，轉換為字符串
        if (typeof value !== 'string') {
            return JSON.stringify(value);
        }

        // 替換參數
        return replaceParams(value, params);
    } catch (error) {
        logger.error(`獲取翻譯時出錯: ${error.message}`);
        return key;
    }
}

/**
 * 替換翻譯文本中的參數
 * @param {String} text - 包含參數佔位符的文本
 * @param {Object} params - 替換參數
 * @returns {String} 替換後的文本
 */
function replaceParams(text, params) {
    return text.replace(/\{(\w+)\}/g, (match, paramName) => {
        return params[paramName] !== undefined ? params[paramName] : match;
    });
}

/**
 * 獲取支持的語言列表
 * @returns {Array} 支持的語言代碼列表
 */
export function getSupportedLocales() {
    return Object.keys(translations);
}

/**
 * 設置用戶偏好語言
 * @param {String} userId - 用戶 ID
 * @param {String} locale - 語言代碼
 * @returns {Promise<Boolean>} 是否設置成功
 */
export async function setUserPreferredLocale(userId, locale) {
    // 這裡應該實現將用戶偏好語言保存到數據庫的邏輯
    // 暫時返回 true 表示成功
    return true;
}

/**
 * 獲取用戶偏好語言
 * @param {String} userId - 用戶 ID
 * @returns {Promise<String>} 語言代碼
 */
export async function getUserPreferredLocale(userId) {
    // 這裡應該實現從數據庫獲取用戶偏好語言的邏輯
    // 暫時返回默認語言
    return 'zh-TW';
}
