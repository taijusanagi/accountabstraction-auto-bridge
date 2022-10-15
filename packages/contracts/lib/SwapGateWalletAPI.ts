/* eslint-disable camelcase */
import { SimpleWalletAPI } from "@account-abstraction/sdk";
import { hexConcat } from "ethers/lib/utils";

import {
  SwapGateWallet,
  SwapGateWallet__factory,
  SwapGateWalletDeployer,
  SwapGateWalletDeployer__factory,
} from "../typechain-types";

export class SwapGateWalletAPI extends SimpleWalletAPI {
  walletContract?: SwapGateWallet;
  factory?: SwapGateWalletDeployer;

  async _getWalletContract(): Promise<SwapGateWallet> {
    if (this.walletContract == null) {
      this.walletContract = SwapGateWallet__factory.connect(await this.getWalletAddress(), this.provider);
    }
    return this.walletContract;
  }

  async getCounterFactualAddress(): Promise<string> {
    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== "") {
        this.factory = SwapGateWalletDeployer__factory.connect(this.factoryAddress, this.provider);
      } else {
        throw new Error("no factory to get initCode");
      }
    }
    return this.factory.getCreate2Address(this.entryPointAddress, await this.owner.getAddress(), this.index);
  }

  async getWalletInitCode(): Promise<string> {
    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== "") {
        this.factory = SwapGateWalletDeployer__factory.connect(this.factoryAddress, this.provider);
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
