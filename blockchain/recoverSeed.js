const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

// bip129 algorith
const bip39 = require('bip39');

require('module-alias/register');
const logger = require('@utils/logger');

module.exports = async (userData, key) => {
  try {
    logger.info('In recover from private Key');
    // load the network configuration
    const ccpPath = path.resolve(
      __dirname,
      'connection-profile',
      'connection-busy.json',
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const caInfo = ccp.certificateAuthorities['ca.busy.technology'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName,
    );

    // Create a new file system based wallet for managing identities.
    // const walletPath = path.join(process.cwd(), "..", "network", "wallet");
    const walletPath = path.join(
      process.cwd(),
      'blockchain',
      'network',
      'wallet',
    );
    // const walletPath = path.resolve(__dirname, '..', '..', 'network', 'wallet')
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    // const wallet = await new FileSystemWallet(walletPath);
    logger.info(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the admin user.
    const adminExists = await wallet.get('admin');
    if (!adminExists) {
      logger.info(
        'An identity for the admin user "admin" does not exist in the wallet',
      );
      logger.info('Run the enrollAdmin.js application before retrying');
      return 'Run the enrollAdmin.js application before retrying';
    }

    // build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminExists.type);
    const adminUser = await provider.getUserContext(adminExists, 'admin');

    const secret = bip39.mnemonicToSeedSync(key).toString('hex');

    const identity = ca.newIdentityService();
    const update = await identity.update(
      userData.userId,
      {
        enrollmentSecret: secret,
      },
      adminUser,
    );

    logger.info(`Successfully registered and enrolled user ${update}.`);
    return update;
  } catch (exception) {
    // logger.error(exception.errors);
    // logger.info("EXCEPTIONS", expection.errors);
    return exception;
  }
};
