const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');

// Enhanced rate limiting for different endpoints
const createRateLimit = (max, windowMs, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    max,
    windowMs,
    message: {
      success: false,
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// General API rate limiting
const generalLimiter = createRateLimit(
  parseInt(process.env.RATE_LIMIT_MAX) || 1000000, // 1M requests per window
  parseInt(process.env.RATE_LIMIT_WINDOW) * 1000 || 60000, // 1 minute window
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiting for authentication endpoints
const authLimiter = createRateLimit(
  parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10, // 10 attempts
  parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW) * 1000 || 900000, // 15 minutes
  'Too many authentication attempts from this IP, please try again after 15 minutes.',
  true // Don't count successful requests
);

// Strict rate limiting for OTP endpoints
const otpLimiter = createRateLimit(
  parseInt(process.env.OTP_RATE_LIMIT_MAX) || 5, // 5 OTP requests
  parseInt(process.env.OTP_RATE_LIMIT_WINDOW) * 1000 || 3600000, // 1 hour
  'Too many OTP requests from this IP, please try again after 1 hour.'
);

// Progressive delay for repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per 15 minutes at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 hours
};

// Enhanced Helmet configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Compression configuration
const compressionConfig = compression({
  level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
  threshold: 1024, // Only compress files larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Additional security headers
  res.setHeader('X-Powered-By', 'CRM-API');
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // API response time header
  const start = Date.now();
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
  });
  
  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  if (process.env.ENABLE_LOGGING === 'true') {
    const start = Date.now();
    const { method, originalUrl, ip, headers } = req;
    
    console.log(`📝 ${method} ${originalUrl} - ${ip} - ${headers['user-agent']}`);
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
      
      console.log(`${statusEmoji} ${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
    });
  }
  
  next();
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  if (process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      
      if (duration > 1000) { // Log slow requests (>1 second)
        console.warn(`🐌 Slow request: ${req.method} ${req.originalUrl} - ${duration.toFixed(2)}ms`);
      }
    });
  }
  
  next();
};

// Input validation middleware
const validateInput = (req, res, next) => {
  // Remove undefined and null values
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === undefined || req.body[key] === null) {
        delete req.body[key];
      }
      
      // Trim strings
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  
  next();
};

// API versioning middleware
const apiVersioning = (req, res, next) => {
  const version = req.headers['api-version'] || req.query.version || 'v1';
  req.apiVersion = version;
  
  if (!['v1', 'v2'].includes(version)) {
    return res.status(400).json({
      success: false,
      error: 'Unsupported API version. Supported versions: v1, v2'
    });
  }
  
  next();
};

module.exports = {
  // Rate limiting
  generalLimiter,
  authLimiter,
  otpLimiter,
  speedLimiter,
  
  // Security
  helmetConfig,
  corsOptions,
  mongoSanitize: mongoSanitize(),
  xss: xss(),
  compressionConfig,
  securityHeaders,
  
  // Monitoring
  requestLogger,
  performanceMonitor,
  
  // Utilities
  validateInput,
  apiVersioning,
  
  // Configuration objects
  securityConfig: {
    helmet: helmetConfig,
    cors: cors(corsOptions),
    mongoSanitize: mongoSanitize(),
    xss: xss(),
    compression: compressionConfig
  }
};
