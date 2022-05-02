const isNumerator = (value) => {
  if (/^0.*$/.test(value)) {
    return false;
  }
  return /^[0-9]+$/.test(value);
};

const isDenominator = (value) => {
  if (/^0.*$/.test(value)) {
    return false;
  }
  return /^[0-9]+$/.test(value);
};

const fraction = (num, denom) => {
  const numerator = parseInt(num, 10);
  const denominator = parseInt(denom, 10);
  if (numerator / denominator > 1) {
    return false;
  }
  return true;
};

module.exports = (fields) => (req, res, next) => {
  let params = req.body;

  if (req.method === 'GET') params = req.params;
  const errors = fields.filter((field) => {
    if (field === fields[0]) {
      if (params[field] && !isNumerator(params[field].trim())) return field;
    }
    if (field === fields[1]) {
      if (params[field] && !isDenominator(params[field].trim())) return field;
    }
    return null;
  });

  if (errors.length) {
    return res.send(422, {
      status: false,
      message: `The ${errors.join(', ')} is not valid`,
    });
  }

  if (!fraction(params[fields[0]].trim(), params[fields[1]].trim())) {
    return res.send(422, {
      status: false,
      message: 'The vesting fraction is not valid',
    });
  }

  return next();
};
