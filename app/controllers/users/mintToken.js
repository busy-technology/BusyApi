const { Certificate } = require('@fidm/x509');
const bs58 = require('bs58');
const User = require('../../models/Users');
const Transactions = require('../../models/transactions');
const submitTransaction = require('../../../blockchain/submitTransaction');
const constants = require('../../../constants');
const NftTokens = require('../../models/nft-token');

module.exports = async (req, res) => {
  try {
    const { walletId } = req.body;
    const { totalSupply } = req.body;
    const { tokenSymbol } = req.body;
    const { metaData } = req.body;
    const blockchainCredentials = req.body.credentials;

    const user = await User.findOne({
      walletId,
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

      const decodedPrivateKey = bs58.decode(
        blockchainCredentials.credentials.privateKey,
      );

      blockchainCredentials.credentials.privateKey =
        decodedPrivateKey.toString();

      const response = await submitTransaction.SubmitTransaction(
        constants.BUSY_CHANNEL_NAME,
        constants.DEFAULT_CONTRACT_NAME,
        'BusyTokens:Mint',
        user.walletId,
        blockchainCredentials,
        walletId,
        tokenSymbol,
        totalSupply,
        JSON.stringify(metaData),
      );

      //            logger.info(response);
      const resp = JSON.parse(response);
      if (resp.success === true) {
        const tokenEntry = await new NftTokens({
          tokenSymbol,
          totalSupply,
          tokenAddress: resp.data.tokenAddress,
          transactionId: resp.txId,
          tokenAdmin: walletId,
          properties: metaData,
          createdDate: new Date(),
        });

        await tokenEntry.save();

        const transactionEntry = await new Transactions({
          transactionType: 'mintToken',
          transactionId: resp.txId,
          submitTime: new Date(),
          payload: {
            totalSupply,
            address: walletId,
            tokenAddress: resp.tokenAddress,
            token: tokenSymbol,
            tokenMetaData: metaData,
          },
          status: 'submitted',
        });

        await transactionEntry.save();

        return res.send(200, {
          status: true,
          message:
            'Request to mint the new token has been successfully accepted',
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
