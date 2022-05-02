/* eslint-disable */
// prettier-ignore

var atob = require('atob');

var AccessGroupsObject = {
    "BusyAdmin": [
        /* Section 1 - Access */ "generateToken", "generateApiKey", "revokeApiKey",
        /* Section 2 - Account */ "register", "authorization", "queryWallet", "userWallets", "recoverUser", "resetPassword", "defaultWallets", "recoverSeed",
        /* Section 3 - Staking */ "createStakingAddress", "stakingInfo", "claim", "unstake", "stakingAddresses", "claimAll",
        /* Section 4 - BusyChain */ "transfer", "getTotalSupply", "getBlocks", "transactions", "currentPhase", "transactionFees", "messagingFees", "tokenIssueFees", "registerPeer",
        /* Section 6 - Voting Governance */ "createPool", "createVote", "poolConfig", "poolHistory", "queryPool",
        /* Section 7 - Messaging */ "sendMessage", "generateMessageCreds",
        /* Section 8.1 - Tokens BUSY20 */ "issue", "issuedTokens",
        /* Section 8.2 - Tokens NFT+Game */ "nft/mintToken", "nft/mintBatch", "nft/burnBatch", "nft/transfer", "nft/transferBatch", "nft/checkApproval", "nft/setApproval", "nft/balance", "nft/balanceBatch", "nft/mintedTokens", "nft/tokenInfo",
        /* Section 8.3 - Tokens BUSYNFT */ "busynft/mint", "busynft/transfer", "busynft/getCurrentOwner", "busynft/updateTokenMetaData", "busynft/mintedTokens",
        /* Section 8.4 - Tokens Update */ "nft/updateTokenMetaData",
        /* Section 8.5 - Burn Token*/ "burnToken",
        /* Section 9.1 - ADMIN Functions*/ "swap", "burn", "destroyPool",
        /* Section 9.2 - ADMIN Configurations*/ "poolConfig", "updateTransferFees", "updateMessagingFees", "updateTokenIssueFees", "getBusyAddress",
        /* Section 9.3 - ADMIN - Vesting */ "lockedVestingInfo", "attemptUnlock", "vestingV1", "vestingV2"
    ],

    "BusyCron": [
        /* Section 1 - Access */ "generateToken",
        /* Section 2 - Account */ "defaultWallets",
        /* Section 3 - Staking */ "stakingAddresses",
        /* Section 4 - BusyChain */ "getTotalSupply","getBlocks", "transactions", "currentPhase", "transactionFees", "messagingFees", "tokenIssueFees",
        /* Section 6 - Voting Governance */ "poolConfig",
        /* Section 8.1 - Tokens BUSY20 */ "issuedTokens",
        /* Section 8.2 - Tokens NFT+Game */ "nft/mintedTokens",
        /* Section 9.1 - ADMIN Functions*/ "destroyPool"
    ],

    "BusyScanAdmin": [
        /* Section 1 - Access */ "generateToken", "generateApiKey", "revokeApiKey"
    ],

    "BusyDesktopWallet": [
        /* Section 1 - Access */ "generateToken",
        /* Section 2 - Account */ "register", "queryWallet", "userWallets", "recoverUser", "resetPassword", "defaultWallets", "recoverSeed",
        /* Section 3 - Staking */ "createStakingAddress", "stakingInfo", "claim", "unstake", "stakingAddresses", "claimAll",
        /* Section 4 - BusyChain */ "transfer", "getTotalSupply", "getBlocks", "transactions", "currentPhase", "transactionFees", "messagingFees", "tokenIssueFees",
        /* Section 8.1 - Tokens BUSY20 */ "issue", "issuedTokens",
        /* Section 8.2 - Tokens NFT+Game */ "nft/mintToken", "nft/mintBatch", "nft/burnBatch", "nft/transfer", "nft/transferBatch", "nft/checkApproval", "nft/setApproval", "nft/balance", "nft/balanceBatch", "nft/mintedTokens", "nft/tokenInfo",
        /* Section 8.4 - Tokens Update */ "nft/updateTokenMetaData",
        /* Section 8.5 - Burn Token*/ "burnToken"
    ],

    "busyuser": [
        /* Section 1 - Access */ "generateToken",
        /* Section 2 - Account */ "register", "queryWallet", "userWallets", "defaultWallets",
        /* Section 3 - Staking */ "createStakingAddress", "stakingInfo", "claim", "unstake", "stakingAddresses", "claimAll",
        /* Section 4 - BusyChain */ "transfer", "getTotalSupply", "getBlocks", "transactions", "currentPhase", "transactionFees", "messagingFees", "tokenIssueFees",
        /* Section 8.1 - Tokens BUSY20 */ "issuedTokens",
        /* Section 8.2 - Tokens NFT+Game */ "nft/checkApproval", "nft/balance", "nft/balanceBatch", "nft/mintedTokens", "nft/tokenInfo",
        /* Section 8.3 - Tokens BUSYNFT */ "busynft/getCurrentOwner", "busynft/mintedTokens"
    ],

    "BusySwap": [
        /* Section 1 - Access */ "generateToken",
        /* Section 9.1 - ADMIN Functions*/ "swap"
    ],

    "BusyPlatform": [
        /* Section 1 - Access */ "generateToken",
        /* Section 2 - Account */ "register", "queryWallet", "userWallets", "recoverUser", "recoverSeed",
        /* Section 3 - Staking */ "stakingInfo",
        /* Section 4 - BusyChain */ "currentPhase", "transactionFees", "messagingFees", "tokenIssueFees",
        /* Section 7 - Messaging */ "sendMessage", "generateMessageCreds",
        /* Section 8.3 - Tokens BUSYNFT */ "busynft/getCurrentOwner", "busynft/mintedTokens"
    ]
};

require(`module-alias/register`);
const logger = require('@utils/logger');
module.exports = (token, functionName) => {
    if (token == null) {
        return {
            authorized: false,
            errorMsg: 'Authorization header not preset',
            statusCode: 401,
        };
    }
    payload = parseJwt(token);
    //    logger.info("Checking the authorization for ", functionName);

    if (payload.domainname in AccessGroupsObject) {
        let functionList = AccessGroupsObject[payload.domainname];

        if (functionList.includes(functionName)) {
            return {
                authorized: true,
                statusCode: 200,
            };
        } else {
            return {
                authorized: false,
                errorMsg: 'Forbidden',
                statusCode: 403,
            };
        }
    } else {
        return {
            authorized: false,
            errorMsg: 'Forbidden',
            statusCode: 403,
        };
    }
};

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(
            atob(base64)
            .split('')
            .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(''),
            );

    return JSON.parse(jsonPayload);
}
