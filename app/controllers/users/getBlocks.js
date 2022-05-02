const blocks = require('../../models/blocks');

function isNumeric(str) {
  return str === '' || str === undefined || /^\d+$/.test(str);
}

module.exports = async (req, res) => {
  const { startBlock } = req.query;
  const { endBlock } = req.query;

  let query;

  if (!isNumeric(startBlock) || !isNumeric(endBlock)) {
    return res.send(400, {
      status: false,
      message: 'Invalid query Parameters',
      errorCode: 'QUER001',
    });
  }
  if (
    (startBlock === undefined || startBlock === '') &&
    (endBlock === undefined || endBlock === '')
  ) {
    query = await blocks.find({});
  } else if (endBlock === '' || endBlock === undefined) {
    query = await blocks.find({
      blockNum: {
        $gt: startBlock,
      },
    });
  } else if (startBlock === '' || startBlock === undefined) {
    query = await blocks.find({
      blockNum: {
        $lt: endBlock,
      },
    });
  } else {
    query = await blocks.find({
      blockNum: {
        $gt: startBlock,
        $lt: endBlock,
      },
    });
  }

  if (!query) {
    return res.send(500, {
      status: false,
      message: 'Error occured while fetching the blocks',
      errorCode: 'BLOC001',
    });
  }
  return res.send(200, {
    status: true,
    message: 'Blocks have been successfully fetched',
    data: query,
  });
};
