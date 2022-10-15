/* eslint-disable camelcase */

import { FormControl, FormLabel, Stack, Text } from "@chakra-ui/react";
import { NextPage } from "next";

import { DefaultLayout } from "@/components/layouts/Default";

export interface PeerMeta {
  name: string;
  url: string;
}

const SwapPage: NextPage = () => {
  return (
    <DefaultLayout>
      <Stack spacing="8">
        <Stack spacing="4">
          <Stack spacing="2">
            <Text fontSize={"xl"} fontWeight="bold">
              Swap with Hop
            </Text>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Account Type
              </FormLabel>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Bridging Token
              </FormLabel>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Receiving Token (Optional)
              </FormLabel>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Source Chain
              </FormLabel>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Destination Chain
              </FormLabel>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Amount
              </FormLabel>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="bold">
                Recipient
              </FormLabel>
            </FormControl>
          </Stack>
        </Stack>
      </Stack>
    </DefaultLayout>
  );
};

export default SwapPage;
