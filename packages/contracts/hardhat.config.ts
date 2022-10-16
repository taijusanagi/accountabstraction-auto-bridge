import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";

import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

import rpcs from "./rpcs.json";

dotenv.config();

export const accounts = process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.7.6",
      },
      {
        version: "0.8.15",
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 5,
      forking: {
        url: rpcs.goerli,
      },
    },
    goerli: {
      url: rpcs.goerli,
      accounts,
    },
    "arbitrum-goerli": {
      url: rpcs["arbitrum-goerli"],
      accounts,
    },
  },
};

export default config;
