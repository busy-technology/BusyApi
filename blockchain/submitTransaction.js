const logger = require('@utils/logger');
const { DefaultEventHandlerStrategies } = require('fabric-network');

const { getGatewayInstance } = require('./fabricGateway');

require('module-alias/register');

exports.SubmitTransaction = async (
  channelName,
  contractName,
  functionName,
  ...args
) => {
  try {
    logger.info('Recieved a Submit Transaction for ', functionName);

    // load the network configuration
    console.time('Got the gateway instance ');
    const gateway = await getGatewayInstance(args[0], args[1], {
      strategy: DefaultEventHandlerStrategies.NONE,
    });
    console.timeEnd('Got the gateway instance ');

    // Get the network (channel) our contract is deployed to.
    // const network = await gateway.getNetwork('akcesschannel');
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    // const contract = network.getContract('akcess');
    const contract = network.getContract(contractName);

    logger.info('Submitting the transaction on channel', channelName);

    // Retreiving the required args from the function
    const submitArgs = [];
    for (let i = 2; i < args.length; i += 1) {
      submitArgs.push(args[i]);
    }

    logger.info('submit args', submitArgs);
    // Submit the specified transaction.
    const result = await contract.submitTransaction(
      functionName,
      ...submitArgs,
    );
    logger.info('Transaction has been submitted');

    // Disconnect from the gateway.
    //  gateway.disconnect();
    return result.toString();
  } catch (exception) {
    if (exception.responses && exception.responses.length !== 0) {
      throw exception.responses[0].response;
    } else {
      throw exception;
    }
  }
};
