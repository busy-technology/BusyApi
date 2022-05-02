const Ajv = require('ajv');
const SchemaMap = require('./schemaMap');

module.exports = (data, route) => {
  const schema = require(`../schemas/${SchemaMap[route]}.json`); // eslint-disable-line import/no-dynamic-require

  const ajv = new Ajv();
  ajv.addSchema(require('../schemas/Credentials.json'), 'Credentials.json');

  const validate = ajv.compile(schema);

  return (req, res, next) => {
    const validation = validate(req[data]);

    if (!validation) {
      return res.send(400, {
        status: validation,
        message: 'error in parameters',
        data: validate.errors,
      });
    }
    return next();
  };
};
