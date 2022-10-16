// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

interface IMockERC20 is IERC20 {
  function mint(address _recipient, uint256 _amount) external;

  function burn(address _recipient, uint256 _amount) external;
}
