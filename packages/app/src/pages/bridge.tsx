/* eslint-disable camelcase */
import { HttpRpcClient } from "@account-abstraction/sdk/dist/src/HttpRpcClient";
import { Button, FormControl, FormLabel, Input, Select, Stack, Text } from "@chakra-ui/react";
import { Chain, Hop } from "@hop-protocol/sdk";
import { NextPage } from "next";
import React, { useState } from "react";
import { useSigner } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";
import { useAccountAbstraction } from "@/hooks/useAccountAbstraction";
import { StoredOp } from "@/types/op";

import deployments from "../../../contracts/deployments.json";
import { MockSwap__factory } from "../../../contracts/typechain-types";
import { truncate } from "../lib/utils";

const BridgePage: NextPage = () => {
  const { data: signer } = useSigner();
  const { signerAddress, contractWalletAddress, contractWalletAPI, signAndSendTxWithBundler } = useAccountAbstraction();

  const [isLoading, setIsLoading] = useState(false);
  const [sourceChain, setSourceChain] = useState("arbitrum");
  const [destinationChain, setDestinationChain] = useState("ethereum");
  const [sendFrom, setSendFrom] = useState("eoa");
  const [sendTo, setSendTo] = useState("eoa");
  const [bridgingToken, setBridgingToken] = useState("ETH");
  const [receivingToken, setReceivingToken] = useState("ETH");

  const [amount, setAmount] = useState("0");

  const bridge = async () => {
    if (!signer || !contractWalletAPI) {
      return;
    }
    try {
      setIsLoading(true);
      // this is mock for demo
      // this is temp implementation so it is hard-coded
      const mockSwapAddressInGoerli = "0x51B41A0112657f9530AaE72F1D50BCcD3D0D8Cff";
      const mockSwap = MockSwap__factory.connect(mockSwapAddressInGoerli, signer);
      if (sendFrom === "eoa") {
        const hop = new Hop("goerli", signer);
        const bridge = hop.connect(signer).bridge(bridgingToken);
        const sourceChainForBridge = sourceChain === "ethereum" ? Chain.Ethereum : Chain.Arbitrum;
        const destinationChainForBridge = destinationChain === "ethereum" ? Chain.Ethereum : Chain.Arbitrum;
        const amountBn = bridge.parseUnits(amount);
        console.log(amountBn.toString());
        if (sendTo === "eoa") {
          if (bridgingToken === receivingToken) {
            const bridgeTx = await bridge.send(amountBn, sourceChainForBridge, destinationChainForBridge);
            await bridgeTx.wait();
            console.log(bridgeTx.hash);
          } else {
            const receipient = await signer.getAddress();
            const op = await contractWalletAPI.createSignedUserOp({
              target: mockSwap.address,
              data: mockSwap.interface.encodeFunctionData("swap", [receipient]),
              value: amountBn,
              gasLimit: 128609,
            });

            // const chainId = destinationChain === "ethereum" ? 5 : 421613;
            // const storedOp: StoredOp = { op, amount, chainId, receivingToken };
            // window.localStorage.setItem("ops", JSON.stringify(storedOp));
            // const options = {
            //   recipient: contractWalletAddress,
            // };
            // const bridgeTx = await bridge.send(amountBn, sourceChainForBridge, destinationChainForBridge, options);
            // await bridgeTx.wait();
            // console.log(bridgeTx.hash);

            const httpRpcClient = new HttpRpcClient("http://localhost:3001/rpc", deployments.entryPoint, 5);
            const result = await httpRpcClient.sendUserOpToBundler(op);
            console.log(result);
          }
        } else {
          if (bridgingToken === receivingToken) {
            const options = {
              recipient: contractWalletAddress,
            };
            const tx = await bridge.send(
              amount,
              sourceChain === "ethereum" ? Chain.Ethereum : Chain.Arbitrum,
              destinationChain === "ethereum" ? Chain.Ethereum : Chain.Arbitrum,
              options
            );
            console.log(tx.hash);
          } else {
            throw Error("not implemented");
          }
        }
      } else {
        throw Error("not implemented");
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  const swapChain = () => {
    setSourceChain(destinationChain);
    setDestinationChain(sourceChain);
  };

  return (
    <DefaultLayout>
      <Stack spacing="8">
        <Stack spacing="4">
          <Stack spacing="2">
            <Text fontSize={"xl"} fontWeight="bold">
              Bridge with Auto-Swap
            </Text>
            <Text fontSize={"xs"} color="gray.600">
              * Hop Protocol: Arbitrum to Ethereum Bridge is implemented for fast bridge
            </Text>
            <Text fontSize={"xs"} color="gray.600">
              * Only ETH to ETH / USDC is implemented due to liquidity issue
            </Text>
          </Stack>
          <Stack spacing="2">
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Source Chain
              </FormLabel>
              <Select onChange={swapChain} value={sourceChain} fontSize="sm">
                <option value="ethereum" disabled>
                  Ethereum Goerli
                </option>
                <option value="arbitrum">Arbitrum Goerli</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Destination Chain
              </FormLabel>
              <Select onChange={swapChain} value={destinationChain} fontSize="sm">
                <option value="ethereum">Ethereum Goerli</option>
                <option value="arbitrum" disabled>
                  Arbitrum Goerli
                </option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Send from
              </FormLabel>
              <Select onChange={(e) => setSendFrom(e.target.value)} value={sendFrom} fontSize="sm">
                <option value="eoa">EOA: {truncate(signerAddress, 4, 4)}</option>
                <option value="accountabstraction" disabled>
                  AA wallet: {truncate(contractWalletAddress, 4, 4)}
                </option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Send to
              </FormLabel>
              <Select onChange={(e) => setSendTo(e.target.value)} value={sendTo} fontSize="sm">
                <option value="eoa">EOA: {truncate(signerAddress, 4, 4)}</option>
                <option value="accountabstraction">AA wallet: {truncate(contractWalletAddress, 4, 4)}</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Bridging Token
              </FormLabel>
              <Select onChange={(e) => setBridgingToken(e.target.value)} value={bridgingToken} fontSize="sm">
                <option value="ETH">ETH</option>
                <option value="USDC" disabled>
                  USDC
                </option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Receiving Token (New!)
              </FormLabel>
              <Select onChange={(e) => setReceivingToken(e.target.value)} value={receivingToken} fontSize="sm">
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Amount
              </FormLabel>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </FormControl>
            <Button w="full" onClick={bridge} colorScheme="brand" isLoading={isLoading}>
              Bridge
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </DefaultLayout>
  );
};

export default BridgePage;
