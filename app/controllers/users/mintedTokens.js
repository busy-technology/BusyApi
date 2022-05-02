const NftTokens = require('../../models/nft-token');
const Transactions = require('../../models/transactions');
const User = require('../../models/Users');

module.exports = async (req, res) => {
  let query;
  if (req.query.walletId === '' || req.query.walletId == null) {
    query = await NftTokens.find({});
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
    query = await NftTokens.find({
      tokenAdmin: req.query.walletId,
    });
  }
  if (!query) {
    return res.send(500, {
      status: false,
      message: 'Error fetching issued Tokens',
      errorCode: 'MTOK001',
    });
  }
  //    logger.info("Number of issued Coins:", query.length);
  //    logger.info("OUTPUT", query);

  const output = [];

  for (let i = 0; i < query.length; i += 1) {
    const object = {
      tokenSymbol: query[i].tokenSymbol,
      tokenAdmin: query[i].tokenAdmin,
      totalSupply: query[i].totalSupply,
      properties: query[i].properties,
      createdDate: query[i].createdDate,
      tokenAddress: query[i].tokenAddress,
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
    message: 'Minted tokens have been successfully fetched',
    output,
  });
};
