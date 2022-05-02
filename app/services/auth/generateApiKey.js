const logger = require('@utils/logger');
const mongoose = require('mongoose');
const ApiKeyModel = require('../../models/api-keys');

require('module-alias/register');

module.exports = async (req) => {
  try {
    const requestBody = req.body;
    const { userNickname } = requestBody;
    if (!userNickname || userNickname === '') {
      return Promise.reject({
        status: false,
        message: 'Please send a userNickname',
        code: 404,
      });
    }

    const docList = await ApiKeyModel.find({ usernickname: userNickname });

    logger.info(`docList size ${docList.length}`);

    if (docList.length >= 3) {
      return Promise.reject({
        status: false,
        message: 'The user has already 3 api keys',
        data: docList,
        code: 500,
      });
    }
    const newApiKey = mongoose.Types.ObjectId();
    logger.info(`newApiKey. ${newApiKey}`);
    const newDoc = new ApiKeyModel({
      accessgroup: 'busyuser',
      apikey: newApiKey,
      usernickname: userNickname,
    });

    newDoc.save((err, result) => {
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
        accessgroup: 'busyuser',
        apikey: newApiKey,
      });
    });

    return Promise.resolve({
      accessgroup: 'busyuser',
      apikey: newApiKey,
    });
  } catch (err) {
    return Promise.reject({ code: 500, message: err });
  }
};
