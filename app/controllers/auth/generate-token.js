const service = require('../../services/auth/generate-token');

module.exports = (req, res, next) => {
  service(req)
    .then((response) =>
      res.send(200, {
        status: true,
        message: 'Authentication token has been successfully generated',
        data: response,
      }),
    )
    .catch((error) =>
      res.send(error.code, { status: false, message: error.message }),
    )
    .finally(() => next());
};
