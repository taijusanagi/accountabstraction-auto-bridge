// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./AccountAbstractionWallet.sol";

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Create2.sol";

contract AccountAbstractionWalletDeployer {
  function deployWallet(
    IEntryPoint entryPoint,
    address owner,
    uint256 salt
  ) public returns (AccountAbstractionWallet) {
    return new AccountAbstractionWallet{salt: bytes32(salt)}(entryPoint, owner);
  }

  function getCreate2Address(
    IEntryPoint entryPoint,
    address owner,
    uint256 salt
  ) public view returns (address) {
    bytes memory creationCode = type(AccountAbstractionWallet).creationCode;
    bytes memory initCode = abi.encodePacked(creationCode, abi.encode(entryPoint, owner));
    bytes32 initCodeHash = keccak256(initCode);
    return Create2.computeAddress(bytes32(salt), initCodeHash, address(this));
  }
}
