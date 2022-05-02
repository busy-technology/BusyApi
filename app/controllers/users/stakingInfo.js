const Admin = require('../../models/admin');
const User = require('../../models/Users');
const queryTransaction = require('../../../blockchain/queryTransaction');
const constants = require('../../../constants');
const Decrypt = require('../../helpers/decrypt');
const config = require('../../../config');

module.exports = async (req, res) => {
  try {
    const { walletId } = req.body;
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

    const id = await User.findOne({
      walletId,
    });
    // logger.info("ADDRESS", address);

    if (id) {
      const response = await queryTransaction.QueryTransaction(
        constants.BUSY_CHANNEL_NAME,
        constants.DEFAULT_CONTRACT_NAME,
        'GetStakingInfo',
        adminId,
        blockchainCredentials,
        id.userId,
      );
      const resp = JSON.parse(response);

      if (resp.success === true) {
        return res.send(200, {
          status: true,
          message: 'Staking information has been successfully fetched',
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
    //            logger.info("userId do not exists.");
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
