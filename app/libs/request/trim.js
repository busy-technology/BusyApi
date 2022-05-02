const trimReq = require('../../helpers/trim-obj');

module.exports = (req, res, next) => {
  // check for params in body
  if (req.body) trimReq(req.body);

  // check for params in route-url-param
  if (req.params) trimReq(req.params);

  // check for params in query-param
  if (req.query) trimReq(req.query);

  return next();
};
