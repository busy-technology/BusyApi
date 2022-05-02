const Admin = require('../../models/admin');
const User = require('../../models/Users');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');
const Transactions = require('../../models/transactions');
const Decrypt = require('../../helpers/decrypt');
const config = require('../../../config');

module.exports = async (req, res) => {
  try {
    const { recipient } = req.body;
    const { amount } = req.body;
    const { startAt } = req.body;
    const { releaseAt } = req.body;
    const adminId = 'busy_network';

    //        logger.info("IN USER");
    const adminData = await Admin.findOne({
      userId: adminId,
    });
    //        logger.info("ADMIN", adminData);

    const credentials = {
      certificate: Decrypt(
        adminData.certificate.credentials.certificate,
        config.ENCRYPTION_SECRET,
        config.ENCRYPTION_IV,
      ),
      privateKey: Decrypt(
        adminData.certificate.credentials.privateKey,
        config.ENCRYPTION_SECRET,
        config.ENCRYPTION_IV,
      ),
    };

    const blockchainCredentials = {
      credentials,
      mspId: adminData.certificate.mspId,
      type: adminData.certificate.type,
    };

    const user = await User.findOne({
      walletId: recipient,
    });
    //        logger.info("User", user);
    if (user) {
      const response = await submitTransaction.SubmitTransaction(
        constants.BUSY_CHANNEL_NAME,
        constants.DEFAULT_CONTRACT_NAME,
        'MultibeneficiaryVestingV2',
        adminId,
        blockchainCredentials,
        recipient,
        amount,
        startAt,
        releaseAt,
      );
      const resp = JSON.parse(response);

      if (resp.success === true) {
        const transactionEntry = await new Transactions({
          transactionType: 'vestingv2',
          transactionId: resp.txId,
          submitTime: new Date(),
          payload: {
            address: recipient,
            amount,
            startAt,
            releaseAt,
          },
          status: 'submitted',
        });

        await transactionEntry.save();

        return res.send(200, {
          status: true,
          message: 'Request to create vesting has been successfully accepted',
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
