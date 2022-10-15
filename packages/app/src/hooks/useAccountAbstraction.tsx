/* eslint-disable camelcase */
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useSigner } from "wagmi";

import deployments from "../../../contracts/deployments/goerli.json";
import { SandboxWalletAPI } from "../../../contracts/lib/SandboxWalletAPI";
import { useIsWagmiConnected } from "./useIsWagmiConnected";

export const useAccountAbstraction = () => {
  const { data: signer } = useSigner();
  const { isWagmiConnected } = useIsWagmiConnected();
  const [contractWalletAPI, setContractWalletAPI] = useState<SandboxWalletAPI>();
  const [contractWalletAddress, setContractWalletAddress] = useState("");
  const [contractWalletBalance, setContractWalletBalance] = useState("0.0");

  useEffect(() => {
    (async () => {
      if (!signer || !isWagmiConnected) {
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
  }, [signer, isWagmiConnected]);

  return { contractWalletAPI, contractWalletAddress, contractWalletBalance };
};
