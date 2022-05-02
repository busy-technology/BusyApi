const uuid = require('uuid-random');
const jwt = require('jsonwebtoken');
const constants = require('../../../config');

module.exports = async (req) => {
  try {
    const apiKey = req.headers.apikey;
    //   console.log("apiKey " + apiKey);
    if (!apiKey || apiKey === '') {
      return Promise.reject({
        status: false,
        message: 'Please send an apiKey',
        code: 400,
      });
    }
    const tokenParams = {
      domainname: 'diaster token',
      uuid: uuid(),
    };

    //   console.log("tokenParams " + JSON.stringify(tokenParams));
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
