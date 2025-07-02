import { ValidationError } from '../core/Errors.js';
import Logger from '../core/Logger.js';

/**
 * 貨幣服務 - 處理貨幣格式化和轉換
 */
export class CurrencyService {
  constructor(config) {
    this.config = config;
    this.logger = Logger.createChildLogger('CurrencyService');
    this.currency = this.config.get('game.currency') || {
      code: 'TWD',
      name: 'New Taiwan Dollar',
      symbol: 'NT$',
      decimals: 0
    };
  }

  /**
   * 格式化貨幣顯示
   * @param {number} amount 金額
   * @param {boolean} showCode 是否顯示貨幣代碼
   * @returns {string} 格式化後的貨幣字串
   */
  format(amount, showCode = false) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationError('金額必須是有效數字');
    }

    const formattedAmount = amount.toFixed(this.currency.decimals);
    const displayAmount = this.addThousandsSeparator(formattedAmount);
    
    let result = `${this.currency.symbol}${displayAmount}`;
    
    if (showCode) {
      result += ` ${this.currency.code}`;
    }

    return result;
  }

  /**
   * 格式化差額顯示（帶正負號）
   * @param {number} amount 差額
   * @param {boolean} showCode 是否顯示貨幣代碼
   * @returns {string} 格式化後的差額字串
   */
  formatDifference(amount, showCode = false) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationError('金額必須是有效數字');
    }

    const sign = amount >= 0 ? '+' : '';
    const formatted = this.format(Math.abs(amount), showCode);
    
    return `${sign}${formatted}`;
  }

  /**
   * 解析貨幣字串為數值
   * @param {string} currencyString 貨幣字串
   * @returns {number} 解析後的數值
   */
  parse(currencyString) {
    if (typeof currencyString !== 'string') {
      throw new ValidationError('貨幣字串必須是字符串類型');
    }

    // 移除貨幣符號和分隔符
    let cleanString = currencyString
      .replace(this.currency.symbol, '')
      .replace(this.currency.code, '')
      .replace(/[,\s]/g, '')
      .trim();

    const amount = parseFloat(cleanString);
    
    if (isNaN(amount)) {
      throw new ValidationError(`無法解析貨幣字串: ${currencyString}`);
    }

    return amount;
  }

  /**
   * 驗證金額是否有效
   * @param {number} amount 金額
   * @param {boolean} allowNegative 是否允許負數
   * @param {number} maxAmount 最大金額限制
   * @returns {boolean} 是否有效
   */
  validateAmount(amount, allowNegative = true, maxAmount = Number.MAX_SAFE_INTEGER) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return false;
    }

    if (!allowNegative && amount < 0) {
      return false;
    }

    if (amount > maxAmount) {
      return false;
    }

    // 檢查小數位數是否符合貨幣規則
    const decimalPlaces = this.getDecimalPlaces(amount);
    if (decimalPlaces > this.currency.decimals) {
      return false;
    }

    return true;
  }

  /**
   * 四捨五入到貨幣精度
   * @param {number} amount 金額
   * @returns {number} 四捨五入後的金額
   */
  round(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationError('金額必須是有效數字');
    }

    const multiplier = Math.pow(10, this.currency.decimals);
    return Math.round(amount * multiplier) / multiplier;
  }

  /**
   * 獲取貨幣資訊
   * @returns {Object} 貨幣配置
   */
  getCurrencyInfo() {
    return { ...this.currency };
  }

  /**
   * 轉換為最小單位（如分）
   * @param {number} amount 金額
   * @returns {number} 最小單位的數值
   */
  toMinorUnits(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationError('金額必須是有效數字');
    }

    const multiplier = Math.pow(10, this.currency.decimals);
    return Math.round(amount * multiplier);
  }

  /**
   * 從最小單位轉換回標準單位
   * @param {number} minorUnits 最小單位數值
   * @returns {number} 標準單位金額
   */
  fromMinorUnits(minorUnits) {
    if (typeof minorUnits !== 'number' || isNaN(minorUnits)) {
      throw new ValidationError('最小單位數值必須是有效數字');
    }

    const divisor = Math.pow(10, this.currency.decimals);
    return minorUnits / divisor;
  }

  // 私有方法

  /**
   * 添加千位分隔符
   * @param {string} amount 數字字串
   * @returns {string} 帶分隔符的字串
   */
  addThousandsSeparator(amount) {
    const parts = amount.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  /**
   * 獲取數字的小數位數
   * @param {number} number 數字
   * @returns {number} 小數位數
   */
  getDecimalPlaces(number) {
    if (Math.floor(number) === number) return 0;
    
    const str = number.toString();
    if (str.indexOf('.') !== -1 && str.indexOf('e-') === -1) {
      return str.split('.')[1].length;
    } else if (str.indexOf('e-') !== -1) {
      const parts = str.split('e-');
      return parseInt(parts[1], 10);
    }
    
    return 0;
  }
}
