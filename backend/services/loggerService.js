const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create logger configuration
const createLogger = () => {
  const transports = [];

  // Console transport for development
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'debug',
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true
      })
    );
  }

  // File transport for all levels
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: process.env.LOG_LEVEL || 'info',
      format: customFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );

  // Error-specific transport
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: customFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );

  // Access log transport for HTTP requests
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '7d',
      level: 'http',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );

  // Security log transport
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '90d',
      level: 'warn',
      format: customFormat
    })
  );

  // Performance log transport
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    transports,
    exitOnError: false,
    silent: process.env.NODE_ENV === 'test'
  });
};

// Create main logger
const logger = createLogger();

// Create specialized loggers
const createSpecializedLogger = (category, defaultMeta = {}) => {
  return {
    info: (message, meta = {}) => logger.info(message, { ...defaultMeta, category, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { ...defaultMeta, category, ...meta }),
    error: (message, meta = {}) => logger.error(message, { ...defaultMeta, category, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { ...defaultMeta, category, ...meta }),
    http: (message, meta = {}) => logger.http(message, { ...defaultMeta, category, ...meta })
  };
};

// Specialized loggers
const loggers = {
  auth: createSpecializedLogger('auth'),
  api: createSpecializedLogger('api'),
  database: createSpecializedLogger('database'),
  security: createSpecializedLogger('security'),
  performance: createSpecializedLogger('performance'),
  email: createSpecializedLogger('email'),
  cache: createSpecializedLogger('cache'),
  system: createSpecializedLogger('system')
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const originalUrl = req.originalUrl || req.url;
  const method = req.method;
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || req.connection.remoteAddress;
  const userId = req.user ? req.user.id : 'anonymous';

  // Log request start
  loggers.api.http('Request started', {
    method,
    url: originalUrl,
    userAgent,
    ip,
    userId,
    requestId: req.id || 'unknown'
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const contentLength = res.get('Content-Length') || (body ? body.length : 0);

    // Log request completion
    loggers.api.http('Request completed', {
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      contentLength,
      userAgent,
      ip,
      userId,
      requestId: req.id || 'unknown'
    });

    // Log slow requests
    if (duration > (parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 1000)) {
      loggers.performance.warn('Slow request detected', {
        method,
        url: originalUrl,
        duration: `${duration}ms`,
        statusCode,
        userId,
        requestId: req.id || 'unknown'
      });
    }

    // Log errors
    if (statusCode >= 400) {
      const level = statusCode >= 500 ? 'error' : 'warn';
      loggers.api[level]('Request error', {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        userId,
        requestId: req.id || 'unknown',
        responseBody: statusCode >= 500 ? body : undefined
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || req.connection.remoteAddress;
  const userId = req.user ? req.user.id : 'anonymous';

  loggers.api.error('Unhandled error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    request: {
      method,
      url,
      userAgent,
      ip,
      userId,
      requestId: req.id || 'unknown',
      body: req.body,
      params: req.params,
      query: req.query
    }
  });

  next(error);
};

// Authentication logging
const authLogger = {
  loginAttempt: (email, ip, userAgent, success = false, reason = null) => {
    const level = success ? 'info' : 'warn';
    loggers.auth[level]('Login attempt', {
      email,
      ip,
      userAgent,
      success,
      reason,
      timestamp: new Date().toISOString()
    });
  },

  loginSuccess: (userId, email, ip, userAgent) => {
    loggers.auth.info('Login successful', {
      userId,
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  loginFailure: (email, ip, userAgent, reason, attemptsRemaining = null) => {
    loggers.auth.warn('Login failed', {
      email,
      ip,
      userAgent,
      reason,
      attemptsRemaining,
      timestamp: new Date().toISOString()
    });
  },

  accountLocked: (email, ip, attempts) => {
    loggers.security.error('Account locked', {
      email,
      ip,
      attempts,
      timestamp: new Date().toISOString()
    });
  },

  passwordReset: (email, ip, userAgent) => {
    loggers.auth.info('Password reset requested', {
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  registration: (email, ip, userAgent, success = true) => {
    loggers.auth.info('User registration', {
      email,
      ip,
      userAgent,
      success,
      timestamp: new Date().toISOString()
    });
  },

  otpGenerated: (email, purpose = 'verification') => {
    loggers.auth.info('OTP generated', {
      email,
      purpose,
      timestamp: new Date().toISOString()
    });
  },

  otpVerified: (email, purpose = 'verification', success = true) => {
    loggers.auth.info('OTP verification', {
      email,
      purpose,
      success,
      timestamp: new Date().toISOString()
    });
  }
};

// Security logging
const securityLogger = {
  suspiciousActivity: (type, details, ip, userAgent, userId = null) => {
    loggers.security.warn('Suspicious activity detected', {
      type,
      details,
      ip,
      userAgent,
      userId,
      timestamp: new Date().toISOString()
    });
  },

  rateLimitExceeded: (ip, endpoint, attempts) => {
    loggers.security.warn('Rate limit exceeded', {
      ip,
      endpoint,
      attempts,
      timestamp: new Date().toISOString()
    });
  },

  unauthorizedAccess: (ip, endpoint, method, userAgent, userId = null) => {
    loggers.security.error('Unauthorized access attempt', {
      ip,
      endpoint,
      method,
      userAgent,
      userId,
      timestamp: new Date().toISOString()
    });
  },

  dataExport: (userId, dataType, recordCount, ip) => {
    loggers.security.info('Data export', {
      userId,
      dataType,
      recordCount,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  privilegeEscalation: (userId, fromRole, toRole, ip, adminUserId) => {
    loggers.security.warn('Privilege escalation', {
      userId,
      fromRole,
      toRole,
      ip,
      adminUserId,
      timestamp: new Date().toISOString()
    });
  }
};

// Database logging
const databaseLogger = {
  connection: (status, details = {}) => {
    const level = status === 'connected' ? 'info' : 'error';
    loggers.database[level]('Database connection', {
      status,
      ...details,
      timestamp: new Date().toISOString()
    });
  },

  query: (query, duration, success = true, error = null) => {
    const level = success ? 'debug' : 'error';
    loggers.database[level]('Database query', {
      query: query.substring(0, 200), // Limit query length
      duration: `${duration}ms`,
      success,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    });
  },

  slowQuery: (query, duration) => {
    loggers.database.warn('Slow database query', {
      query: query.substring(0, 200),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  },

  migration: (version, direction, success = true, error = null) => {
    const level = success ? 'info' : 'error';
    loggers.database[level]('Database migration', {
      version,
      direction,
      success,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    });
  }
};

// Performance logging
const performanceLogger = {
  measure: (operation, duration, details = {}) => {
    loggers.performance.info('Performance measurement', {
      operation,
      duration: `${duration}ms`,
      ...details,
      timestamp: new Date().toISOString()
    });
  },

  memory: (usage) => {
    loggers.performance.debug('Memory usage', {
      ...usage,
      timestamp: new Date().toISOString()
    });
  },

  apiResponse: (endpoint, method, duration, statusCode, cacheHit = false) => {
    loggers.performance.info('API response time', {
      endpoint,
      method,
      duration: `${duration}ms`,
      statusCode,
      cacheHit,
      timestamp: new Date().toISOString()
    });
  }
};

// System logging
const systemLogger = {
  startup: (service, version, environment) => {
    loggers.system.info('Service startup', {
      service,
      version,
      environment,
      nodeVersion: process.version,
      pid: process.pid,
      timestamp: new Date().toISOString()
    });
  },

  shutdown: (service, reason = 'manual') => {
    loggers.system.info('Service shutdown', {
      service,
      reason,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  },

  healthCheck: (service, status, details = {}) => {
    const level = status === 'healthy' ? 'info' : 'error';
    loggers.system[level]('Health check', {
      service,
      status,
      ...details,
      timestamp: new Date().toISOString()
    });
  }
};

// Export main logger and specialized loggers
module.exports = {
  logger,
  loggers,
  requestLogger,
  errorLogger,
  authLogger,
  securityLogger,
  databaseLogger,
  performanceLogger,
  systemLogger,
  
  // Utility functions
  createSpecializedLogger,
  getLogStats: () => {
    return {
      level: logger.level,
      transports: logger.transports.length,
      logsDirectory: logsDir
    };
  }
};
