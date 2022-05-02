const logger = require('@utils/logger');
const { DefaultEventHandlerStrategies } = require('fabric-network');
const BlockDecoder = require('fabric-client/lib/BlockDecoder');
const { getGatewayInstance } = require('./fabricGateway');

require('module-alias/register');

exports.FabricGetBlocksTransaction = async (
  channelName,
  contractName,
  functionName,
  walletId,
  userKey,
  txId,
) => {
  try {
    logger.info(`Received Query Block for transaction ${txId}`);
    console.time('Got the gateway instance ');
    const gateway = await getGatewayInstance(walletId, userKey, {
      strategy: DefaultEventHandlerStrategies.NONE,
    });
    console.timeEnd('Got the gateway instance ');

    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    // const contract = network.getContract('akcess');
    const contract = network.getContract(contractName);

    const result = await contract.evaluateTransaction(
      functionName,
      channelName,
      txId,
    );
    const blockResponse = BlockDecoder.decode(result);

    const txcount = blockResponse.data.data.length;
    let transactionTimestamp;
    // retrieving the transaction timestamp
    for (let j = 0; j < txcount; j += 1) {
      const txid = blockResponse.data.data[j].payload.header.channel_header;
      if (txid.tx_id === txId) {
        transactionTimestamp =
          blockResponse.data.data[j].payload.header.channel_header.timestamp;
      }
    }
    const response = {
      blockNum: blockResponse.header.number,
      dataHash: blockResponse.header.data_hash,
      timestamp: transactionTimestamp,
    };
    logger.info('block response', response);

    await gateway.disconnect();
    return response;
  } catch (exception) {
    // logger.error(exception.errors);
    return exception;
  }
};
