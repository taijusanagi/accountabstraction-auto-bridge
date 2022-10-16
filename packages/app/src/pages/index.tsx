import { HttpRpcClient } from "@account-abstraction/sdk/dist/src/HttpRpcClient";
import { Button, FormControl, FormLabel, Stack, Text } from "@chakra-ui/react";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import { useNetwork } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";
import { useAccountAbstraction } from "@/hooks/useAccountAbstraction";
import { StoredOp } from "@/types/op";

import deployments from "../../../contracts/deployments.json";

const HomePage: NextPage = () => {
  const { contractWalletAddress, contractWalletBalanceInEthereum, contractWalletBalanceInArbitrum } =
    useAccountAbstraction();

  const { chain } = useNetwork();

  const [storedOp, setStoredOp] = useState<StoredOp>();

  const clear = async () => {
    window.localStorage.clear();
    setStoredOp(undefined);
  };

  // this has issue when storing in local storage
  const sendOp = async () => {
    if (!storedOp) {
      return;
    }
    let httpRpcClient: HttpRpcClient;
    if (storedOp.chainId === 5) {
      httpRpcClient = new HttpRpcClient("http://localhost:3001/rpc", deployments.entryPoint, 5);
    } else if (storedOp.chainId === 421613) {
      httpRpcClient = new HttpRpcClient("http://localhost:3002/rpc", deployments.entryPoint, 421613);
    } else {
      throw Error("Network in invalid");
    }

    const result = await httpRpcClient.sendUserOpToBundler(storedOp.op);
    console.log(result);
    clear();
  };

  useEffect(() => {
    if (!chain) {
      return;
    }
    const opInStorage = window.localStorage.getItem("ops");
    if (opInStorage) {
      const op = JSON.parse(opInStorage) as StoredOp;
      if (chain.id === op.chainId) {
        setStoredOp(op);
      }
    }
  }, [chain]);

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
          {storedOp && (
            <Stack spacing="4" boxShadow={"base"} borderRadius="2xl" p="8">
              <Stack spacing="2">
                <Text fontSize={"xl"} fontWeight="bold">
                  Pending Ops
                </Text>
                <Text fontSize={"xs"} color="gray.600">
                  * This tx can be sent by anyone safely.
                </Text>
                <Text fontSize={"xs"} color="gray.600">
                  * Manual tx is implemented for the demo.
                </Text>
              </Stack>
              <FormControl>
                <Text fontSize="xs">Amout: {storedOp.amount} ETH</Text>
                <Text fontSize="xs">Receiving Token: {storedOp.receivingToken}</Text>
              </FormControl>
              <Stack spacing="2">
                <Button w="full" onClick={sendOp} colorScheme="brand">
                  Execute
                </Button>
                <Button w="full" onClick={clear}>
                  Clear
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>
    </DefaultLayout>
  );
};

export default HomePage;
