const { Certificate } = require('@fidm/x509');
const bs58 = require('bs58');
const User = require('../../models/Users');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');
const Transactions = require('../../models/transactions');
const IssuetokenTransactions = require('../../models/issued-tokens');

module.exports = async (req, res) => {
  try {
    const { walletId } = req.body;
    const blockchainCredentials = req.body.credentials;
    const { tokenName } = req.body;
    const { symbol } = req.body;
    const { amount } = req.body;
    const { decimals } = req.body;
    const metadata = req.body.metaData;

    //        logger.info("TokenName", tokenName);
    //        logger.info("Symbol", symbol);

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
      const lowerTokenName = tokenName.toLowerCase();
      //            logger.info("lowerTokenName", lowerTokenName);
      const lowerToken = symbol.toLowerCase();
      //            logger.info("LOWER TOKEN", lowerToken);
      const coinSymbol = await IssuetokenTransactions.findOne({
        symbol: lowerToken,
      });
      //            logger.info("COIN", coinSymbol);
      const coinName = await IssuetokenTransactions.findOne({
        name: lowerTokenName,
      });
      //            logger.info("COIN", coinName);
      if (!coinName) {
        if (!coinSymbol) {
          const decodedPrivateKey = bs58.decode(
            blockchainCredentials.credentials.privateKey,
          );

          blockchainCredentials.credentials.privateKey =
            decodedPrivateKey.toString();

          const response = await submitTransaction.SubmitTransaction(
            constants.BUSY_CHANNEL_NAME,
            constants.DEFAULT_CONTRACT_NAME,
            'IssueToken',
            walletId,
            blockchainCredentials,
            tokenName,
            symbol,
            amount,
            decimals,
            JSON.stringify(metadata),
          );
          const resp = JSON.parse(response);

          if (resp.success === true) {
            const tokenEntry = await new IssuetokenTransactions({
              tokenName,
              tokenSymbol: resp.data.tokenSymbol,
              transactionId: resp.txId,
              tokenDecimals: decimals,
              createdDate: new Date(),
              tokenAdmin: walletId,
              tokenId: resp.data.id,
              tokenSupply: resp.data.totalSupply,
              tokenAddress: resp.data.tokenAddress,
              metaData: resp.data.tokenMetaData,
            });

            await tokenEntry.save();

            const transactionEntry = await new Transactions({
              transactionType: 'issue',
              transactionId: resp.txId,
              submitTime: new Date(),
              payload: {
                name: resp.data.tokenName,
                amount,
                tokenSymbol: resp.data.tokenSymbol,
                symbol: resp.data.tokenSymbol,
                tokenAdmin: resp.data.admin,
                tokenId: resp.data.id,
                tokenSupply: resp.data.totalSupply,
                tokenDecimals: resp.data.decimals,
                sender: 'Busy network',
                address: walletId,
              },
              status: 'submitted',
            });

            await transactionEntry.save();

            return res.send(200, {
              status: true,
              message:
                'Request to create a new token has been successfully accepted',
              chaincodeResponse: resp,
            });
          }
          //                        logger.info("Failed to execute chaincode function");
          return res.send(500, {
            status: false,
            message: 'Failed to execute chaincode function',
            chaincodeResponse: resp,
            errorCode: 'CHN001',
          });
        }
        //                    logger.info("The symbol is already taken");
        return res.send(409, {
          status: false,
          message: 'The symbol is already taken',
          errorCode: 'TOK001',
        });
      }
      //                logger.info("The name is already taken.");
      return res.send(409, {
        status: false,
        message: 'The name is already taken',
        errorCode: 'TOK002',
      });
    }
    //            logger.info("WalletId do not exists.");
    return res.send(404, {
      status: false,
      message: 'Wallet does not exist',
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
