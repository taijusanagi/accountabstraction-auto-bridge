/* eslint-disable camelcase */

import { FormControl, FormLabel, Stack, Text } from "@chakra-ui/react";
import { NextPage } from "next";

import { DefaultLayout } from "@/components/layouts/Default";
import { useAccountAbstraction } from "@/hooks/useAccountAbstraction";

export interface PeerMeta {
  name: string;
  url: string;
}

const HomePage: NextPage = () => {
  const { contractWalletAddress, contractWalletBalanceInEthereum, contractWalletBalanceInArbitrum } =
    useAccountAbstraction();

  return (
    <DefaultLayout>
      <Stack spacing="8">
        <Stack spacing="4">
          <Stack spacing="2">
            <Text fontSize={"xl"} fontWeight="bold">
              AA Bridge
            </Text>
            <Text fontSize={"xs"} color="gray.600">
              * AA wallet address is calculated by create2.
            </Text>
            <Text fontSize={"xs"} color="gray.600">
              * No previous setting is required to use.
            </Text>
          </Stack>
          <Stack spacing="2">
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                AA Wallet Address
              </FormLabel>
              <Text fontSize="xs">{contractWalletAddress || "not connected"}</Text>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Balance in Ethereum
              </FormLabel>
              <Text fontSize="xs">{contractWalletBalanceInEthereum} ETH</Text>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Balance in Arbitrum
              </FormLabel>
              <Text fontSize="xs">{contractWalletBalanceInArbitrum} ETH</Text>
            </FormControl>
          </Stack>
        </Stack>
      </Stack>
    </DefaultLayout>
  );
};

export default HomePage;
