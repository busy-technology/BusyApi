const logger = require('@utils/logger');
const service = require('../../services/auth/revokeApiKey');

require('module-alias/register');

module.exports = (req, res, next) => {
  service(req)
    .then((response) =>
      res.send(200, {
        status: true,
        message: 'Api key has been successfully revoked',
        data: response,
      }),
    )
    .catch((error) => {
      logger.error(error);
      return res.send(error.code, { status: false, message: error.message });
    })
    .finally(() => next());
};
