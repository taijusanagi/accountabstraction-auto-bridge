// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "./SandboxWallet.sol";

contract SandboxWalletDeployer {
  function deployWallet(
    IEntryPoint entryPoint,
    address owner,
    uint256 salt
  ) public returns (SandboxWallet) {
    return new SandboxWallet{salt: bytes32(salt)}(entryPoint, owner);
  }
}
