const bip39 = require('bip39');
const User = require('../../models/Users');
const EnrollMessageCreds = require('../../../blockchain/enrollMessageCreds');
const SendMessageCreds = require('../../models/send-message-creds');

module.exports = async (req, res) => {
  try {
    const { walletId } = req.body;

    const user = await User.findOne({
      walletId,
    });

    if (!user) {
      return res.send(404, {
        status: false,
        message: 'WalletId does not exist',
        errorCode: 'WAL002',
      });
    }

    const messageCredsCount = await SendMessageCreds.countDocuments({
      userId: user.userId,
    });

    if (messageCredsCount > 0) {
      const messageCredsData = await SendMessageCreds.find({
        userId: user.userId,
      });

      const randomMessageCreds =
        messageCredsData[Math.floor(Math.random() * (4 - 0 + 1)) + 0];
      return res.send(200, {
        status: true,
        message: 'Message Credentials Successfully generated',
        chaincodeResponse: {
          credentials: {
            certificate: randomMessageCreds.certificate.credentials.certificate,
            privateKey: randomMessageCreds.certificate.credentials.privateKey,
          },
          mspId: randomMessageCreds.certificate.mspId,
          type: randomMessageCreds.certificate.type,
        },
      });
    }

    const mnemonic = bip39.generateMnemonic();

    const credentials = await EnrollMessageCreds(user.userId, mnemonic);
    return res.send(200, {
      status: true,
      message: 'Message Credentials Successfully generated',
      chaincodeResponse: credentials,
    });
  } catch (exception) {
    return res.send(500, {
      status: false,
      message: exception.message,
      errorCode: 'MCR001',
    });
  }
};
