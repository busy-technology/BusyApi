const Admin = require('../../models/admin');
const submitTransaction = require('../../../blockchain/submitTransaction');
const constants = require('../../../constants');
const Transactions = require('../../models/transactions');
const queryTransaction = require('../../../blockchain/queryTransaction');
const Decrypt = require('../../helpers/decrypt');
const config = require('../../../config');

module.exports = {
  updateMessagingFee: async (req, res) => {
    try {
      const { newFee } = req.body;
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
        'BusyMessenger:UpdateMessagingFee',
        adminId,
        blockchainCredentials,
        newFee,
      );
      const resp = JSON.parse(response);

      if (resp.success === true) {
        const transactionEntry = await new Transactions({
          transactionType: 'updateMessagingFee',
          transactionId: resp.txId,
          submitTime: new Date(),
          payload: {
            newFee,
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
      //                logger.info("Failed to execute chaincode function");
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
  },
  updateTokenIssueFee: async (req, res) => {
    try {
      const { newFee } = req.body;
      const { tokenType } = req.body;

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
        'SetTokenIssueFee',
        adminId,
        blockchainCredentials,
        tokenType,
        newFee,
      );
      const resp = JSON.parse(response);

      if (resp.success === true) {
        const transactionEntry = await new Transactions({
          transactionType: 'UpdateTokenIssueFee',
          transactionId: resp.txId,
          submitTime: new Date(),
          payload: {
            newFee,
            tokenType,
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
  },
  getMessagingFee: async (req, res) => {
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
        'BusyMessenger:GetMessagingFee',
        adminId,
        blockchainCredentials,
      );

      const resp = JSON.parse(response);
      if (resp.success === true) {
        return res.send(200, {
          status: true,
          message: 'Current messaging fee has been successfully fetched',
          chaincodeResponse: resp,
        });
      }
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
  },
  getTokenIssueFee: async (req, res) => {
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
        'GetTokenIssueFee',
        adminId,
        blockchainCredentials,
      );

      const resp = JSON.parse(response);
      if (resp.success === true) {
        return res.send(200, {
          status: true,
          message: 'Current token issue fee fee has been successfully fetched',
          chaincodeResponse: resp,
        });
      }
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
  },
};
