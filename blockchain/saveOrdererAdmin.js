const logger = require('@utils/logger');
const { Wallets } = require('fabric-network');
const path = require('path');
const Admin = require('../app/models/admin');
const Encrypt = require('../app/helpers/encrypt');
const config = require('../config');

const adminUserId = 'busy_network';
require('module-alias/register');

exports.saveOrdererAdmin = async () => {
  try {
    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(
      process.cwd(),
      'blockchain',
      'network',
      'wallet',
    );
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the admin user.
    const identity = await wallet.get(adminUserId);
    const adminData = await Admin.findOne({ userId: adminUserId });
    if (identity && adminData == null) {
      const credential = {
        certificate: Encrypt(
          identity.credentials.certificate,
          config.ENCRYPTION_SECRET,
          config.ENCRYPTION_IV,
        ),
        privateKey: Encrypt(
          identity.credentials.privateKey,
          config.ENCRYPTION_SECRET,
          config.ENCRYPTION_IV,
        ),
      };

      const certificate = {
        credentials: credential,
        mspId: identity.mspId,
        type: identity.type,
        version: '1',
      };

      console.log(certificate);

      const admin = await new Admin({
        certificate,
        userId: adminUserId,
      });

      await admin
        .save()
        .then(() => {
          logger.info(' Orderer Admin registered.');
        })
        .catch((error) => {
          logger.info('ERROR DB', error);
        });
    } else {
      logger.info('Orderer Admin do not exists or already registered in DB.');
    }
    return 'Successfully Saved';
  } catch (exception) {
    return exception;
  }
};
