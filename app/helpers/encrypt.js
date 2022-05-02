const crypto = require('crypto');

module.exports = (text, key, iv) => {
  try {
    const alg = 'des-ede-cbc';
    const bufferKey = Buffer.from(key, 'hex');
    const bufferIv = Buffer.from(iv, 'hex');
    const cipher = crypto.createCipheriv(alg, bufferKey, bufferIv);
    let encoded = cipher.update(text, 'ascii', 'base64');
    encoded += cipher.final('base64');
    return encoded;
  } catch (exception) {
    throw exception;
  }
};
