const trimReq = require('./libs/request/trim');
const controller = require('./controllers');
const middleware = require('./middlewares');
const auth = require('./middlewares/auth');
const validator = require('./middlewares/validator');
/**
 * List of routes
 * @param RestifyServer server
 */

module.exports = (server) => {
  // trim request parameter
  server.use(trimReq);
  server.post(
    '/generateToken',
    middleware.auth.generateToken,
    controller.auth.generateToken,
  );
  server.post(
    '/generateApiKey',
    validator('body', 'generateApiKey'),
    auth,
    controller.auth.generateApiKey,
  );
  server.post(
    '/revokeApiKey',
    validator('body', 'revokeApiKey'),
    auth,
    controller.auth.revokeApiKey,
  );
  /**
   * @description User registration
   * @date july-06-2021
   * @author Raj
   */

  server.post(
    '/register',
    auth,
    validator('body', 'register'),
    controller.users.register,
  );

  server.post(
    '/registerPeer',
    auth,
    validator('body', 'registerPeer'),
    controller.users.registerPeer,
  );
  server.post(
    '/authorization',
    auth,
    validator('body', 'authorization'),
    controller.users.authorization,
  );
  server.post(
    '/createStakingAddress',
    auth,
    validator('body', 'createStakingAddress'),
    controller.users.wallet,
  );
  server.post(
    '/attemptUnlock',
    auth,
    validator('body', 'attemptUnlock'),
    controller.users.attemptUnlock,
  );
  server.post('/swap', auth, validator('body', 'swap'), controller.users.swap);
  server.post(
    '/transfer',
    auth,
    validator('body', 'transfer'),
    controller.users.transfer,
  );
  server.get('/getBlocks', auth, controller.users.getBlocks);

  server.get('/getBusyAddress', auth, controller.users.getBusyAddress);

  server.post(
    '/claim',
    auth,
    validator('body', 'claim'),
    controller.users.claim,
  );

  server.post(
    '/claimAll',
    auth,
    validator('body', 'claimAll'),
    controller.users.claimAll,
  );

  server.post(
    '/unstake',
    auth,
    validator('body', 'unstake'),
    controller.users.unstake,
  );
  server.post(
    '/issue',
    auth,
    validator('body', 'issue'),
    controller.users.issue,
  );
  server.post(
    '/getTotalSupply',
    auth,
    validator('body', 'getTotalSupply'),
    controller.users.totalSupply,
  );
  server.post(
    '/updateTransferFees',
    auth,
    validator('body', 'updateTransferFees'),
    controller.users.transferFee,
  );
  server.post('/burn', auth, validator('body', 'burn'), controller.users.burn);

  server.post(
    '/burnToken',
    auth,
    validator('body', 'burnToken'),
    controller.users.burnTokens,
  );
  server.post(
    '/vestingV1',
    auth,
    validator('body', 'vestingV1'),
    middleware.utility.isNumeratorDenominator(['numerator', 'denominator']),
    controller.users.vesting1,
  );
  server.post(
    '/vestingV2',
    auth,
    validator('body', 'vestingV2'),
    controller.users.vesting2,
  );
  server.post(
    '/lockedVestingInfo',
    auth,
    validator('body', 'lockedVestingInfo'),
    controller.users.lockedVestingInfo,
  );

  server.get('/stakingAddresses', auth, controller.users.fetchWallets);
  server.get('/defaultWallets', auth, controller.users.defaultWallets);

  // endpoint for querying wallet
  server.post(
    '/queryWallet',
    auth,
    validator('body', 'queryWallet'),
    controller.users.queryWallet,
  );

  server.get('/issuedTokens', auth, controller.users.issuedTokens);
  server.get('/currentPhase', auth, controller.users.getCurrentPhase);
  server.get('/transactionFees', auth, controller.users.getCurrentFee);
  server.get('/transactions', auth, controller.users.transactions);
  server.post(
    '/stakingInfo',
    auth,
    validator('body', 'stakingInfo'),
    controller.users.stakingInfo,
  );
  server.post(
    '/recoverUser',
    auth,
    validator('body', 'recoverUser'),
    controller.users.recoverUser,
  );

  server.post(
    '/recoverSeed',
    auth,
    validator('body', 'recoverSeed'),
    controller.users.recoverSeed,
  );

  server.post(
    '/resetPassword',
    auth,
    validator('body', 'resetPassword'),
    controller.users.resetPassword,
  );

  server.post(
    '/userWallets',
    auth,
    validator('body', 'userWallets'),
    controller.users.userWallets,
  );

  server.post(
    '/generateMessageCreds',
    auth,
    validator('body', 'generateMessageCreds'),
    controller.users.generateMessageCreds,
  );
  server.post(
    '/sendMessage',
    auth,
    validator('body', 'sendMessage'),
    controller.users.sendMessage,
  );
  // endpoint for creating pool
  server.post(
    '/createPool',
    auth,
    validator('body', 'createPool'),
    controller.users.createPool,
  );
  // endpoint for pool Config
  server.get('/poolConfig', auth, controller.users.getPoolConfig);
  // endpoint for pool Config
  server.post(
    '/poolConfig',
    auth,
    validator('body', 'poolConfig'),
    controller.users.updatePoolConfig,
  );
  // endpoint for creating pool
  server.get('/queryPool', auth, controller.users.queryPool);
  // endpoint for pool history
  server.get('/poolHistory', auth, controller.users.poolHistory);
  // endpoint for minting tokens to a new account
  server.post(
    '/nft/mintToken',
    auth,
    validator('body', 'mintToken'),
    controller.users.mintToken,
  );
  // endpoint for minting batch of tokens to a new account
  server.post(
    '/nft/mintBatch',
    auth,
    validator('body', 'mintBatch'),
    controller.users.mintBatch,
  );
  // endpoint for burn batch of tokens to a new account
  server.post(
    '/nft/burnBatch',
    auth,
    validator('body', 'burnBatch'),
    controller.users.burnBatch,
  );
  // endpoint for transfer of tokens from sender to receipient
  server.post(
    '/nft/transfer',
    auth,
    validator('body', 'nftTransfer'),
    controller.users.nftTransfer,
  );
  // endpoint for transfer batch of tokens from sender to receipient
  server.post(
    '/nft/transferBatch',
    auth,
    validator('body', 'nftTransferBatch'),
    controller.users.nftTransferBatch,
  );
  // endpoint for get Approval for the tokens of an account
  server.post(
    '/nft/checkApproval',
    auth,
    validator('body', 'checkApproval'),
    controller.users.checkApproval,
  );
  // endpoint for set Approval for the tokens of an account
  server.post(
    '/nft/setApproval',
    auth,
    validator('body', 'setApproval'),
    controller.users.setApproval,
  );
  // endpoint for balance of token in the caller account
  server.post(
    '/nft/balance',
    auth,
    validator('body', 'nftBalance'),
    controller.users.nftBalance,
  );
  // endpoint for balance of differnt tokens in the caller account
  server.post(
    '/nft/balanceBatch',
    auth,
    validator('body', 'nftBalanceBatch'),
    controller.users.nftBalanceBatch,
  );
  // endpoint for getting metadata of the token
  server.get('/nft/tokenInfo', auth, controller.users.nftTokenInfo);
  // endpoint for getting all the minted Tokens
  server.get('/nft/mintedTokens', auth, controller.users.mintedTokens);
  // endpoint for Updating token Metadata
  server.post(
    '/nft/updateTokenMetaData',
    auth,
    validator('body', 'updateTokenMetaData'),
    controller.users.updateTokenMetaData,
  );
  // endpoint for minting busy nft tokens to a new account
  server.post(
    '/busynft/mint',
    auth,
    validator('body', 'specialMint'),
    controller.users.busyNftmint,
  );
  // endpoint for transfer of busy nft tokens from sender to receipient
  server.post(
    '/busynft/transfer',
    auth,
    validator('body', 'specialTransfer'),
    controller.users.busyNftTransfer,
  );
  // endpoint for transfer of tokens from sender to receipient
  server.get(
    '/busynft/mintedTokens',
    auth,
    controller.users.getSpecialMintedTokens,
  );

  // endpoint for getting special minted tokens
  server.get(
    '/busynft/getCurrentOwner',
    auth,
    middleware.utility.required(['nftName']),
    controller.users.getCurrentOwner,
  );
  // endpoint for creating vote
  server.post(
    '/createVote',
    auth,
    validator('body', 'createVote'),
    controller.users.createVote,
  );
  // endpoint for destroying the pool
  server.post('/destroyPool', auth, controller.users.destroyPool);

  server.get('/tokenIssueFees', auth, controller.users.getTokenIssueFee);
  server.get('/messagingFees', auth, controller.users.getMessagingFee);
  server.post(
    '/updateTokenIssueFees',
    auth,
    validator('body', 'updateTokenIssueFees'),
    controller.users.updateTokenIssueFee,
  );
  server.post(
    '/updateMessagingFees',
    auth,
    validator('body', 'updateMessagingFees'),
    controller.users.updateMessagingFee,
  );
};
