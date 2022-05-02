const mongoose = require('mongoose');

const { Schema } = mongoose;

const busyTokenSchema = new Schema({
  tokenSymbol: {
    type: String,
    required: true,
  },
  tokenAdmin: {
    type: String,
    required: true,
  },
  totalSupply: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model('busySupply', busyTokenSchema);
