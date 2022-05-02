const logger = require('@utils/logger');
const { Certificate } = require('@fidm/x509');
const bs58 = require('bs58');
const User = require('../../models/Users');
const Transactions = require('../../models/transactions');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');

require('module-alias/register');

module.exports = async (req, res) => {
  try {
    const blockchainCredentials = req.body.credentials;
    const { walletId } = req.body;

    const user = await User.findOne({
      walletId,
    });

    if (user) {
      const commanName = Certificate.fromPEM(
        Buffer.from(blockchainCredentials.credentials.certificate, 'utf-8'),
      ).subject.commonName;
      //                logger.info("CN", commanName);

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
        //                    logger.info("type of certificate incorrect.");
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
        'ClaimAll',
        user.walletId,
        blockchainCredentials,
      );

      const resp = JSON.parse(response);
      //                logger.info("TRANSACTION ID", txId);

      if (resp.success === true) {
        const transactionEntry = await new Transactions({
          transactionType: 'claimAll',
          transactionId: resp.txId,
          submitTime: new Date(),
          ipAddress: req.socket.remoteAddress,
          payload: {
            tokenName: constants.BUSY_TOKEN,
            address: user.walletId,
            data: resp.data.stakingList,
            amount: resp.data.totalClaimed,
            totalFee: resp.data.totalFee,
          },
          status: 'submitted',
        });

        await transactionEntry.save();

        logger.info(resp.data);

        return res.send(200, {
          status: true,
          message:
            'Request to claim staking reward has been successfully accepted',
          chaincodeResponse: resp,
        });
      }
      //                    logger.info("Failed to execute chaincode function");
      return res.send(500, {
        status: false,
        message: 'Failed to execute chaincode function',
        chaincodeResponse: resp,
        errorCode: 'CHN001',
      });
    }
    //                logger.info("User having this staking address not found.");
    return res.send(404, {
      status: false,
      message: 'WalletId does not exist',
      errorCode: 'WAL002',
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
