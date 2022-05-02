const Admin = require('../../models/admin');
const User = require('../../models/Users');
const Transactions = require('../../models/transactions');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');
const Decrypt = require('../../helpers/decrypt');
const config = require('../../../config');

module.exports = async (walletId) => {
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
    walletId,
  });
  //        logger.info("User", user);
  if (user) {
    const response = await submitTransaction.SubmitTransaction(
      constants.BUSY_CHANNEL_NAME,
      constants.DEFAULT_CONTRACT_NAME,
      'Transfer',
      adminId,
      blockchainCredentials,
      walletId,
      '10000000000000000000000',
      'BUSY',
    );

    //            logger.info(response);
    const resp = JSON.parse(response);
    if (resp.success === true) {
      const transactionEntry = await new Transactions({
        transactionType: 'swap',
        transactionId: resp.txId,
        submitTime: new Date(),
        payload: {
          amount: '10000000000000000000000',
          address: walletId,
          token: 'BUSY',
        },
        status: 'submitted',
      });

      await transactionEntry.save();
      return true;
    }
  }
  return false;
};
