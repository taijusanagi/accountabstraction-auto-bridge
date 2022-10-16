/* eslint-disable camelcase */
import { ethers } from "hardhat";

async function main() {
  const MockSwap = await ethers.getContractFactory("MockSwap");
  const mockSwap = await MockSwap.deploy("0x98339D8C260052B7ad81c28c16C0b98420f2B46a", 1228);
  console.log(mockSwap.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
