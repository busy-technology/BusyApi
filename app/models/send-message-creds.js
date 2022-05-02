const mongoose = require('mongoose');
const timeStamp = require('mongoose-timestamp');

const credentialSchema = mongoose.Schema({
  certificate: String,
  privateKey: String,
});

const certificateSchema = mongoose.Schema({
  credentials: {
    type: credentialSchema,
  },
  mspId: String,
  type: String,
  version: String,
});

const sendMessageCredsSchema = mongoose.Schema({
  certificate: certificateSchema,
  userId: String,
  clientType: String,
});

sendMessageCredsSchema.plugin(timeStamp);

const sendMessageCreds = mongoose.model(
  'sendMessageCreds',
  sendMessageCredsSchema,
);
module.exports = sendMessageCreds;
