/* eslint-disable camelcase */
import { ethers } from "hardhat";

import { IMockERC20__factory } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();

  // etherscan is available for Ethereum
  // https://goerli.etherscan.io/address/0x98339D8C260052B7ad81c28c16C0b98420f2B46a#writeContract

  // this is only for Arbitrum
  // seems this token does not have mint
  const usdc = IMockERC20__factory.connect("0x17078f231aa8dc256557b49a8f2f72814a71f633", signer);
  const usdcMintAmmount = "1000000000000"; // 1000000 USDC (decimals = 6)
  const tx = await usdc.mint(signer.address, usdcMintAmmount);
  console.log(tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
