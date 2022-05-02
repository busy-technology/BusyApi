module.exports = {
  utility: {
    required: require('./utility/required'),
    isNumeratorDenominator: require('./utility/numerator-denominator'),
  },
  auth: {
    generateToken: require('./auth/generate-token'),
  },
};
