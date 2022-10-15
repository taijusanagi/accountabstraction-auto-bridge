/* eslint-disable camelcase */
import fs from "fs";
import { network } from "hardhat";
import path from "path";

import { DeterministicDeployer } from "../lib/infinitism/DeterministicDeployer";
import { SandboxWalletDeployer__factory } from "../typechain-types";

async function main() {
  const factoryAddress = await DeterministicDeployer.deploy(SandboxWalletDeployer__factory.bytecode);
  const result = {
    factory: factoryAddress,
  };
  fs.writeFileSync(path.join(__dirname, `../deployments/${network.name}.json`), JSON.stringify(result));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
