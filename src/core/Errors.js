/**
 * 自定義錯誤類型
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
  }
}

export class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} 未找到`, 404);
    this.resource = resource;
  }
}

export class InsufficientFundsError extends AppError {
  constructor(requested, available) {
    super(`資金不足。需要: ${requested}, 可用: ${available}`, 400);
    this.requested = requested;
    this.available = available;
  }
}

export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500);
    this.originalError = originalError;
  }
}

export class ConfigurationError extends AppError {
  constructor(message) {
    super(message, 500, false);
  }
}

/**
 * 錯誤處理工具類
 */
export class ErrorHandler {
  static handle(error, logger) {
    if (error instanceof AppError) {
      logger.error(error.message, {
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        stack: error.stack
      });
    } else {
      logger.error('未預期的錯誤', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  static isOperationalError(error) {
    return error instanceof AppError && error.isOperational;
  }

  static createDiscordErrorResponse(error, locale) {
    if (error instanceof ValidationError) {
      return {
        content: locale('error_validation', { message: error.message }),
        ephemeral: true
      };
    }
    
    if (error instanceof InsufficientFundsError) {
      return {
        content: locale('error_insufficient_funds', { 
          requested: error.requested, 
          available: error.available 
        }),
        ephemeral: true
      };
    }
    
    if (error instanceof NotFoundError) {
      return {
        content: locale('error_not_found', { resource: error.resource }),
        ephemeral: true
      };
    }
    
    return {
      content: locale('error_general'),
      ephemeral: true
    };
  }
}
