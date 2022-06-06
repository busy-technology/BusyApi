const Transactions = require('../../models/transactions');
const User = require('../../models/Users');

function isNumeric(str) {
  return str === '' || str === undefined || /^\d+$/.test(str);
}

module.exports = async (req, res) => {
  const { startBlock } = req.query;
  const { endBlock } = req.query;

  if (!isNumeric(startBlock) || !isNumeric(endBlock)) {
    return res.send(400, {
      status: false,
      message: 'Invalid query Parameters',
      errorCode: 'QUER001',
    });
  }

  let query;
  if (req.query.walletId === '' || req.query.walletId === undefined) {
    if (
      (startBlock === '' || startBlock === undefined) &&
      (endBlock === undefined || endBlock === '')
    ) {
      query = await Transactions.find({
        $or: [
          {
            transactionFee: {
              $ne: null,
              $exists: true,
            },
          },
          {
            status: {
              $ne: 'VALID',
            },
          },
        ],
      });
    } else if (endBlock === '' || endBlock === undefined) {
      query = await Transactions.find({
        blockNum: {
          $gt: startBlock,
        },
        $or: [
          {
            transactionFee: {
              $ne: null,
              $exists: true,
            },
          },
          {
            status: {
              $ne: 'VALID',
            },
          },
        ],
      });
    } else if (startBlock === '' || startBlock === undefined) {
      query = await Transactions.find({
        blockNum: {
          $lt: endBlock,
        },
        $or: [
          {
            transactionFee: {
              $ne: null,
              $exists: true,
            },
          },
          {
            status: {
              $ne: 'VALID',
            },
          },
        ],
      });
    } else {
      query = await Transactions.find({
        blockNum: { $lt: endBlock, $gt: startBlock },
        $or: [
          {
            transactionFee: {
              $ne: null,
              $exists: true,
            },
          },
          {
            status: {
              $ne: 'VALID',
            },
          },
        ],
      });
    }
  } else {
    // checking if user Exists
    const user = await User.findOne({
      walletId: req.query.walletId,
    });

    if (!user) {
      return res.send(404, {
        status: false,
        message: `Wallet Id ${req.query.walletId} does not exist`,
        errorCode: 'TRAN001',
      });
    }

    if (
      (startBlock === '' || startBlock === undefined) &&
      (endBlock === undefined || endBlock === '')
    ) {
      query = await Transactions.find({
        $and: [
          {
            $or: [
              {
                transactionFee: {
                  $ne: null,
                  $exists: true,
                },
              },
              {
                status: {
                  $ne: 'VALID',
                },
              },
            ],
          },
          {
            $or: [
              { 'payload.address': req.query.walletId },
              { 'payload.recipient': req.query.walletId },
            ],
          },
        ],
      });
    } else if (startBlock === '' || startBlock === undefined) {
      query = await Transactions.find({
        $and: [
          { blockNum: { $lt: endBlock } },
          {
            $or: [
              {
                transactionFee: {
                  $ne: null,
                  $exists: true,
                },
              },
              {
                status: {
                  $ne: 'VALID',
                },
              },
            ],
          },
          {
            $or: [
              { 'payload.address': req.query.walletId },
              { 'payload.recipient': req.query.walletId },
            ],
          },
        ],
      });
    } else if (endBlock === '' || endBlock === undefined) {
      query = await Transactions.find({
        $and: [
          { blockNum: { $gt: startBlock } },
          {
            $or: [
              {
                transactionFee: {
                  $ne: null,
                  $exists: true,
                },
              },
              {
                status: {
                  $ne: 'VALID',
                },
              },
            ],
          },
          {
            $or: [
              { 'payload.address': req.query.walletId },
              { 'payload.recipient': req.query.walletId },
            ],
          },
        ],
      });
    } else {
      query = await Transactions.find({
        $and: [
          { blockNum: { $lt: endBlock, $gt: startBlock } },
          {
            $or: [
              {
                transactionFee: {
                  $ne: null,
                  $exists: true,
                },
              },
              {
                status: {
                  $ne: 'VALID',
                },
              },
            ],
          },
          {
            $or: [
              { 'payload.address': req.query.walletId },
              { 'payload.recipient': req.query.walletId },
            ],
          },
        ],
      });
    }
  }

  if (!query) {
    return res.send(500, {
      status: false,
      message: 'Error occured while fetching the transactions',
      errorCode: 'TRAN002',
    });
  }
  return res.send(200, {
    status: true,
    message: 'Transactions have been successfully fetched',
    data: query,
  });
};