// backend/src/utils/errors.ts

/**
 * Clases de error personalizadas para la aplicación
 */

export class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
      Error.captureStackTrace(this, ValidationError);
    }
  }
  
  export class AuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
      Error.captureStackTrace(this, AuthenticationError);
    }
  }
  
  export class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
      Error.captureStackTrace(this, NotFoundError);
    }
  }
  
  export class PermissionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'PermissionError';
      Error.captureStackTrace(this, PermissionError);
    }
  }
  
  export class RateLimitError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'RateLimitError';
      Error.captureStackTrace(this, RateLimitError);
    }
  }