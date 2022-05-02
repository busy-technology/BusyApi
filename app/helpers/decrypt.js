const crypto = require('crypto');

module.exports = (encryptedText, key, iv) => {
  try {
    const alg = 'des-ede-cbc';
    const bufferKey = Buffer.from(key, 'hex');
    const bufferIv = Buffer.from(iv, 'hex');
    const encrypted = Buffer.from(encryptedText, 'base64');
    const decipher = crypto.createDecipheriv(alg, bufferKey, bufferIv);
    let decoded = decipher.update(encrypted, 'binary', 'ascii');
    decoded += decipher.final('ascii');
    return decoded;
  } catch (exception) {
    const errorMessage = { code: 403, message: 'Unable to decode credentials' };
    console.log(exception);
    throw errorMessage;
  }
};
