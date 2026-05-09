const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getSecretKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 32-character string in .env');
  }
  return Buffer.from(key, 'utf8');
}

function encryptToken(text) {
  if (!text) return text;
  
  try {
    const iv = crypto.randomBytes(12); // GCM standard IV size is 12 bytes
    const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encryptedText
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err);
    throw err;
  }
}

function decryptToken(cipherText) {
  if (!cipherText) return cipherText;
  
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    // If it doesn't match the new encrypted format, return as-is (e.g., legacy unencrypted tokens)
    return cipherText;
  }
  
  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      getSecretKey(), 
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption error (token might be invalid or key changed):', err);
    throw new Error('Failed to decrypt token');
  }
}

module.exports = {
  encryptToken,
  decryptToken
};
