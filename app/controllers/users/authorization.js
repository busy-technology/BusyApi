const logger = require('@utils/logger');
const bcrypt = require('bcrypt');
const User = require('../../models/Users');

require('module-alias/register');

module.exports = async (req, res) => {
  const userId = Buffer.from(req.body.userId, 'utf8').toString('base64');
  const { password } = req.body;

  User.findOne({ userId })
    .then((user) => {
      const result = bcrypt.compareSync(password, user.password);
      if (result === false) {
        logger.info('Password is incorrect.');
        return res.send(400, {
          status: false,
          message: 'Password is incorrect',
        });
      }
      return res.send(200, {
        status: true,
        message: 'Authorization has been successful',
      });
    })
    .catch((error) => {
      //                logger.info("User data not found in users table.");
      if (error) {
        //                    logger.info("error", error);
        return res.send(404, {
          status: false,
          message: 'User does not exist',
          errorCode: 'USER001',
        });
      }
      return res.send(500, {
        status: false,
      });
    });
};
