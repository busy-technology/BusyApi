const logger = require('@utils/logger');
const User = require('../../models/Users');

require('module-alias/register');

module.exports = async (req, res) => {
  try {
    const { walletId } = req.body;
    const user = await User.findOne({ walletId });

    if (user) {
      return res.send(200, {
        status: true,
        message: 'User wallet has been successfully fetched',
        chaincodeResponse: {
          tokens: user.tokens,
          messageCoins: user.messageCoins,
        },
      });
    }
    logger.info('WalletId does not exist');
    return res.send(404, {
      status: false,
      message: 'WalletId does not exist',
      errorCode: 'WAL002',
    });
  } catch (exception) {
    logger.info(exception);
    return res.send(500, {
      status: false,
      message: exception.message,
      errorCode: 'WAL001',
    });
  }
};
