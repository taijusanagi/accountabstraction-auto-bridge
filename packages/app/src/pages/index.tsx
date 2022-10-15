/* eslint-disable camelcase */
import { EntryPoint__factory } from "@account-abstraction/contracts";
import { Button, FormControl, FormLabel, Stack, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { NextPage } from "next";
import { useSigner } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";
import { useAccountAbstraction } from "@/hooks/useAccountAbstraction";

import deployments from "../../../contracts/deployments/goerli.json";
import { NULL_ADDRESS, NULL_BYTES } from "../../../contracts/lib/utils";

export interface PeerMeta {
  name: string;
  url: string;
}

const HomePage: NextPage = () => {
  const { contractWalletAPI, contractWalletAddress, contractWalletBalance } = useAccountAbstraction();
  const { data: signer } = useSigner();

  const deposit = async () => {
    if (!contractWalletAddress || !signer) {
      return;
    }
    await signer.sendTransaction({
      to: contractWalletAddress,
      value: ethers.utils.parseEther("0.01"),
    });
  };

  const deploy = async () => {
    if (!contractWalletAddress || !contractWalletAPI || !signer) {
      return;
    }
    const address = await signer.getAddress();
    const op = await contractWalletAPI.createSignedUserOp({
      target: NULL_ADDRESS,
      data: NULL_BYTES,
    });
    const entryPoint = EntryPoint__factory.connect(deployments.entryPoint, signer);
    await entryPoint.handleOps([op], address);
  };

  return (
    <DefaultLayout>
      <Stack spacing="8">
        <Stack spacing="4">
          <Stack spacing="2">
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Account
              </FormLabel>
              <Text fontSize="xs">{contractWalletAddress || "not connected"}</Text>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Balance
              </FormLabel>
              <Text fontSize="xs">{contractWalletBalance} ETH</Text>
            </FormControl>
          </Stack>
          <Stack>
            <Button w="full" isDisabled={!contractWalletAddress} onClick={deposit} colorScheme="brand">
              Deposit 0.01ETH
            </Button>
          </Stack>
          <Stack>
            <Button w="full" isDisabled={!contractWalletAddress} onClick={deploy} colorScheme="brand">
              Deploy
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </DefaultLayout>
  );
};

export default HomePage;
