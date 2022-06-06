const Admin = require('../../models/admin');
const submitTransaction = require('../../../blockchain/submitTransaction');
const constants = require('../../../constants');
const Transactions = require('../../models/transactions');
const Decrypt = require('../../helpers/decrypt');
const config = require('../../../config');

module.exports = async (req, res) => {
  try {
    const { newTransferFee } = req.body;
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

    const response = await submitTransaction.SubmitTransaction(
      constants.BUSY_CHANNEL_NAME,
      constants.DEFAULT_CONTRACT_NAME,
      'UpdateTransferFee',
      adminId,
      blockchainCredentials,
      newTransferFee,
    );
    const resp = JSON.parse(response);

    if (resp.success === true) {
      const transactionEntry = await new Transactions({
        transactionType: 'transferfee',
        transactionId: resp.txId,
        submitTime: new Date(),
        payload: {
          transferfee: newTransferFee,
          address: adminId,
        },
        status: 'submitted',
      });

      await transactionEntry.save();

      return res.send(200, {
        status: true,
        message:
          'Request to update transaction fee has been successfully accepted',
        chaincodeResponse: resp,
      });
    }
    //            logger.info("Failed to execute chaincode function");
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