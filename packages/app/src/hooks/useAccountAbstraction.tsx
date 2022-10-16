/* eslint-disable camelcase */
import { HttpRpcClient } from "@account-abstraction/sdk/dist/src/HttpRpcClient";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useNetwork, useSigner } from "wagmi";

import deployments from "../../../contracts/deployments.json";
import { AccountAbstractionWalletAPI } from "../../../contracts/lib/AccountAbstractionWalletAPI";
import rpcs from "../../../contracts/rpcs.json";

export const useAccountAbstraction = () => {
  const { data: signer } = useSigner();

  const { chain } = useNetwork();

  const [signerAddress, setSignerAddress] = useState("");
  const [contractWalletAPI, setContractWalletAPI] = useState<AccountAbstractionWalletAPI>();
  const [contractWalletAddress, setContractWalletAddress] = useState("");
  const [contractWalletBalanceInEthereum, setContractWalletBalanceInEthereum] = useState("0.0");
  const [contractWalletBalanceInArbitrum, setContractWalletBalanceInArbitrum] = useState("0.0");

  const signAndSendTxWithBundler = async (target: string, data: string, value: string, targetChainId?: number) => {
    if (!contractWalletAPI || !chain) {
      return;
    }

    const chainId = targetChainId || chain.id;
    let httpRpcClient: HttpRpcClient;
    console.log(chainId);
    if (chainId === 5) {
      httpRpcClient = new HttpRpcClient("http://localhost:3001/rpc", deployments.entryPoint, 5);
    } else if (chainId === 421613) {
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
      const ethereumProvider = new ethers.providers.JsonRpcProvider(rpcs.goerli);
      const arbitrumProvider = new ethers.providers.JsonRpcProvider(rpcs["arbitrum-goerli"]);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      let provider: ethers.providers.Provider;
      if (chain.id === 5) {
        provider = ethereumProvider;
      } else if (chain.id === 421613) {
        provider = arbitrumProvider;
      } else {
        throw Error("Network in invalid");
      }
      const contractWalletAPI = new AccountAbstractionWalletAPI({
        provider,
        entryPointAddress: deployments.entryPoint,
        owner: signer,
        factoryAddress: deployments.factory,
      });

      signer.getAddress().then((signerAddress) => setSignerAddress(signerAddress));
      setContractWalletAPI(contractWalletAPI);
      const contractWalletAddress = await contractWalletAPI.getWalletAddress();
      setContractWalletAddress(contractWalletAddress);
      ethereumProvider.getBalance(contractWalletAddress).then((contractWalletBalanceInEthereumBigNumber) => {
        const contractWalletBalanceInEthereum = ethers.utils.formatEther(contractWalletBalanceInEthereumBigNumber);
        setContractWalletBalanceInEthereum(contractWalletBalanceInEthereum);
      });
      await arbitrumProvider.getBalance(contractWalletAddress).then((contractWalletBalanceInArbitrumBigNumber) => {
        const contractWalletBalanceInArbitrum = ethers.utils.formatEther(contractWalletBalanceInArbitrumBigNumber);
        setContractWalletBalanceInArbitrum(contractWalletBalanceInArbitrum);
      });
    })();
  }, [signer, chain]);

  return {
    signerAddress,
    contractWalletAPI,
    contractWalletAddress,
    contractWalletBalanceInEthereum,
    contractWalletBalanceInArbitrum,
    signAndSendTxWithBundler,
  };
};
