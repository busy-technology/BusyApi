const { Certificate } = require('@fidm/x509');
const User = require('../../models/Users');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');
const Transactions = require('../../models/transactions');
const SendMessageCreds = require('../../models/send-message-creds');
const Decrypt = require('../../helpers/decrypt');
const config = require('../../../config');

module.exports = async (req, res) => {
  const { sender } = req.body;
  const { recipient } = req.body;
  let blockchainCredentials = req.body.credentials;
  try {
    const sendUser = await User.findOne({
      walletId: sender,
    });
    const recUser = await User.findOne({
      walletId: recipient,
    });
    if (sendUser && recUser) {
      const messageCredsData = await SendMessageCreds.findOne({
        userId: sendUser.userId,
      });

      if (!messageCredsData) {
        return res.send(404, {
          status: false,
          message: 'User’s Messages Credentials have not been generated',
          errorCode: 'MCR002',
        });
      }
      const credentials = {
        certificate: Decrypt(
          blockchainCredentials.credentials.certificate,
          config.ENCRYPTION_SECRET,
          config.ENCRYPTION_IV,
        ),
        privateKey: Decrypt(
          blockchainCredentials.credentials.privateKey,
          config.ENCRYPTION_SECRET,
          config.ENCRYPTION_IV,
        ),
      };

      blockchainCredentials = {
        credentials,
        mspId: messageCredsData.certificate.mspId,
        type: messageCredsData.certificate.type,
      };
      const commanName = Certificate.fromPEM(
        Buffer.from(blockchainCredentials.credentials.certificate, 'utf-8'),
      ).subject.commonName;

      if (`M-${sendUser.userId}` !== commanName) {
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

      const response = await submitTransaction.SubmitTransaction(
        constants.BUSY_CHANNEL_NAME,
        constants.DEFAULT_CONTRACT_NAME,
        'BusyMessenger:SendMessage',
        `${sendUser.walletId}-message`,
        blockchainCredentials,
        recUser.walletId,
        constants.BUSY_TOKEN,
      );
      const resp = JSON.parse(response);
      if (resp.success === true) {
        //                logger.info("Message Sent Successfully")

        // Storing the data from the blockchain
        await User.updateOne(
          {
            walletId: sender,
          },
          {
            messageCoins: resp.data.Sender,
          },
        );
        await User.updateOne(
          {
            walletId: recipient,
          },
          {
            messageCoins: resp.data.Recipient,
          },
        );

        const transactionEntry = await new Transactions({
          transactionType: 'sendmessage',
          transactionId: resp.txId,
          submitTime: new Date(),
          payload: {
            token: constants.BUSY_TOKEN,
            address: sender,
            recipient,
          },
          status: 'submitted',
        });

        await transactionEntry.save();
        return res.send(200, {
          status: true,
          message: 'Message has been successfully sent',
          chaincodeResponse: resp,
        });
      }
      //                logger.info("Failed to execute chaincode function");
      return res.send(500, {
        status: false,
        message: resp.message,
        errorCode: 'CHN002',
      });
    }
    if (!sendUser) {
      //                logger.info("Sender WalletId do not exist.");
      return res.send(404, {
        status: false,
        message: 'Sender’s address does not exist',
        errorCode: 'USER002',
      });
    }
    //                logger.info("Recipient WalletId do not exist.");
    return res.send(404, {
      status: false,
      message: "Recipient's address does not exist",
      errorCode: 'USER003',
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
