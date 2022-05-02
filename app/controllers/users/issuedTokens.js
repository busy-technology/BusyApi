const IssuetokenTransactions = require('../../models/issued-tokens');
const Transactions = require('../../models/transactions');
const User = require('../../models/Users');

module.exports = async (req, res) => {
  let query;
  if (req.query.walletId === '' || req.query.walletId == null) {
    query = await IssuetokenTransactions.find({});
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
    query = await IssuetokenTransactions.find({
      tokenAdmin: req.query.walletId,
    });
  }
  if (!query) {
    return res.send(500, {
      status: false,
      message: 'Error fetching issued Tokens',
      errorCode: 'ITOK001',
    });
  }
  //    logger.info("Number of issued Coins:", query.length);
  //    logger.info("OUTPUT", query);

  const output = [];

  for (let i = 0; i < query.length; i += 1) {
    const object = {
      tokenName: query[i].tokenName,
      tokenAdmin: query[i].tokenAdmin,
      tokenDecimals: query[i].tokenDecimals,
      tokenSymbol: query[i].tokenSymbol,
      tokenId: query[i].tokenId,
      tokenSupply: query[i].tokenSupply,
      logoPath: query[i].logoPath,
      websiteUrl: query[i].websiteUrl,
      socialMedia: query[i].socialMedia,
      createdDate: query[i].createdDate,
      metaData: query[i].metaData,
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
    message: 'Issued tokens have been successfully fetched',
    output,
  });
};
