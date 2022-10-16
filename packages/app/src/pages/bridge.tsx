/* eslint-disable camelcase */

import { Button, FormControl, FormLabel, Input, Select, Stack, Text } from "@chakra-ui/react";
import { Chain, Hop } from "@hop-protocol/sdk";
import { NextPage } from "next";
import React, { useState } from "react";
import { useSigner } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";
import { useAccountAbstraction } from "@/hooks/useAccountAbstraction";

import { truncate } from "../lib/utils";

export interface PeerMeta {
  name: string;
  url: string;
}

const BridgePage: NextPage = () => {
  const { data: signer } = useSigner();

  const { signerAddress, contractWalletAddress, contractWalletAPI } = useAccountAbstraction();

  const [sourceChain, setSourceChain] = useState("ethereum");
  const [destinationChain, setDestinationChain] = useState("arbitrum");
  const [sendFrom, setSendFrom] = useState("eoa");
  const [sendTo, setSendTo] = useState("eoa");
  const [bridgingToken, setBridgingToken] = useState("ETH");
  const [receivingToken, setReceivingToken] = useState("ETH");

  const [amount, setAmount] = useState("0.01");

  const bridge = async () => {
    if (!signer || !contractWalletAPI) {
      return;
    }

    if (sendFrom === "eoa") {
      const hop = new Hop("goerli", signer);
      const bridge = hop.connect(signer).bridge(bridgingToken);
      if (sendTo === "eoa") {
        if (bridgingToken === receivingToken) {
          const tx = await bridge.send(
            amount,
            sourceChain === "ethereum" ? Chain.Ethereum : Chain.Arbitrum,
            destinationChain === "ethereum" ? Chain.Ethereum : Chain.Arbitrum
          );
          console.log(tx.hash);
        } else {
          // generate userOp
          //  - swap token

          //  - send to eoa
          contractWalletAPI.createUnsignedUserOp({ target: signerAddress, data: "" });

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
              * Bridge is implemented with Hop Protocol
            </Text>
            <Text fontSize={"xs"} color="gray.600">
              * Auto-Swap is implemented with GMX
            </Text>
          </Stack>
          <Stack spacing="2">
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Source Chain
              </FormLabel>
              <Select onChange={swapChain} value={sourceChain} fontSize="sm">
                <option value="ethereum">Ethereum Goerli</option>
                <option value="arbitrum">Arbitrum Goerli</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Destination Chain
              </FormLabel>
              <Select onChange={swapChain} value={destinationChain} fontSize="sm">
                <option value="ethereum">Ethereum Goerli</option>
                <option value="arbitrum">Arbitrum Goerli</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Send from
              </FormLabel>
              <Select onChange={(e) => setSendFrom(e.target.value)} value={sendFrom} fontSize="sm">
                <option value="eoa">EOA: {truncate(signerAddress, 4, 4)}</option>
                <option value="accountabstraction">AA wallet: {truncate(contractWalletAddress, 4, 4)}</option>
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
                <option value="DAI">DAI</option>
                <option value="USDC">USDC</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Receiving Token (New!)
              </FormLabel>
              <Select onChange={(e) => setReceivingToken(e.target.value)} value={receivingToken} fontSize="sm">
                <option value="ETH">ETH</option>
                <option value="DAI">DAI</option>
                <option value="USDC">USDC</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Amount
              </FormLabel>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </FormControl>
            <Button w="full" onClick={bridge} colorScheme="brand">
              Bridge
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </DefaultLayout>
  );
};

export default BridgePage;
