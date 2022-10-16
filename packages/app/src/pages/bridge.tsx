/* eslint-disable camelcase */

import { HttpRpcClient } from "@account-abstraction/sdk/dist/src/HttpRpcClient";
import { Button, FormControl, FormLabel, Input, Select, Stack, Text } from "@chakra-ui/react";
import { Chain, Hop } from "@hop-protocol/sdk";
import { NextPage } from "next";
import React, { useState } from "react";
import { useNetwork, useSigner } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";
import { useAccountAbstraction } from "@/hooks/useAccountAbstraction";
import { StoredOp } from "@/types/op";

import deployments from "../../../contracts/deployments.json";
import { MockSwap__factory } from "../../../contracts/typechain-types";
import { truncate } from "../lib/utils";

const BridgePage: NextPage = () => {
  const { data: signer } = useSigner();
  const { chain } = useNetwork();

  const { signerAddress, contractWalletAddress, contractWalletAPI, signAndSendTxWithBundler } = useAccountAbstraction();

  const [isBridgeLoading, setIsBridgeLoading] = useState(false);
  const [isCreateOpLoading, setIsCreateOpLoading] = useState(false);
  const [sourceChain, setSourceChain] = useState("arbitrum");
  const [destinationChain, setDestinationChain] = useState("ethereum");
  const [sendFrom, setSendFrom] = useState("eoa");
  const [sendTo, setSendTo] = useState("eoa");
  const [bridgingToken, setBridgingToken] = useState("ETH");
  const [receivingToken, setReceivingToken] = useState("ETH");

  const [amount, setAmount] = useState("0");

  const createOp = async () => {
    if (!signer || !contractWalletAPI || !chain) {
      return;
    }

    if (chain.id !== 5) {
      alert("Please connect Goerli");
    }
    try {
      setIsCreateOpLoading(true);
      const hop = new Hop("goerli", signer);
      const bridge = hop.connect(signer).bridge(bridgingToken);
      const amountBn = bridge.parseUnits(amount);

      const mockSwapAddressInGoerli = "0x51B41A0112657f9530AaE72F1D50BCcD3D0D8Cff";
      const mockSwap = MockSwap__factory.connect(mockSwapAddressInGoerli, signer);
      const receipient = await signer.getAddress();
      const op = await contractWalletAPI.createSignedUserOp({
        target: mockSwap.address,
        data: mockSwap.interface.encodeFunctionData("swap", [receipient]),
        value: amountBn,
      });
      const chainId = destinationChain === "ethereum" ? 5 : 421613;
      const storedOp: StoredOp = { op, amount, chainId, receivingToken };
      window.localStorage.setItem("ops", JSON.stringify(storedOp));
      const httpRpcClient = new HttpRpcClient("http://localhost:3001/rpc", deployments.entryPoint, 5);
      const result = await httpRpcClient.sendUserOpToBundler(storedOp.op);
      console.log(result);
      window.localStorage.clear();
    } catch (e) {
      console.log(e);
    } finally {
      setIsCreateOpLoading(false);
    }
  };

  const bridge = async () => {
    if (!signer || !contractWalletAPI || !chain) {
      return;
    }
    if (chain.id !== 421613) {
      alert("Please connect Arbitrum Goerli Testnet");
    }

    try {
      setIsBridgeLoading(true);
      // this is mock for demo
      // this is temp implementation so it is hard-coded
      if (sendFrom === "eoa") {
        const hop = new Hop("goerli", signer);
        const bridge = hop.connect(signer).bridge(bridgingToken);
        const sourceChainForBridge = sourceChain === "ethereum" ? Chain.Ethereum : Chain.Arbitrum;
        const destinationChainForBridge = destinationChain === "ethereum" ? Chain.Ethereum : Chain.Arbitrum;
        const amountBn = bridge.parseUnits(amount);
        if (sendTo === "eoa") {
          if (bridgingToken === receivingToken) {
            const bridgeTx = await bridge.send(amountBn, sourceChainForBridge, destinationChainForBridge);
            await bridgeTx.wait();
            console.log(bridgeTx.hash);
          } else {
            const options = {
              recipient: contractWalletAddress,
            };
            const bridgeTx = await bridge.send(amountBn, sourceChainForBridge, destinationChainForBridge, options);
            await bridgeTx.wait();
            console.log(bridgeTx.hash);
            alert("Please switch to Goerli, then create userOp for Account Abstraction Tx (not automated yet)");
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
      setIsBridgeLoading(false);
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
              * Should run bundler in localhost to demo
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
            <Button
              w="full"
              onClick={bridge}
              colorScheme="brand"
              isLoading={isBridgeLoading}
              isDisabled={chain?.id !== 421613}
            >
              Bridge
            </Button>
            <Button
              w="full"
              onClick={createOp}
              colorScheme="brand"
              isLoading={isCreateOpLoading}
              isDisabled={chain?.id !== 5 || bridgingToken === receivingToken}
            >
              Create Swap userOp
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </DefaultLayout>
  );
};

export default BridgePage;
