/* eslint-disable camelcase */
import { ethers } from "hardhat";

import { mockUSDCRate, usdcInGoerli } from "../lib/data";

async function main() {
  const MockSwap = await ethers.getContractFactory("MockSwap");
  const mockSwap = await MockSwap.deploy(usdcInGoerli, mockUSDCRate);
  console.log(mockSwap.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
