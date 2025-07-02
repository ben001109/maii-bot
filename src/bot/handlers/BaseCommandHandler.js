import { ErrorHandler } from '../../core/Errors.js';
import Logger from '../../core/Logger.js';
import I18nService from '../../services/I18nService.js';

/**
 * 命令處理器基類
 */
export class BaseCommandHandler {
  constructor(services) {
    this.services = services;
    this.logger = Logger.createChildLogger('CommandHandler');
    this.i18n = I18nService;
  }

  /**
   * 處理 Discord 斜杠命令
   * @param {Interaction} interaction Discord 交互對象
   * @returns {Promise<void>}
   */
  async handleSlashCommand(interaction) {
    const locale = this.i18n.getTranslator(interaction.locale);
    
    try {
      // 記錄命令執行
      this.logger.info('執行斜杠命令', {
        commandName: interaction.commandName,
        userId: interaction.user.id,
        guildId: interaction.guildId,
        locale: interaction.locale
      });

      // 調用具體的執行邏輯
      await this.execute(interaction, locale);

    } catch (error) {
      this.logger.error('斜杠命令執行失敗', {
        commandName: interaction.commandName,
        userId: interaction.user.id,
        error: error.message,
        stack: error.stack
      });

      // 統一錯誤響應
      const errorResponse = ErrorHandler.createDiscordErrorResponse(error, locale);
      
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply(errorResponse);
        } else {
          await interaction.reply(errorResponse);
        }
      } catch (replyError) {
        this.logger.error('發送錯誤回覆失敗', {
          error: replyError.message
        });
      }
    }
  }

  /**
   * 處理程式化命令調用
   * @param {...any} args 命令參數
   * @returns {Promise<any>}
   */
  async handleProgrammaticCall(...args) {
    try {
      this.logger.debug('執行程式化命令', {
        commandName: this.constructor.name,
        args: args.length
      });

      return await this.executeInternal(...args);
    } catch (error) {
      ErrorHandler.handle(error, this.logger);
      throw error;
    }
  }

  /**
   * 驗證用戶權限
   * @param {Interaction} interaction 
   * @param {Array<string>} requiredPermissions 
   * @returns {boolean}
   */
  validatePermissions(interaction, requiredPermissions = []) {
    if (!requiredPermissions.length) return true;

    // TODO: 實現權限檢查邏輯
    return true;
  }

  /**
   * 檢查命令冷卻
   * @param {string} userId 
   * @param {string} commandName 
   * @param {number} cooldownSeconds 
   * @returns {Promise<boolean>}
   */
  async checkCooldown(userId, commandName, cooldownSeconds = 5) {
    if (!this.services.cacheProvider) return true;

    const cacheKey = `cooldown:${commandName}:${userId}`;
    const lastUsed = await this.services.cacheProvider.get(cacheKey);
    
    if (lastUsed) {
      const timePassed = Date.now() - lastUsed;
      const remainingCooldown = cooldownSeconds * 1000 - timePassed;
      
      if (remainingCooldown > 0) {
        return false;
      }
    }

    // 設置新的冷卻時間
    await this.services.cacheProvider.set(cacheKey, Date.now(), cooldownSeconds);
    return true;
  }

  /**
   * 抽象方法：斜杠命令執行邏輯
   * @param {Interaction} interaction 
   * @param {Function} locale 
   */
  async execute(interaction, locale) {
    throw new Error('execute method must be implemented');
  }

  /**
   * 抽象方法：程式化調用執行邏輯
   * @param {...any} args 
   */
  async executeInternal(...args) {
    throw new Error('executeInternal method must be implemented');
  }

  /**
   * 獲取命令數據（用於 Discord API 註冊）
   */
  getSlashCommandData() {
    throw new Error('getSlashCommandData method must be implemented');
  }

  /**
   * 獲取命令名稱
   */
  getCommandName() {
    throw new Error('getCommandName method must be implemented');
  }

  /**
   * 建立成功回覆
   * @param {string} message 消息內容
   * @param {boolean} ephemeral 是否為私人消息
   * @returns {Object}
   */
  createSuccessReply(message, ephemeral = false) {
    return {
      content: message,
      ephemeral
    };
  }

  /**
   * 建立信息回覆
   * @param {string} message 消息內容
   * @param {boolean} ephemeral 是否為私人消息
   * @returns {Object}
   */
  createInfoReply(message, ephemeral = true) {
    return {
      content: message,
      ephemeral
    };
  }

  /**
   * 延遲回覆（用於長時間處理）
   * @param {Interaction} interaction 
   * @param {boolean} ephemeral 
   */
  async deferReply(interaction, ephemeral = true) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral });
    }
  }
}
