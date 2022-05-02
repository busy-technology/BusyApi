const User = require('../../models/Users');
const Admin = require('../../models/admin');
const Transactions = require('../../models/transactions');
const submitTransaction = require('../../../blockchain/submitTransaction');
const constants = require('../../../constants');
const Decrypt = require('../../helpers/decrypt');
const config = require('../../../config');

module.exports = async (req, res) => {
  try {
    const { recipiant } = req.body;
    const { amount } = req.body;
    const { token } = req.body;
    const adminId = 'busy_network';

    const adminData = await Admin.findOne({
      userId: adminId,
    });

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
      walletId: recipiant,
    });
    //        logger.info("User", user);
    if (user) {
      const response = await submitTransaction.SubmitTransaction(
        constants.BUSY_CHANNEL_NAME,
        constants.DEFAULT_CONTRACT_NAME,
        'Transfer',
        adminId,
        blockchainCredentials,
        recipiant,
        amount,
        token,
      );

      //            logger.info(response);
      const resp = JSON.parse(response);
      if (resp.success === true) {
        const transactionEntry = await new Transactions({
          transactionType: 'swap',
          transactionId: resp.txId,
          submitTime: new Date(),
          payload: {
            amount,
            address: recipiant,
            token,
          },
          status: 'submitted',
        });

        await transactionEntry.save();
        return res.send(200, {
          status: true,
          message: 'Request to Swap has been successfully accepted',
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
    //            logger.info("Recipient WalletId do not exists.");
    return res.send(404, {
      status: false,
      message: "Recipient's address does not exist",
      erroCode: 'USER003',
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
