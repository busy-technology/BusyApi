const logger = require('@utils/logger');
const bip39 = require('bip39');
const bs58 = require('bs58');
const { Certificate } = require('@fidm/x509');
const recoverSeed = require('../../../blockchain/recoverSeed');
const User = require('../../models/Users');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');

require('module-alias/register');

module.exports = async (req, res) => {
  try {
    const userId = Buffer.from(req.body.userId, 'utf8').toString('base64');
    const blockchainCredentials = req.body.credentials;

    const user = await User.findOne({
      userId,
    });

    if (user) {
      try {
        const commanName = Certificate.fromPEM(
          Buffer.from(blockchainCredentials.credentials.certificate, 'utf-8'),
        ).subject.commonName;
        //      logger.info("CN", commanName);
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
          //        logger.info("type of certificate incorrect.");
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

        const response = await submitTransaction.SubmitTransaction(
          constants.BUSY_CHANNEL_NAME,
          constants.DEFAULT_CONTRACT_NAME,
          'AuthenticateUser',
          user.walletId,
          blockchainCredentials,
          user.userId,
        );
        const resp = JSON.parse(response);

        if (resp.success === true) {
          const mnemonic = bip39.generateMnemonic();
          const recoverResp = await recoverSeed(
            {
              userId,
              walletId: user.walletId,
            },
            mnemonic,
          );
          logger.info(recoverResp);

          return res.send(200, {
            status: true,
            message: 'Succesffully recovered seed phrase',
            seedPhrase: mnemonic,
          });
        }
        return res.send(500, {
          status: false,
          message: resp.message,
          errorCode: 'CHN002',
        });
      } catch (exception) {
        //    logger.info("exception in User exists", exception);
        return res.send(400, {
          status: false,
          message: 'The entered seed phrase is not correct',
          errorCode: 'RES001',
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
    //        logger.info(exception);
    return res.send(500, {
      status: false,
      message: exception.message,
      errorCode: 'RES002',
    });
  }
};
