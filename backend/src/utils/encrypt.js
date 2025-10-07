const crypto = require('crypto');
require('dotenv').config();

const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY || 'default32byteslongkeythisisexample';
  
  if (Buffer.from(key).length !== 32) {
    if (Buffer.from(key).length < 32) {
      return Buffer.from(key.padEnd(32, '0'));
    }
    return Buffer.from(key).slice(0, 32);
  }
  
  return Buffer.from(key);
};

const ENCRYPTION_KEY = getEncryptionKey();
const IV_LENGTH = 16; 

/**
 * Encrypts data
 * @param {Object|string} data 
 * @returns {string} - Encrypted data as string
 */
function encrypt(data) {
  const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(dataString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts data
 * @param {string} encryptedData - Data to decrypt
 * @returns {Object|string} - Decrypted data
 */
function decrypt(encryptedData) {
  const textParts = encryptedData.split(':');
  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedText = textParts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  try {
    return JSON.parse(decrypted);
  } catch (e) {
    return decrypted;
  }
}

module.exports = { encrypt, decrypt };