const logger = require('@utils/logger');
const { Certificate } = require('@fidm/x509');
const bs58 = require('bs58');
const User = require('../../models/Users');
const Transactions = require('../../models/transactions');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');
const IssuetokenTransactions = require('../../models/issued-tokens');

require('module-alias/register');

module.exports = async (req, res) => {
  try {
    const { sender } = req.body;
    const blockchainCredentials = req.body.credentials;
    const { recipiant } = req.body;
    const { amount } = req.body;
    const { token } = req.body;

    const user = await User.findOne({
      walletId: sender,
    });
    //        logger.info("User", user);

    if (user) {
      const commanName = Certificate.fromPEM(
        Buffer.from(blockchainCredentials.credentials.certificate, 'utf-8'),
      ).subject.commonName;
      //            logger.info("CN", commanName);

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

      const receiver = await User.findOne({
        walletId: recipiant,
      });

      if (receiver) {
        const decodedPrivateKey = bs58.decode(
          blockchainCredentials.credentials.privateKey,
        );

        blockchainCredentials.credentials.privateKey =
          decodedPrivateKey.toString();

        if (sender === receiver) {
          return res.send(409, {
            status: false,
            message: 'Sender cannot be same as recipient',
            errorCode: 'USER004',
          });
        }

        let decimals = 18;
        if (token !== constants.BUSY_TOKEN) {
          // getting the IssuedTokens;
          const query = await IssuetokenTransactions.findOne({
            tokenSymbol: token,
          });

          if (query) {
            decimals = query.tokenDecimals;
          }
        }
        const response = await submitTransaction.SubmitTransaction(
          constants.BUSY_CHANNEL_NAME,
          constants.DEFAULT_CONTRACT_NAME,
          'Transfer',
          sender,
          blockchainCredentials,
          recipiant,
          amount,
          token,
        );
        const resp = JSON.parse(response);
        const { txId } = resp;
        logger.info('TRANSACTION ID', txId);

        if (resp.success === true) {
          const transactionEntry = await new Transactions({
            transactionType: 'transfer',
            transactionId: resp.txId,
            submitTime: new Date(),
            ipAddress: req.socket.remoteAddress,
            payload: {
              token,
              address: sender,
              recipient: recipiant,
              amount,
              decimals,
            },
            status: 'submitted',
          });

          await transactionEntry.save();

          return res.send(200, {
            status: true,
            message: 'Request to transfer has been successfully accepted',
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
      //                logger.info("recipient walletId do not exists.");
      return res.send(404, {
        status: false,
        message: "Recipient's address does not exist",
        errorCode: 'USER003',
      });
    }
    //            logger.info("sender walletId do not exists.");
    return res.send(404, {
      status: false,
      message: 'Sender’s address does not exist',
      errorCode: 'USER002',
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
