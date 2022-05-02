const service = require('../../services/auth/apiKeyCheck');

module.exports = (req, res, next) => {
  service(req)
    .then(() => {
      //      logger.info("API key is valid");
      next();
    })
    .catch((error) =>
      res.send(error.code, { status: false, message: error.message }),
    );
};
