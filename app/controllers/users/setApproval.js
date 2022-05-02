const bs58 = require('bs58');
const { Certificate } = require('@fidm/x509');
const User = require('../../models/Users');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');
const Transactions = require('../../models/transactions');

module.exports = async (req, res) => {
  const { walletId } = req.body;
  const blockchainCredentials = req.body.credentials;
  const { operator } = req.body;
  const { approved } = req.body;
  try {
    const user = await User.findOne({
      walletId,
    });
    if (user) {
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
        'BusyTokens:SetApprovalForAll',
        user.walletId,
        blockchainCredentials,
        operator,
        approved,
      );
      const resp = JSON.parse(response);
      if (resp.success === true) {
        //        logger.info("Nft Approval Succesffuly Set")

        const transactionEntry = await new Transactions({
          transactionType: 'nftApprovalSet',
          transactionId: resp.txId,
          submitTime: new Date(),
          payload: {
            address: walletId,
            operator,
            approved,
          },
          status: 'submitted',
        });

        await transactionEntry.save();

        return res.send(200, {
          status: true,
          message: 'Request to set NFT approval has been successfully accepted',
          chaincodeResponse: resp,
        });
      }
      //        logger.info("Failed to execute chaincode function");
      return res.send(500, {
        status: false,
        message: resp.message,
        errorCode: 'CHN002',
      });
    }
    //        logger.info("WalletId do not exist.");
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
