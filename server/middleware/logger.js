import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file path
const logFilePath = path.join(logsDir, 'app.log');

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const logColors = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
 INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[35m', // Magenta
  RESET: '\x1b[0m'   // Reset
};

// Function to format the log entry
const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };

  return JSON.stringify(logEntry) + '\n';
};

// Function to write log to file
const writeLogToFile = (logEntry) => {
  try {
    fs.appendFileSync(logFilePath, logEntry);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};

// Function to write log to console
const writeLogToConsole = (level, message, meta = {}) => {
  const color = logColors[level] || logColors.RESET;
  const reset = logColors.RESET;
  
  let consoleMessage = `${color}[${level}]${reset} ${message}`;
  
  if (Object.keys(meta).length > 0) {
    consoleMessage += ` ${JSON.stringify(meta)}`;
  }
  
  console.log(consoleMessage);
};

// Main logging function
const log = (level, message, meta = {}) => {
  const logEntry = formatLog(level, message, meta);
  
  // Write to file
 writeLogToFile(logEntry);
  
  // Write to console if not in production
  if (process.env.NODE_ENV !== 'production') {
    writeLogToConsole(level, message, meta);
  }
};

// Logger middleware
const logger = (req, res, next) => {
  const startTime = Date.now();
  
  // Capture the original res.end method
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Log the request
    log('INFO', 'HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown',
      userId: req.user ? req.user.id : 'Anonymous'
    });
    
    // Call the original res.end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Export logging functions
export const loggerMiddleware = logger;

export const loggerInstance = {
  error: (message, meta = {}) => log('ERROR', message, meta),
  warn: (message, meta = {}) => log('WARN', message, meta),
  info: (message, meta = {}) => log('INFO', message, meta),
  debug: (message, meta = {}) => log('DEBUG', message, meta)
};

export default logger;
