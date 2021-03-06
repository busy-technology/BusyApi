const Model = require('../../models/domain');

/**
 *
 * @param Object params
 *  {
 *      domainname: String,
 *      apikey: String
 *  }
 * @param Callback cb
 */

module.exports = (params) =>
  new Promise((resolve, reject) => {
    Model.findOne(
      {
        domainname: params.domainname,
        apikey: params.apikey,
      },
      (err, doc) => {
        if (err) return reject({ code: 502, message: err.message });

        if (!doc) return reject({ code: 404, message: 'Invalid Domain.' });

        return resolve(doc);
      },
    );
  });
