const logger = require('@utils/logger');
const bcrypt = require('bcrypt');
const bs58 = require('bs58');
const { Certificate } = require('@fidm/x509');
const User = require('../../models/Users');

const saltRounds = 10;
const queryTransaction = require('../../../blockchain/queryTransaction');
const constants = require('../../../constants');

require('module-alias/register');

module.exports = async (req, res) => {
  try {
    const userId = Buffer.from(req.body.userId, 'utf8').toString('base64');
    const { newPassword } = req.body;
    const blockchainCredentials = req.body.credentials;

    //        logger.info("Reset Password for USERID", userId);
    const user = await User.findOne({
      userId,
    });
    if (user) {
      const commanName = Certificate.fromPEM(
        Buffer.from(blockchainCredentials.credentials.certificate, 'utf-8'),
      ).subject.commonName;
      logger.info('CN', commanName);
      if (user.userId !== commanName) {
        return res.send(404, {
          status: false,
          message: 'User’s certificate is not valid',
          errorCode: 'CER001',
        });
      }

      if (
        blockchainCredentials.type !== 'X.509' ||
        blockchainCredentials.mspId !== 'BusyMSP'
      ) {
        //                logger.info("type of certificate incorrect.");
        return res.send(400, {
          status: false,
          message: 'Incorrect type or MSPID',
          errorCode: 'CER002',
        });
      }

      const decodedPrivateKey = bs58.decode(
        blockchainCredentials.credentials.privateKey,
      );

      blockchainCredentials.credentials.privateKey =
        decodedPrivateKey.toString();

      const response = await queryTransaction.QueryTransaction(
        constants.BUSY_CHANNEL_NAME,
        constants.DEFAULT_CONTRACT_NAME,
        'AuthenticateUser',
        user.walletId,
        blockchainCredentials,
        userId,
      );
      const resp = JSON.parse(response);
      //            logger.info(resp)
      if (resp.success === true) {
        const salt = await bcrypt.genSaltSync(saltRounds);
        const hash = await bcrypt.hashSync(newPassword, salt);
        //                logger.info("NEW HASHED PASSWORD", hash);

        await User.findOneAndUpdate(
          {
            userId,
          },
          {
            password: hash,
          },
          {
            upsert: true,
            useFindAndModify: false,
          },
        );
        return res.send(200, {
          status: true,
          message: 'Password has been updated successfully',
        });
      }
      //                logger.info("Failed to execute chaincode function");
      return res.send(400, {
        status: false,
        message: resp.message,
        errorCode: 'CHN002',
      });
    }
    //            logger.info("UserId do not exists.");
    return res.send(404, {
      status: false,
      message: 'User does not exist',
      errorCode: 'USER001',
    });
  } catch (exception) {
    const exceptionObj = exception.message
      ? exception.message.split('$')
      : null;
    if (exceptionObj && exceptionObj.length === 3) {
      return res.send(parseInt(exceptionObj[0], 10), {
        status: false,
        message: exceptionObj[2],
        errorCode: exceptionObj[1],
      });
    }
    return res.send(500, {
      status: false,
      message: exception.message,
    });
  }
};
