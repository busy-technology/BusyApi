const uuid = require('uuid-random');
const logger = require('@utils/logger');
const jwt = require('jsonwebtoken');
const ApiKeyModel = require('../../models/api-keys');
const constants = require('../../../config');

require('module-alias/register');

module.exports = async (req) => {
  try {
    const apiKey = req.headers.apikey;
    //   logger.info("apiKey " + apiKey);
    if (!apiKey || apiKey === '') {
      return Promise.reject({
        status: false,
        message: 'Please send an apiKey',
        code: 400,
      });
    }

    //   logger.info("Trying to get Doc from DB");

    const doc = await ApiKeyModel.findOne({ apikey: apiKey });

    if (!doc) {
      logger.error('Cant Find API key  in DB');
      return Promise.reject({
        status: false,
        message: 'Invalid API Key',
        code: 404,
      });
    }

    const tokenParams = {
      _id: doc._id /* eslint no-underscore-dangle: 0 */,
      domainname: doc.accessgroup,
      uuid: uuid(),
    };

    //   logger.info("tokenParams " + JSON.stringify(tokenParams));
    const token = jwt.sign(tokenParams, constants.JWT_SECRET, {
      expiresIn: parseInt(constants.EXPIRY_TIME, 10),
    });

    return Promise.resolve({
      status: true,
      message: 'JWT Token generated',
      token,
    });
  } catch (err) {
    return Promise.reject(err);
  }
};
