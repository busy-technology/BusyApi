const mongoose = require('mongoose');

const PeerSchema = new mongoose.Schema({
  peerName: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
});

const PeerUser = mongoose.model('BusyUserPeers', PeerSchema);
module.exports = PeerUser;
