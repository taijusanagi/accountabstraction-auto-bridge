import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";

import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

export const accounts = process.env.DEPLOYER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.15",
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
        url: "https://goerli.infura.io/v3/95f65ab099894076814e8526f52c9149",
      },
    },
    goerli: {
      url: "https://goerli.infura.io/v3/95f65ab099894076814e8526f52c9149",
      accounts,
    },
    "arbitrum-goerli": {
      url: "https://white-holy-snowflake.arbitrum-goerli.discover.quiknode.pro/efc6175cfe9ac7459d93f211cdfbbda8087ea401",
      accounts,
    },
  },
};

export default config;
