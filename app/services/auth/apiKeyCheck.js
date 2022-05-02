const repository = require('../../repositories/domain/find-domain-by-name-and-key');
const getDomainType = require('../../helpers/get-domain-type');

module.exports = async (req) => {
  try {
    const doc = await repository({
      domainname: getDomainType(req.headers.apitype),
      apikey: req.headers.apikey,
    });

    if (doc.matchCount === 1) {
      return Promise.resolve({
        search: 'Match found',
      });
    }
    return Promise.reject({
      error: 'Match not found',
    });
  } catch (err) {
    return Promise.reject(err);
  }
};
