const mongoose = require('mongoose');
const timeStamp = require('mongoose-timestamp');

const apiKeySchema = new mongoose.Schema({
  accessgroup: {
    type: String,
    required: true,
  },
  apikey: {
    type: String,
    required: true,
    unique: true,
  },
  usernickname: {
    type: String,
    required: true,
  },
});

apiKeySchema.plugin(timeStamp);

module.exports = mongoose.model('ApiKeys', apiKeySchema);
