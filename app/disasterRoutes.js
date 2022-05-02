const controller = require('./controllers');
const middleware = require('./middlewares');

/**
 * List of routes
 * @param RestifyServer server
 */

module.exports = (server) => {
  server.post(
    '/generateToken',
    middleware.auth.generateToken,
    controller.auth.disaterToken,
  );

  server.post(
    '/transfer',
    middleware.utility.required([
      'sender',
      'credentials',
      'recipiant',
      'amount',
      'token',
    ]),
    middleware.utility.isAmount(['amount']),
    controller.disaster.transfer,
  );

  server.post('/stakingAddresses', controller.disaster.stakingAddress);

  server.post(
    '/nft/transfer',
    middleware.utility.required([
      'account',
      'operator',
      'tokenSymbol',
      'amount',
      'recipient',
      'credentials',
    ]),
    middleware.utility.isNumeric(['amount']),
    controller.disaster.nftTransfer,
  );

  server.post(
    '/nft/transferBatch',
    middleware.utility.required([
      'account',
      'operator',
      'tokenSymbols',
      'amounts',
      'recipient',
      'credentials',
    ]),
    middleware.utility.isArray(['tokenSymbols', 'amounts']),
    controller.disaster.nftTransferBatch,
    middleware.utility.isAmounts(['amounts']),
  );

  server.post(
    '/busynft/transfer',
    middleware.utility.required([
      'sender',
      'nftName',
      'recipient',
      'credentials',
    ]),
    controller.disaster.specialNftTransfer,
  );
};
