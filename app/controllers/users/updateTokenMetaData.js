const { Certificate } = require('@fidm/x509');
const bs58 = require('bs58');
const User = require('../../models/Users');
const Transactions = require('../../models/transactions');
const submitTransaction = require('../../../blockchain/submitTransaction');
const constants = require('../../../constants');
const NftTokens = require('../../models/nft-token');
const IssuetokenTransactions = require('../../models/issued-tokens');

module.exports = async (req, res) => {
  try {
    const { walletId } = req.body;
    const { tokenSymbol } = req.body;
    const { metaData } = req.body;
    const { tokenType } = req.body;
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

      let tokenDetails;
      if (tokenType === 'BUSY20') {
        tokenDetails = await IssuetokenTransactions.findOne({
          tokenSymbol,
        });
        if (!tokenDetails) {
          return res.send(400, {
            status: 404,
            message: `token ${tokenSymbol} does not exist`,
          });
        }
        Object.keys(metaData).forEach((key) => {
          tokenDetails.properties[key] = metaData[key];
        });
      } else if (tokenType === 'GAME' || tokenType === 'NFT') {
        tokenDetails = await NftTokens.findOne({
          tokenSymbol,
        });
        if (!tokenDetails) {
          return res.send(400, {
            status: 404,
            message: `token ${tokenSymbol} does not exist`,
          });
        }
        Object.keys(metaData).forEach((key) => {
          tokenDetails.properties[key] = metaData[key];
        });
      }

      const response = await submitTransaction.SubmitTransaction(
        constants.BUSY_CHANNEL_NAME,
        constants.DEFAULT_CONTRACT_NAME,
        'BusyTokens:UpdateTokenMetaData',
        user.walletId,
        blockchainCredentials,
        tokenSymbol,
        JSON.stringify(tokenDetails.properties),
        tokenType,
      );

      //            logger.info(response);
      const resp = JSON.parse(response);
      if (resp.success === true) {
        const transactionEntry = await new Transactions({
          transactionType: 'UpdateTokenMetaData',
          transactionId: resp.txId,
          submitTime: new Date(),
          payload: {
            address: walletId,
            token: tokenSymbol,
            newMetaData: metaData,
            tokenAddress: resp.data.tokenAddress,
          },
          status: 'submitted',
        });

        await transactionEntry.save();

        if (tokenType === 'BUSY20') {
          await IssuetokenTransactions.updateOne(
            {
              tokenSymbol,
            },
            {
              metaData: tokenDetails.properties,
            },
          );
        } else if (tokenType === 'GAME' || tokenType === 'NFT') {
          await NftTokens.updateOne(
            {
              tokenSymbol,
            },
            {
              properties: tokenDetails.properties,
            },
          );
        }

        return res.send(200, {
          status: true,
          message: 'Token metadata updated successfully',
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
