const logger = require('@utils/logger');
const bs58 = require('bs58');
const User = require('../../models/Users');
const recoverUser = require('../../../blockchain/recoverUser');

require('module-alias/register');

module.exports = async (req, res) => {
  try {
    const userId = Buffer.from(req.body.userId, 'utf8').toString('base64');
    const seedPhrase = req.body.mnemonic;

    //        logger.info("USERID", userId);
    const user = await User.findOne({
      userId,
    });

    if (user) {
      try {
        const response = await recoverUser(userId, seedPhrase);

        logger.info(response);
        if (response.blockchainCredentials.credentials) {
          const bytes = Buffer.from(
            response.blockchainCredentials.credentials.privateKey,
            'utf-8',
          );

          const encodedPrivateKey = bs58.encode(bytes);

          response.blockchainCredentials.credentials.privateKey =
            encodedPrivateKey;

          return res.send(200, {
            status: true,
            message: 'Successfully recovered User credentials',
            walletId: user.walletId,
            privateKey: response.blockchainCredentials,
          });
        }
        return {};
      } catch (exception) {
        return res.send(409, {
          status: false,
          message: 'The entered seed phrase is not correct',
          errorCode: 'REU001',
        });
      }
    } else {
      //            logger.info("UserId do not exists.");
      return res.send(404, {
        status: false,
        message: 'User does not exist',
        errorCode: 'USER001',
      });
    }
  } catch (exception) {
    return res.send(500, {
      status: false,
      message: exception.message,
      errorCode: 'REU002',
    });
  }
};
