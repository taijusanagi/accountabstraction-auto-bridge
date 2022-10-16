// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
  constructor(uint256 amountToMint) ERC20("Test ERC20", "TESTERC20") {
    _mint(msg.sender, amountToMint);
  }
}
