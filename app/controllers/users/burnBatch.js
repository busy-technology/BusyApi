const { Certificate } = require('@fidm/x509');
const bs58 = require('bs58');
const User = require('../../models/Users');
const Transactions = require('../../models/transactions');
const submitTransaction = require('../../../blockchain/submitTransaction');
const constants = require('../../../constants');

module.exports = async (req, res) => {
  try {
    const { walletId } = req.body;
    const { amounts } = req.body;
    const { tokenSymbols } = req.body;
    const blockchainCredentials = req.body.credentials;

    const user = await User.findOne({
      walletId,
    });
    if (user) {
      const commanName = Certificate.fromPEM(
        Buffer.from(blockchainCredentials.credentials.certificate, 'utf-8'),
      ).subject.commonName;

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
        'BusyTokens:BurnBatch',
        walletId,
        blockchainCredentials,
        walletId,
        JSON.stringify(tokenSymbols),
        JSON.stringify(amounts),
      );

      //            logger.info(response);
      const resp = JSON.parse(response);
      if (resp.success === true) {
        const transactionEntry = await new Transactions({
          transactionType: 'burnBatch',
          transactionId: resp.txId,
          submitTime: new Date(),
          payload: {
            amount: amounts,
            address: walletId,
            token: tokenSymbols,
          },
          status: 'submitted',
        });

        await transactionEntry.save();
        return res.send(200, {
          status: true,
          message: 'Request to burn tokens has been successfully accepted',
          chaincodeResponse: resp,
        });
      }
      //                logger.info("Failed to execute chaincode function");
      return res.send(500, {
        status: false,
        message: 'Failed to execute chaincode function',
        chaincodeResponse: resp,
        errorCode: 'CHN001',
      });
    }
    //            logger.info("WalletId do not exists.");
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
