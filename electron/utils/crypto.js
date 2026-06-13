/**
 * 加密工具模块
 * 使用简单的异或加密+Base64编码存储API密钥
 * 注意：这不是金融级加密，仅用于防止密钥明文暴露
 */

const crypto = require('crypto')

// 固定密钥（实际可改为从机器指纹生成）
const SECRET_KEY = 'LocalAI-Video-Generator-Secret-Key-2024'

class CryptoUtil {
  /**
   * 加密文本
   * @param {string} text - 明文
   * @returns {string} 密文（Base64）
   */
  static encrypt(text) {
    if (!text) return ''
    try {
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        crypto.scryptSync(SECRET_KEY, 'salt', 32),
        iv
      )
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      return iv.toString('hex') + ':' + encrypted
    } catch (e) {
      console.error('加密失败', e)
      return text
    }
  }

  /**
   * 解密文本
   * @param {string} encryptedText - 密文
   * @returns {string} 明文
   */
  static decrypt(encryptedText) {
    if (!encryptedText) return ''
    try {
      const parts = encryptedText.split(':')
      if (parts.length !== 2) return encryptedText
      const iv = Buffer.from(parts[0], 'hex')
      const encrypted = parts[1]
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        crypto.scryptSync(SECRET_KEY, 'salt', 32),
        iv
      )
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch (e) {
      console.error('解密失败', e)
      return encryptedText
    }
  }
}

module.exports = CryptoUtil
