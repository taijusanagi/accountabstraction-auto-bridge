/* eslint-disable camelcase */

import { Button, FormControl, FormLabel, Stack, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { NextPage } from "next";
import { useSigner } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";
import { useAccountAbstraction } from "@/hooks/useAccountAbstraction";

export interface PeerMeta {
  name: string;
  url: string;
}

const HomePage: NextPage = () => {
  const { contractWalletAddress, contractWalletBalance } = useAccountAbstraction();
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

  return (
    <DefaultLayout>
      <Stack spacing="8">
        <Stack spacing="4">
          <Stack spacing="2">
            <Text fontSize={"xl"} fontWeight="bold">
              AAGateWallet
            </Text>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Address
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
        </Stack>
      </Stack>
    </DefaultLayout>
  );
};

export default HomePage;
