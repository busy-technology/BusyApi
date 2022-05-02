const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const { Wallets } = require('fabric-network');

const bip39 = require('bip39');

const SendMessageCreds = require('../app/models/send-message-creds');
const Encrypt = require('../app/helpers/encrypt');
const config = require('../config');

module.exports = async (userId, mnemonic) => {
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

  const walletPath = path.join(
    process.cwd(),
    'blockchain',
    'network',
    'wallet',
  );
  // const walletPath = path.resolve(__dirname, '..', '..', 'network', 'wallet')
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const secret = bip39.mnemonicToSeedSync(mnemonic).toString('hex');
  const adminExists = await wallet.get('admin');
  if (!adminExists) {
    console.log(
      'An identity for the admin user "admin" does not exist in the wallet',
    );
    console.log('Run the enrollAdmin.js application before retrying');
    return 'Run the enrollAdmin.js application before retrying';
  }

  // build a user object for authenticating with the CA
  const provider = wallet.getProviderRegistry().getProvider(adminExists.type);
  const adminUser = await provider.getUserContext(adminExists, 'admin');

  await ca.register(
    {
      enrollmentID: `M-${userId}`,
      enrollmentSecret: secret,
      role: 'client',
      attrs: [{ name: 'messageCreds', value: 'true', ecert: true }],
      maxEnrollments: -1,
    },
    adminUser,
  );

  const credentialList = [];

  for (let i = 0; i < 5; i += 1) {
    const sendMessageEnrollment = await ca.enroll(
      {
        enrollmentID: `M-${userId}`,
        enrollmentSecret: secret,
        attr_reqs: [{ name: 'messageCreds', optional: false }],
      },
      adminUser,
    );

    const x509IdentitySendMessage = {
      credentials: {
        certificate: Encrypt(
          sendMessageEnrollment.certificate,
          config.ENCRYPTION_SECRET,
          config.ENCRYPTION_IV,
        ),
        privateKey: Encrypt(
          sendMessageEnrollment.key.toBytes(),
          config.ENCRYPTION_SECRET,
          config.ENCRYPTION_IV,
        ),
      },
      mspId: 'BusyMSP',
      type: 'X.509',
    };

    console.log(`Successfully enrolled ${i} message creds for user ${userId}.`);

    const certificate = {
      credentials: x509IdentitySendMessage.credentials,
      mspId: x509IdentitySendMessage.mspId,
      type: x509IdentitySendMessage.type,
      version: '1',
    };

    const sendMessageCreds = await new SendMessageCreds({
      certificate,
      userId,
    });

    await sendMessageCreds
      .save()
      .then(() => {
        console.log('Message creds Saved.');
      })
      .catch((error) => {
        console.log('ERROR DB', error);
      });

    credentialList.push(x509IdentitySendMessage);
  }

  return credentialList[0];
};
