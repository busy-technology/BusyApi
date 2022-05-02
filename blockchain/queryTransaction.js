const { DefaultEventHandlerStrategies } = require('fabric-network');
const { getGatewayInstance } = require('./fabricGateway');

require('module-alias/register');
// eslint-disable-next-line import/order
const logger = require('@utils/logger');

exports.QueryTransaction = async (
  channelName,
  contractName,
  functionName,
  ...args
) => {
  try {
    logger.info('Recieved a Query Transaction for ', functionName);
    // load the network configuration
    console.time('Got the gateway instance');
    const gateway = await getGatewayInstance(args[0], args[1], {
      strategy: DefaultEventHandlerStrategies.NONE,
    });
    console.timeEnd('Got the gateway instance');

    // Retreiving the required args from the function
    const evaluateArgs = [];
    for (let i = 2; i < args.length; i += 1) {
      evaluateArgs.push(args[i]);
    }

    logger.info('Evaluting the transaction on channel', channelName);
    // Get the network (channel) our contract is deployed to.
    // const network = await gateway.getNetwork('akcesschannel');

    let msg = 'Time take for  getnetwork ';
    console.time(msg);

    const network = await gateway.getNetwork(channelName);
    console.timeEnd(msg);

    // Get the contract from the network.
    // const contract = network.getContract('akcess');
    const contract = network.getContract(contractName);

    // Submit the specified transaction.

    msg = 'Time take for  evaluateTransaction ';
    console.time(msg);
    const result = await contract.evaluateTransaction(
      functionName,
      ...evaluateArgs,
    );

    console.timeEnd(msg);

    logger.info('Transaction has been submitted');

    // Disconnect from the gateway.
    // gateway.disconnect();
    return result.toString();
  } catch (exception) {
    if (exception.responses && exception.responses.length !== 0) {
      throw exception.responses[0].response;
    } else {
      throw exception;
    }
  }
};
