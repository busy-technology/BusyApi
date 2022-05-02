const jwt = require('jsonwebtoken');
const config = require('../../config');

module.exports = (params) =>
  jwt.sign(params, config.JWT_SECRET, {
    expiresIn: parseInt(config.EXPIRY_TIME, 10),
  });
