const { Certificate } = require('@fidm/x509');
const bs58 = require('bs58');
const User = require('../../models/Users');
const Wallet = require('../../models/Wallets');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');
const Transactions = require('../../models/transactions');

module.exports = async (req, res) => {
  try {
    const { walletId } = req.body;
    const blockchainCredentials = req.body.credentials;
    //        console.log("TYPE", type);

    const user = await User.findOne({
      walletId,
    });
    //        console.log("User", user);
    if (user) {
      const commanName = Certificate.fromPEM(
        Buffer.from(blockchainCredentials.credentials.certificate, 'utf-8'),
      ).subject.commonName;
      //            console.log("CN", commanName);
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
        //                    console.log("type of certificate incorrect.");
        return res.send(400, {
          status: false,
          message: 'Incorrect type or MSPID',
          errorCode: 'CER002',
        });
      }

      // const decodedPrivateKey = base58.decode(
      //   blockchainCredentials.credentials.privateKey
      // );
      const decodedPrivateKey = bs58.decode(
        blockchainCredentials.credentials.privateKey,
      );

      blockchainCredentials.credentials.privateKey =
        decodedPrivateKey.toString();

      const response = await submitTransaction.SubmitTransaction(
        constants.BUSY_CHANNEL_NAME,
        constants.DEFAULT_CONTRACT_NAME,
        'CreateStakingAddress',
        user.walletId,
        blockchainCredentials,
      );
      const resp = JSON.parse(response);

      if (resp.success === true) {
        const stakingWalletId = resp.data.stakingAddr;
        const wallet = await new Wallet({
          userId: user.userId,
          stakingWalletId,
          walletId: user.walletId,
          txId: resp.txId,
          stakedCoins: resp.data.stakedCoins,
          unstaked: false,
          initialStakingLimit: resp.data.initialStakingLimit,
          totalReward: resp.data.totalReward,
          createdDate: new Date(),
          claimed: resp.data.claimed,
        });

        await wallet.save();

        const transactionEntry = await new Transactions({
          transactionType: 'createstakingaddress',
          transactionId: resp.txId,
          submitTime: new Date(),
          ipAddress: req.socket.remoteAddress,
          payload: {
            tokenName: constants.BUSY_TOKEN,
            address: user.walletId,
            recipient: stakingWalletId,
            stakedCoins: resp.data.stakedCoins,
            initialStakingLimit: resp.data.initialStakingLimit,
            totalReward: resp.data.totalReward,
            claimed: resp.data.claimed,
          },
          status: 'submitted',
        });

        await transactionEntry.save();

        return res.send(200, {
          status: true,
          message: 'Staking address has been successfully created',
          chaincodeResponse: stakingWalletId,
        });
      }
      //                    console.log("Failed to execute chaincode function");
      return res.send(500, {
        status: false,
        message: 'Failed to execute chaincode function',
        chaincodeResponse: resp,
        errorCode: 'CHN001',
      });
    }
    //            console.log("UserId do not exists.");
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
