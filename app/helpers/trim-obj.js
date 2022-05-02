const trimReq = (params) => {
  // chek if params is not empy/undefined
  if (params !== null && typeof params === 'object') {
    Object.keys(params).forEach((key) => {
      // check if property is object in itself
      if (typeof params[key] === 'object') return trimReq(params[key]);

      // elseif value is string
      if (typeof params[key] === 'string') params[key] = params[key].trim();

      return {};
    });
  }
};

module.exports = trimReq;
