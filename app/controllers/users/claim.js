const { Certificate } = require('@fidm/x509');
const bs58 = require('bs58');
const User = require('../../models/Users');
const Wallet = require('../../models/Wallets');
const Transactions = require('../../models/transactions');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');

module.exports = async (req, res) => {
  try {
    const { stakingAddr } = req.body;
    const blockchainCredentials = req.body.credentials;

    const address = await Wallet.findOne({
      stakingWalletId: stakingAddr,
    });
    //        logger.info("ADDRESS", address);

    if (address) {
      const user = await User.findOne({
        walletId: address.walletId,
      });
      //            logger.info("User", user);

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
          'Claim',
          user.walletId,
          blockchainCredentials,
          stakingAddr,
        );

        const resp = JSON.parse(response);
        //                logger.info("TRANSACTION ID", txId);

        if (resp.success === true) {
          const transactionEntry = await new Transactions({
            transactionType: 'claim',
            transactionId: resp.txId,
            submitTime: new Date(),
            payload: {
              tokenName: constants.BUSY_TOKEN,
              amount: resp.data.amount,
              totalReward: resp.data.totalReward,
              claimed: resp.data.claimed,
              address: resp.data.defaultWalletAddress,
              stakingWalletId: resp.data.stakingAddr,
            },
            status: 'submitted',
          });

          await transactionEntry.save();

          await Wallet.updateOne(
            {
              stakingWalletId: address.stakingWalletId,
            },
            {
              amount: resp.data.amount,
              totalReward: resp.data.totalReward,
              claimed: resp.data.claimed,
            },
          );

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
      return res.send(403, {
        status: false,
        message: 'User does not own this staking address',
        errorCode: 'STK010',
      });
    }
    //            logger.info("stakingAddr do not exists.");
    return res.send(404, {
      status: false,
      message: 'Staking address does not exist',
      errorCode: 'STK009',
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
