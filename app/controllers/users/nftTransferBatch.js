const bs58 = require('bs58');
const { Certificate } = require('@fidm/x509');
const User = require('../../models/Users');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');
const Transactions = require('../../models/transactions');

module.exports = async (req, res) => {
  const { account } = req.body;
  const { operator } = req.body;
  const { recipient } = req.body;
  const blockchainCredentials = req.body.credentials;
  const { tokenSymbols } = req.body;
  const { amounts } = req.body;
  try {
    const sendUser = await User.findOne({
      walletId: operator,
    });
    const recUser = await User.findOne({
      walletId: recipient,
    });
    if (sendUser && recUser) {
      const commanName = Certificate.fromPEM(
        Buffer.from(blockchainCredentials.credentials.certificate, 'utf-8'),
      ).subject.commonName;
      //            logger.info("CN", commanName);
      if (sendUser.userId !== commanName) {
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

      const response = await submitTransaction.SubmitTransaction(
        constants.BUSY_CHANNEL_NAME,
        constants.DEFAULT_CONTRACT_NAME,
        'BusyTokens:BatchTransferFrom',
        sendUser.walletId,
        blockchainCredentials,
        account,
        recipient,
        JSON.stringify(tokenSymbols),
        JSON.stringify(amounts),
      );
      const resp = JSON.parse(response);
      if (resp.success === true) {
        //                logger.info("Token Batch transfer successful")

        const transactionEntry = await new Transactions({
          transactionType: 'nftTransferBatch',
          transactionId: resp.txId,
          submitTime: new Date(),
          payload: {
            address: account,
            recipient,
            tokenSymbol: tokenSymbols,
            amount: amounts,
          },
          status: 'submitted',
        });

        await transactionEntry.save();

        return res.send(200, {
          status: true,
          message:
            'Request to transfer NFT tokens has been successfully accepted',
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
