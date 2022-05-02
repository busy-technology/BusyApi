/**
 * Winston wrapper for logging. Read more about 'winston' at https://www.npmjs.com/package/winston.
 * @return {Object} different logging functions for different log levels.
 */
const winston = require('winston');
// Remove the default console transport if it exists.
winston.remove(winston.transports.Console);

const config = require('../config');

const logLevels = {
  error: 0,
  warn: 1,
  help: 2,
  data: 3,
  info: 4,
  debug: 5,
  prompt: 6,
  verbose: 7,
  input: 8,
  silly: 9,
};

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level} : ${info.message}`,
    ),
  ),
});

/*
 * There are also a number of settings for connection failure and retry behavior
 attemptsBeforeDecay - How many retries should be attempted before backing off, defaults to 5
 maximumAttempts - How many retries before disabling buffering, defaults to 25
 connectionDelay - How long between backoff in milliseconds, defaults to 1000
 maxDelayBetweenReconnection - The maximum backoff in milliseconds, defaults to 60000
 maxBufferSize - The maximum size of the retry buffer, in bytes, defaults to 1048576
 */

const logger = winston.createLogger({
  // change level if in dev environment versus production
  level: config.LOG_LEVEL,
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.json(),
  ),
  transports: [consoleTransport],
});

/**
 * This function normalize an object to be logged according to winston.
 * @param dataObj: input dataObj of type object
 * @returns {*}: returns normalized dataObj of type object.
 */
const normalizeData = (dataObj, level) => {
  dataObj.log_level_name = level;
  const serializeddataObj = JSON.stringify(dataObj);
  return serializeddataObj;
};

module.exports = {
  /**
   * Winston function wrappers for logging.
   * @param msg: The message to log.
   * @param dataObj: (Optional) The detailed data object to be
   * logged, apart from message. If provided, it must be
   * a JSON Object.
   */
  fatal: (msg, dataObj) => {
    dataObj = dataObj || {};
    const message = Object.keys(dataObj).length
      ? ` ${msg} | meta : ${normalizeData(dataObj, 'fatal')}`
      : msg;
    logger.error(message);
  },
  /**
   * Winston function wrappers for logging.
   * @param msg: The message to log.
   * @param dataObj: (Optional) The detailed data object to be
   * logged, apart from message. If provided, it must be
   * a JSON Object.
   */
  error: (msg, dataObj) => {
    dataObj = dataObj || {};
    const message = Object.keys(dataObj).length
      ? ` ${msg} | meta : ${normalizeData(dataObj, 'error')}`
      : msg;
    logger.error(message);
  },
  /**
   * Winston function wrappers for logging.
   * @param msg: The message to log.
   * @param dataObj: (Optional) The detailed data object to be logged,
   * apart from message. If provided, it must be
   * a JSON Object. If the object is flat, it will be printed on the
   *  same line as long as other log information.
   * If the object contains nested objects (or maps), the inner o
   * bjects will be printed in multi-line YAML format
   */
  warn: (msg, dataObj) => {
    dataObj = dataObj || {};
    const message = Object.keys(dataObj).length
      ? ` ${msg} | meta : ${normalizeData(dataObj, 'warn')}`
      : msg;
    logger.warn(message);
  },
  /**
   * Winston function wrappers for logging.
   * @param msg: The message to log.
   * @param dataObj: (Optional) The detailed data object to be logged,
   *  apart from message. If provided, it must be
   * a JSON Object.
   */
  info: (msg, dataObj) => {
    dataObj = dataObj || {};
    const message = Object.keys(dataObj).length
      ? ` ${msg} | meta : ${normalizeData(dataObj, 'info')}`
      : msg;
    logger.info(message);
  },
  /**
   * Winston function wrappers for logging.
   * @param msg: The message to log.
   * @param dataObj: (Optional) The detailed data object to be logged
   * , apart from message. If provided, it must be
   * a JSON Object.
   * */
  debug: (msg, dataObj) => {
    dataObj = dataObj || {};
    const message = Object.keys(dataObj).length
      ? ` ${msg} | meta : ${normalizeData(dataObj, 'debug')}`
      : msg;
    logger.debug(message);
  },
  /**
   * Winston function wrappers for logging.
   * @param msg: The message to log.
   * @param dataObj: (Optional) The detailed data object to be
   * logged, apart from message. If provided, it must be
   * a JSON Object.
   */
  trace: (msg, dataObj) => {
    dataObj = dataObj || {};
    const message = Object.keys(dataObj).length
      ? ` ${msg} | meta : ${normalizeData(dataObj, 'trace')}`
      : msg;
    logger.verbose(message);
  },
};
