const logger = require('@utils/logger');
const ApiKeyModel = require('../../models/api-keys');

require('module-alias/register');

module.exports = async (req) => {
  try {
    const requestBody = req.body;
    const { apiKey } = requestBody;
    const { userNickname } = requestBody;
    if (!apiKey || apiKey === '') {
      return Promise.reject({
        status: false,
        message: 'Please send an apiKey',
        code: 400,
      });
    }
    if (!userNickname || userNickname === '') {
      return Promise.reject({
        status: false,
        message: 'Please send an userNickname',
        code: 400,
      });
    }

    const docList = await ApiKeyModel.find({
      apikey: apiKey,
      usernickname: userNickname,
    });

    logger.info(`docList size ${docList.length}`);

    if (docList.length === 0) {
      return Promise.reject({
        status: false,
        message: 'This userNickname / apiKey combination is not present',
        code: 500,
      });
    }

    ApiKeyModel.deleteMany(
      { apikey: apiKey, usernickname: userNickname },
      (err, result) => {
        if (err) {
          logger.error(err);
          return Promise.reject({
            status: false,
            message: err,
            code: 500,
          });
        }
        logger.info(result);

        return Promise.resolve({
          status: true,
          message: 'Successfully Revoked  API Key',
        });
      },
    );
    return Promise.resolve({
      status: true,
      message: 'Successfully Revoked  API Key',
    });
  } catch (err) {
    return Promise.reject({ code: 500, message: err });
  }
};
