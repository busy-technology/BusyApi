const mongoose = require('mongoose');

const { Schema } = mongoose;

const issuedTokensSchema = new Schema({
  tokenName: {
    type: String,
    required: true,
  },
  tokenSymbol: {
    type: String,
    required: true,
  },
  tokenDecimals: {
    type: Number,
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
  },
  tokenAdmin: {
    type: String,
    required: true,
  },
  tokenAddress: {
    type: String,
    required: true,
  },
  metaData: {
    type: Object,
    required: true,
  },
  tokenId: {
    type: String,
    required: true,
  },
  tokenSupply: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    required: true,
  },
});

issuedTokensSchema.index({ tokenAdmin: 1 });
module.exports = mongoose.model('issuedTokens', issuedTokensSchema);
