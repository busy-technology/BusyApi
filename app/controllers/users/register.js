const bcrypt = require('bcrypt');
const bs58 = require('bs58');
const bip39 = require('bip39');
const User = require('../../models/Users');
const PeerUser = require('../../models/peerUser');
const registerUser = require('../../../blockchain/registerUser');
const Transactions = require('../../models/transactions');

const saltRounds = 10;
const submitTransaction = require('../../../blockchain/submitTransaction');
const constants = require('../../../constants');

module.exports = async (req, res) => {
  try {
    const { userId } = req.body;
    const firstName = req.body.firstName || '';
    const lastName = req.body.lastName || '';
    const email = req.body.email || '';
    const mobile = req.body.mobile || '';
    const { password } = req.body;
    const country = req.body.country || '';
    const { confirmPassword } = req.body;
    const type = req.body.type || '';

    const user = await User.findOne({
      userId,
    });

    const peeruser = await PeerUser.findOne({
      userId,
    });

    //        logger.info("User", user);
    if (user || peeruser) {
      //            logger.info("UserId already taken.");
      return res.send(409, {
        status: false,
        message: 'Nickname is already taken',
        errorCode: 'ACC001',
      });
    }
    if (password !== confirmPassword) {
      //            logger.info("Passwords do not match.");
      return res.send(412, {
        status: false,
        message: 'Passwords do not match',
        errorCode: 'ACC004',
      });
    }
    const mnemonic = bip39.generateMnemonic();
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);
    const registeruser = await registerUser(
      {
        userId,
      },
      mnemonic,
    );
    if (registeruser) {
      const response = await submitTransaction.SubmitTransaction(
        constants.BUSY_CHANNEL_NAME,
        constants.DEFAULT_CONTRACT_NAME,
        'CreateUser',
        userId,
        registeruser,
      );
      const resp = JSON.parse(response);

      const bytes = Buffer.from(registeruser.credentials.privateKey, 'utf-8');

      const encodedPrivateKey = bs58.encode(bytes);

      if (resp.success === true) {
        const users = await new User({
          firstName,
          lastName,
          email,
          mobile,
          userId,
          type,
          walletId: resp.data,
          password: hash,
          country,
          txId: resp.txId,
          tokens: {
            BUSY: {
              balance: 0,
              createdAt: new Date(),
              type: 'busy',
            },
          },
          messageCoins: {
            totalCoins: 0,
          },
        });

        await users.save();

        const transactionEntry = await new Transactions({
          transactionType: 'createWallet',
          transactionId: resp.txId,
          ipAddress: req.socket.remoteAddress,
          submitTime: new Date(),
          payload: {
            address: resp.data,
          },
          transactionFee: 0,
          status: 'submitted',
        });

        await transactionEntry.save();

        registeruser.credentials.privateKey = encodedPrivateKey;

        return res.send(200, {
          status: true,
          message: 'User has been successfully registered',
          userId,
          seedPhrase: mnemonic,
          privateKey: registeruser,
          chaincodeResponse: resp,
        });
      }
      //                    logger.info("Failed to execute chaincode function");
      return res.send(500, {
        status: false,
        message: 'Failed to execute chaincode function',
        errorCode: 'CHN001',
      });
    }
    //                logger.info("Failed to enroll the user");
    return res.send(500, {
      status: false,
      message: 'Failed to enroll the user',
      errorCode: 'ACC005',
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
