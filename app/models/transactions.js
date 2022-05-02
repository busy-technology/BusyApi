const mongoose = require('mongoose');

const { Schema } = mongoose;

const TransactionSchema = new Schema({
  transactionType: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
  },
  blockNum: {
    type: Number,
  },
  dataHash: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  payload: {
    type: Object,
    required: true,
  },
  submitTime: {
    type: Date,
    required: true,
  },
  updateTime: {
    type: Date,
  },
  transactionFee: {
    type: String,
  },
});

TransactionSchema.index({ transactionId: 1, status: 1 });
TransactionSchema.index({ transactionType: 1 });
TransactionSchema.index({ blockNum: 1, transactionFee: 1 });

module.exports = mongoose.model('transactions', TransactionSchema);
