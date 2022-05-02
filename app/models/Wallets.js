const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
  },
  walletId: {
    type: String,
    required: true,
    trim: true,
  },
  stakingWalletId: {
    type: String,
    required: true,
    trim: true,
  },
  txId: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    required: true,
  },
  totalReward: {
    type: String,
    required: true,
  },
  stakedCoins: {
    type: String,
    required: true,
  },
  initialStakingLimit: {
    type: String,
    required: true,
  },
  unstaked: {
    type: Boolean,
    required: true,
  },
  claimed: {
    type: String,
    required: true,
  },
});

WalletSchema.index({ walletId: 1, unstaked: 1 });
const Wallets = mongoose.model('StakingAddress', WalletSchema);
module.exports = Wallets;
