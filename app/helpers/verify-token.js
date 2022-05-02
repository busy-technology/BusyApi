const jwt = require('jsonwebtoken');
const config = require('../../config');

module.exports = (token) => jwt.verify(token, config.JWT_SECRET);
