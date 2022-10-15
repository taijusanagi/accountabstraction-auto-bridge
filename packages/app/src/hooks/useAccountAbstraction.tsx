/* eslint-disable camelcase */
import { HttpRpcClient } from "@account-abstraction/sdk/dist/src/HttpRpcClient";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useNetwork, useSigner } from "wagmi";

import deployments from "../../../contracts/deployments.json";
import { SandboxWalletAPI } from "../../../contracts/lib/SandboxWalletAPI";

export const useAccountAbstraction = () => {
  const { data: signer } = useSigner();

  const { chain } = useNetwork();

  const [contractWalletAPI, setContractWalletAPI] = useState<SandboxWalletAPI>();
  const [contractWalletAddress, setContractWalletAddress] = useState("");
  const [contractWalletBalance, setContractWalletBalance] = useState("0.0");

  const signAndSendTxWithBundler = async (target: string, data: string, value: string) => {
    if (!contractWalletAPI || !chain) {
      return;
    }
    let httpRpcClient: HttpRpcClient;
    if (chain.id === 5) {
      httpRpcClient = new HttpRpcClient("http://localhost:3001/rpc", deployments.entryPoint, 5);
    } else if (chain.id === 421613) {
      httpRpcClient = new HttpRpcClient("http://localhost:3002/rpc", deployments.entryPoint, 421613);
    } else {
      throw Error("Network in invalid");
    }
    const op = await contractWalletAPI.createSignedUserOp({
      target,
      data,
      value,
    });
    return await httpRpcClient.sendUserOpToBundler(op);
  };

  useEffect(() => {
    (async () => {
      if (!signer || !chain) {
        setContractWalletAPI(undefined);
        setContractWalletAddress("");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const provider = signer.provider!;
      const owner = signer;
      const contractWalletAPI = new SandboxWalletAPI({
        provider,
        entryPointAddress: deployments.entryPoint,
        owner,
        factoryAddress: deployments.factory,
      });
      setContractWalletAPI(contractWalletAPI);
      const contractWalletAddress = await contractWalletAPI.getWalletAddress();
      setContractWalletAddress(contractWalletAddress);
      const contractWalletBalanceBigNumber = await provider.getBalance(contractWalletAddress);
      const contractWalletBalance = ethers.utils.formatEther(contractWalletBalanceBigNumber);
      setContractWalletBalance(contractWalletBalance);
    })();
  }, [signer, chain]);

  return { contractWalletAPI, contractWalletAddress, contractWalletBalance, signAndSendTxWithBundler };
};
