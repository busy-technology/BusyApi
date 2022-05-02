const Wallet = require('../../models/Wallets');
const Transactions = require('../../models/transactions');

module.exports = async (req, res) => {
  const query = await Wallet.find({
    unstaked: {
      $ne: true,
    },
  });
  if (!query) {
    return res.send(500, {
      status: false,
      message: 'error fetching the transactions',
      errorCode: 'STA001',
    });
  }
  const output = [];

  const stakingTransactions = await Transactions.find({
    transactionType: 'createstakingaddress',
  });

  // creating an Object for better querying;
  const stakingObject = {};
  for (let i = 0; i < stakingTransactions.length; i += 1) {
    const stakingWalletId = stakingTransactions[i].payload.recipient;
    stakingObject[stakingWalletId] = stakingTransactions[i];
  }

  for (let i = 0; i < query.length; i += 1) {
    let stakingStatus;
    if (query[i].stakingWalletId in stakingObject) {
      stakingStatus = stakingObject[query[i].stakingWalletId].status;
    }

    if (stakingStatus === 'VALID') {
      const object = {
        walletId: query[i].stakingWalletId,
        createdDate: query[i].createdDate,
        createdFrom: query[i].walletId,
      };
      output.push(object);
    }
  }

  return res.send(200, {
    status: true,
    message: 'Staking addresses have been successfully fetched',
    output,
  });
};
