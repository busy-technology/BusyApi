const bcrypt = require('bcrypt');
const bs58 = require('bs58');
const PeerUser = require('../../models/peerUser');
const User = require('../../models/Users');
const registerUser = require('../../../blockchain/registerUser');

const saltRounds = 10;

module.exports = async (req, res) => {
  try {
    const { peerName } = req.body;
    const { password } = req.body;
    const { confirmPassword } = req.body;

    const peeruser = await PeerUser.findOne({
      peerName,
    });

    const user = await User.findOne({
      userId: peerName,
    });
    //        logger.info("User", user);
    if (user || peeruser) {
      //            logger.info("PeerId already taken.");
      return res.send(409, {
        status: false,
        message: 'Peer name is already taken',
        errorCode: 'PEER001',
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
    const salt = await bcrypt.genSaltSync(saltRounds);
    const hash = await bcrypt.hashSync(password, salt);
    const registeruser = await registerUser({
      userId: peerName,
    });
    if (registeruser) {
      //                logger.info(registeruser);

      const bytes = Buffer.from(registeruser.credentials.privateKey, 'utf-8');

      const encodedPrivateKey = bs58.encode(bytes);

      const users = await new PeerUser({
        peerName,
        password: hash,
      });

      await users.save();

      registeruser.credentials.privateKey = encodedPrivateKey;

      return res.send(200, {
        status: true,
        message: 'Peer has been successfully registered',
        privateKey: registeruser,
      });
    }
    //                logger.info("Failed to execute chaincode function");
    return res.send(500, {
      status: false,
      message: 'Failed to register the peer',
      errorCode: 'PEER002',
    });
  } catch (exception) {
    //        logger.info(exception);
    return res.send(500, {
      status: false,
      message: exception.message,
      errorCode: 'PEER003',
    });
  }
};
