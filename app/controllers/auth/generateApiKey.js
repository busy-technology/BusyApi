const logger = require('@utils/logger');
const service = require('../../services/auth/generateApiKey');

require('module-alias/register');

module.exports = (req, res, next) => {
  service(req)
    .then((response) =>
      res.send(200, {
        status: true,
        message: 'Api key has been successfully generated',
        data: response,
      }),
    )
    .catch((error) => {
      logger.error('error logs');
      logger.error(error);

      return res.send(error.code, error);
    })
    .finally(() => next());
};
