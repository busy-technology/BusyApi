const IssuetokenTransactions = require('../../models/issued-tokens');
const nftTokens = require('../../models/nft-token');
const BusySupply = require('../../models/busy-supply');

module.exports = async (req, res) => {
  try {
    const { symbol } = req.body;
    const { tokenType } = req.body;

    if (!['BUSY', 'BUSY20', 'NFT', 'GAME'].includes(tokenType)) {
      return res.send(412, {
        status: false,
        message: `tokenType ${tokenType} is not supported`,
        errorCode: 'TSUP001',
      });
    }

    if (tokenType === 'BUSY') {
      const resp = await BusySupply.findOne({
        tokenSymbol: symbol,
      });

      if (!resp || resp.length === 0) {
        return res.send(404, {
          status: false,
          message: `token ${symbol} does not exist`,
          errorCode: 'TSUP002',
        });
      }
      return res.send(200, {
        status: true,
        message: 'total Supply successfully fetched',
        data: resp.totalSupply,
      });
    }
    if (tokenType === 'BUSY20') {
      const resp = await IssuetokenTransactions.findOne({
        tokenSymbol: symbol,
      });

      if (!resp || resp.length === 0) {
        return res.send(404, {
          status: false,
          message: `token ${symbol} does not exist`,
          errorCode: 'TSUP002',
        });
      }
      return res.send(200, {
        status: true,
        message: 'total Supply successfully fetched',
        data: resp.tokenSupply,
      });
    }
    const resp = await nftTokens.findOne({
      tokenSymbol: symbol,
    });

    if (!resp || resp.length === 0) {
      return res.send(404, {
        status: false,
        message: `nft token ${symbol} does not exist`,
        errorCode: 'TSUP003',
      });
    }
    return res.send(200, {
      status: true,
      message: 'total Supply successfully fetched',
      data: resp.totalSupply,
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
