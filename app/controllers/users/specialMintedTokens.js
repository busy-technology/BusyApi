const busyNftTokens = require('../../models/busy-nft-token');
const Transactions = require('../../models/transactions');
const User = require('../../models/Users');

module.exports = async (req, res) => {
  let query;
  if (req.query.walletId === '' || req.query.walletId == null) {
    query = await busyNftTokens.find({});
  } else {
    const user = await User.findOne({
      walletId: req.query.walletId,
    });

    if (!user) {
      return res.send(404, {
        status: false,
        message: 'Wallet does not exist',
        errorCode: 'WAL002',
      });
    }
    query = await busyNftTokens.find({
      tokenAdmin: req.query.walletId,
    });
  }
  if (!query) {
    return res.send(500, {
      status: false,
      message: 'Error fetching Special Minted Tokens',
      errorCode: 'SMTK001',
    });
  }
  //    logger.info("Number of issued Coins:", query.length);
  //    logger.info("OUTPUT", query);

  const output = [];

  for (let i = 0; i < query.length; i += 1) {
    const object = {
      nftName: query[i].nftName,
      tokenAdmin: query[i].tokenAdmin,
      properties: query[i].properties,
      createdDate: query[i].createdDate,
    };

    const transaction = await Transactions.find({
      transactionId: query[i].transactionId,
      status: 'VALID',
    });

    if (transaction && transaction.length === 1) {
      output.push(object);
    }
  }

  return res.send(200, {
    status: true,
    message: 'Special Minted tokens have been successfully fetched',
    output,
  });
};
