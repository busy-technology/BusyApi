const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const TTL = 3600; // time to live in seconds currently 1 hrs
const CONNECTION_POOL_SIZE = 100;

let gatewayCache = {};

require('module-alias/register');
const logger = require('@utils/logger');

const getGatewayInstance = async (
  walletId,
  blockchainCredentials,
  eventOptions,
) => {
  let gatewayObj = gatewayCache[walletId];

  const currentMS = new Date().getTime();

  // Create a new file system based wallet for managing identities.
  const walletPath = path.join(
    process.cwd(),
    'blockchain',
    'network',
    'wallet',
  );
  // const walletPath = path.resolve(__dirname, '..', '..', 'network', 'wallet')
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  // fetching the wallets

  const identity = await wallet.get(walletId);

  // Put the creds in the filesystem if it does not exists
  if (!identity) {
    await wallet.put(walletId, blockchainCredentials);
  } else if (
    identity.credentials.certificate !==
      blockchainCredentials.credentials.certificate ||
    identity.credentials.privateKey !==
      blockchainCredentials.credentials.privateKey
  ) {
    gatewayObj = undefined;
  }

  if (
    gatewayObj === undefined ||
    (currentMS - gatewayObj.connectionTime) / 1000 > TTL
  ) {
    const ccpPath = path.resolve(
      __dirname,
      'connection-profile',
      'connection-busy.json',
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    await wallet.put(walletId, blockchainCredentials);

    // Create a new gateway for connecting to our peer node.
    console.time('Initialized gateway object');
    const gatewaySocket = new Gateway();

    console.timeEnd('Initialized gateway object');

    console.time('for gateway connect');
    // Create a new gateway for connecting to our peer node.

    await gatewaySocket.connect(ccp, {
      wallet,
      identity: walletId,
      eventHandlerOptions: eventOptions,
      discovery: {
        enabled: true,
        asLocalhost: false,
      },
    });

    gatewayObj = { gateway: gatewaySocket, connectionTime: currentMS };

    if (Object.keys(gatewayCache).length >= CONNECTION_POOL_SIZE) {
      gatewayCache = {};
    } // Cache refresh at 100 size
    // To do add a better garbage collection strategy
    try {
      gatewayCache[walletId] = gatewayObj;
    } catch (e) {
      logger.error(e);
    }
  }

  return gatewayObj.gateway;

  // load the network configuration
};

module.exports = {
  getGatewayInstance,
};
