// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "./interfaces/IMockERC20.sol";

// this is only available in Goerli
contract MockSwap {
  IMockERC20 public token;
  uint256 public rate;

  constructor(address _token, uint256 _rate) {
    token = IMockERC20(_token);
    rate = _rate;
  }

  // this is just a mock contract to test
  function swap() public payable {
    uint256 amount = msg.value * rate;
    token.mint(msg.sender, amount);
  }
}
