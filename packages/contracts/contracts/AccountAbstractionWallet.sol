// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "@account-abstraction/contracts/samples/SimpleWallet.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

contract AccountAbstractionWallet is ERC165, IERC1271, SimpleWallet {
  constructor(IEntryPoint anEntryPoint, address anOwner) SimpleWallet(anEntryPoint, anOwner) {}

  function isValidSignature(bytes32 _hash, bytes calldata _signature) external view override returns (bytes4) {
    address recovered = ECDSA.recover(_hash, _signature);
    if (recovered == owner) {
      return type(IERC1271).interfaceId;
    } else {
      return 0xffffffff;
    }
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == type(IERC1271).interfaceId || super.supportsInterface(interfaceId);
  }
}
