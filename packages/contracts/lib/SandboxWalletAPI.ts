/* eslint-disable camelcase */
import { SimpleWalletAPI } from "@account-abstraction/sdk";
import { hexConcat } from "ethers/lib/utils";

import {
  SandboxWallet,
  SandboxWallet__factory,
  SandboxWalletDeployer,
  SandboxWalletDeployer__factory,
} from "../typechain-types";

export class SandboxWalletAPI extends SimpleWalletAPI {
  walletContract?: SandboxWallet;
  factory?: SandboxWalletDeployer;

  async _getWalletContract(): Promise<SandboxWallet> {
    if (this.walletContract == null) {
      this.walletContract = SandboxWallet__factory.connect(await this.getWalletAddress(), this.provider);
    }
    return this.walletContract;
  }

  async getCounterFactualAddress(): Promise<string> {
    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== "") {
        this.factory = SandboxWalletDeployer__factory.connect(this.factoryAddress, this.provider);
      } else {
        throw new Error("no factory to get initCode");
      }
    }
    return this.factory.getCreate2Address(this.entryPointAddress, await this.owner.getAddress(), this.index);
  }

  async getWalletInitCode(): Promise<string> {
    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== "") {
        this.factory = SandboxWalletDeployer__factory.connect(this.factoryAddress, this.provider);
      } else {
        throw new Error("no factory to get initCode");
      }
    }
    const ownerAddress = await this.owner.getAddress();
    const data = this.factory.interface.encodeFunctionData("deployWallet", [
      this.entryPointAddress,
      ownerAddress,
      this.index,
    ]);
    return hexConcat([this.factory.address, data]);
  }
}
