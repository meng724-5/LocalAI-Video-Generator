/**
 * 日志管理模块
 * 统一的日志记录，支持控制台和文件输出
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

const LOG_DIR = path.join(os.homedir(), 'LocalAI-Video-Generator', 'logs')
const LOG_FILE = path.join(LOG_DIR, `app-${new Date().toISOString().split('T')[0]}.log`)

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

class Logger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      data
    }
    
    const logLine = `[${timestamp}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`
    
    // 控制台输出
    console.log(logLine.trim())
    
    // 文件写入
    try {
      fs.appendFileSync(LOG_FILE, logLine)
    } catch (e) {
      console.error('日志写入失败', e)
    }
  }

  static info(message, data) {
    this.log('INFO', message, data)
  }

  static error(message, data) {
    this.log('ERROR', message, data)
  }

  static warn(message, data) {
    this.log('WARN', message, data)
  }

  static debug(message, data) {
    this.log('DEBUG', message, data)
  }
}

module.exports = Logger
