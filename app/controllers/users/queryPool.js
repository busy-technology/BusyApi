const Admin = require('../../models/admin');
const queryTransaction = require('../../../blockchain/queryTransaction');
const constants = require('../../../constants');
const Decrypt = require('../../helpers/decrypt');
const config = require('../../../config');

module.exports = async (req, res) => {
  const adminId = 'busy_network';
  const adminData = await Admin.findOne({ userId: adminId });

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

  try {
    const response = await queryTransaction.QueryTransaction(
      constants.BUSY_CHANNEL_NAME,
      constants.DEFAULT_CONTRACT_NAME,
      'BusyVoting:QueryPool',
      adminId,
      blockchainCredentials,
    );
    const resp = JSON.parse(response);
    if (resp.success === true) {
      //            logger.info("Pool data has been successfully fetched");
      return res.send(200, {
        status: true,
        message: 'Pool data has been successfully fetched',
        chaincodeResponse: resp,
      });
    }
    //            logger.info("Failed to execute chaincode function");
    return res.send(500, {
      status: false,
      message: resp.message,
      errorCode: 'CHN002',
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
