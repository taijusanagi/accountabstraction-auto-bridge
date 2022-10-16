# Account Abstraction Connect

## Bounties

### Hop - Bounty #2

- Integrated Account Abstraction for auto-mate swapping in the destination chain.
- Account Abstraction enables batch Tx and gas-less auto Tx for better UX for Hop.
- Hop can be the Account Abstraction gateway for users by this app.
- All the Hop-related logic is stored here
  - https://github.com/taijusanagi/accountabstraction-auto-bridge/blob/main/packages/app/src/pages/bridge.tsx#L35

### Uniswap - Bounty #3

- Integrated Uniswap V3 swap logic with Account Abstraction contract wallet.
- Account Abstraction batch Tx and gas-less auto Tx for better UX for Uniswap.
- This is a test file for explaining how it works
  - https://github.com/taijusanagi/accountabstraction-auto-bridge/blob/main/packages/contracts/test/AccountAbstractionWallet.test.ts#L179

### Quicknode - Bounty #Using QuickNode

- Integrated Quicknode RPC for deploying contracts to Arbitrum Georli Network
- Integrated Quicknode RPC for Account Abstraction bundler, which enables users to send Tx in a gas-less way, and Quicknode powerful RPC helped this bundler works properly without no running-down
- This is hard-coded in the running script
  - https://github.com/taijusanagi/accountabstraction-auto-bridge/blob/main/package.json#L18
