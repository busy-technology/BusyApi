const logger = require('@utils/logger');
const Admin = require('../../models/admin');
const Transactions = require('../../models/transactions');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');
const Decrypt = require('../../helpers/decrypt');
const config = require('../../../config');

require('module-alias/register');

module.exports = async (req, res) => {
  try {
    const address = req.body.walletId;
    const { token } = req.body;
    const { amount } = req.body;
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
    const response = await submitTransaction.SubmitTransaction(
      constants.BUSY_CHANNEL_NAME,
      constants.DEFAULT_CONTRACT_NAME,
      'Burn',
      adminId,
      blockchainCredentials,
      address,
      amount,
      token,
    );
    const resp = JSON.parse(response);
    logger.info('DATA 2', resp);
    const { txId } = resp;

    if (resp.success === true) {
      const transactionEntry = await new Transactions({
        transactionType: 'burn',
        transactionId: txId,
        submitTime: new Date(),
        payload: {
          amount,
          address,
          token,
        },
        status: 'submitted',
      });

      await transactionEntry.save().then((err, doc) => {
        if (err || doc.length === 0) {
          console.error('error saving the transaction', err);
        }
      });

      return res.send(200, {
        status: true,
        message: 'Burn has been successfully completed',
        chaincodeResponse: resp,
      });
    }
    logger.info('Failed to execute chaincode function');
    return res.send(500, {
      status: false,
      message: 'Failed to execute chaincode function',
      chaincodeResponse: resp,
      errorCode: 'CHN001',
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
