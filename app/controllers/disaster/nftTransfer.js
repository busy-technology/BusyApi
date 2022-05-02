const bs58 = require('bs58');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');

module.exports = async (req, res) => {
  const { account } = req.body;
  const { operator } = req.body;
  const { recipient } = req.body;
  const blockchainCredentials = req.body.credentials;
  const { tokenSymbol } = req.body;
  const { amount } = req.body;
  try {
    if (
      blockchainCredentials.type !== 'X.509' ||
      blockchainCredentials.mspId !== 'BusyMSP'
    ) {
      return res.send(400, {
        status: false,
        message: 'Incorrect type or MSPID',
        errorCode: 'CER002',
      });
    }

    const decodedPrivateKey = bs58.decode(
      blockchainCredentials.credentials.privateKey,
    );

    blockchainCredentials.credentials.privateKey = decodedPrivateKey.toString();

    const response = await submitTransaction.SubmitTransaction(
      constants.BUSY_CHANNEL_NAME,
      constants.DEFAULT_CONTRACT_NAME,
      'BusyTokens:TransferFrom',
      operator,
      blockchainCredentials,
      account,
      recipient,
      tokenSymbol,
      amount,
    );
    const resp = JSON.parse(response);
    if (resp.success === true) {
      return res.send(200, {
        status: true,
        message: 'Request to transfer token has been successfully accepted',
        chaincodeResponse: resp,
      });
    }
    //                console.log("Failed to execute chaincode function");
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
