const bs58 = require('bs58');
const constants = require('../../../constants');
const submitTransaction = require('../../../blockchain/submitTransaction');

module.exports = async (req, res) => {
  const { account } = req.body;
  const { recipient } = req.body;
  const { operator } = req.body;
  const blockchainCredentials = req.body.credentials;
  const { tokenSymbols } = req.body;
  const { amounts } = req.body;
  try {
    if (
      blockchainCredentials.type !== 'X.509' ||
      blockchainCredentials.mspId !== 'BusyMSP'
    ) {
      //                console.log("type of certificate incorrect.");
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
      'BusyTokens:BatchTransferFrom',
      operator,
      blockchainCredentials,
      account,
      recipient,
      JSON.stringify(tokenSymbols),
      JSON.stringify(amounts),
    );
    const resp = JSON.parse(response);
    if (resp.success === true) {
      return res.send(200, {
        status: true,
        message:
          'Request to transfer NFT tokens has been successfully accepted',
        chaincodeResponse: resp,
      });
    }
    return res.send(500, {
      status: false,
      message: resp.message,
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
