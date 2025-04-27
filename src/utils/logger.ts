import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  silly: 5,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  silly: 'white',
};

// Add colors to Winston
winston.addColors(colors);

// Define format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define format for file output (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport for all environments
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

/**
 * Logger instance with Winston
 */
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Don't exit on error
  exitOnError: false,
});

/**
 * Create a child logger with predefined metadata
 * @param module - Module name or identifier
 * @param additionalMetadata - Additional metadata to include in logs
 * @returns Child logger instance
 */
export const createChildLogger = (
  module: string,
  additionalMetadata: Record<string, unknown> = {}
): winston.Logger => {
  return logger.child({
    module,
    ...additionalMetadata,
  });
};

/**
 * Log HTTP requests in Morgan-compatible format
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const httpLogger = (
  req: { method: string; url: string; ip: string },
  res: { statusCode: number },
  next: () => void
): void => {
  const { method, url, ip } = req;
  const userAgent = req.headers?.['user-agent'] || '';

  // Log when response finishes
  res.on('finish', () => {
    const { statusCode } = res;
    const message = `${method} ${url} ${statusCode} - ${ip} "${userAgent}"`;
    
    // Log based on status code
    if (statusCode >= 500) {
      logger.error(message);
    } else if (statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.http(message);
    }
  });

  next();
};

export default logger; 