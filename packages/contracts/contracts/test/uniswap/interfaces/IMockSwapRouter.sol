// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

interface IMockSwapRouter {
  function setTime(uint256 _time) external;
}
