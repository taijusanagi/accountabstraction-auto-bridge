import { Button, FormControl, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import WalletConnect from "@walletconnect/client";
import { NextPage } from "next";
import { useState } from "react";
import { useNetwork, useSigner } from "wagmi";

import { DefaultLayout } from "@/components/layouts/Default";
import { useAccountAbstraction } from "@/hooks/useAccountAbstraction";

export interface PeerMeta {
  name: string;
  url: string;
}

const HomePage: NextPage = () => {
  const network = useNetwork();
  const { data: signer } = useSigner();

  const [connector, setConnector] = useState<WalletConnect>();
  const { signAndSendTxWithBundler, contractWalletAddress } = useAccountAbstraction();

  const [walletConnectUri, setWalletConnectUri] = useState("");
  const [walletConnectMode, setWalletConnectMode] = useState<"notConnected" | "connecting" | "connected">(
    "notConnected"
  );
  const [peerMeta, setPeerMeta] = useState<PeerMeta>();

  const connectWalletConnect = async () => {
    const connector = new WalletConnect({
      uri: walletConnectUri,
    });

    setConnector(connector);
    if (!connector.connected) {
      console.log("walletconnect is not connected");
      await connector.createSession();
      console.log("now connected");
    } else {
      console.log("walletconnect is already connected");
      await connector.killSession();
      console.log("kill previous sesion");
      console.log("please try agein");
    }

    connector.on("session_request", (error, payload) => {
      console.log("session_request", payload);
      if (error) {
        throw error;
      }
      setPeerMeta(payload.params[0].peerMeta);
      setWalletConnectMode("connecting");
    });

    connector.on("call_request", async (error, payload) => {
      console.log("call_request", payload);
      if (error) {
        throw error;
      }
      if (payload.method === "eth_sendTransaction") {
        console.log("eth_sendTransaction");
        const tx = await signAndSendTxWithBundler(
          payload.params[0].to,
          payload.params[0].data,
          payload.params[0].value
        );
        const result = connector.approveRequest({
          id: payload.id,
          result: tx,
        });
        console.log("result", result);
      } else {
        throw Error("not implemented");
      }
    });

    connector.on("disconnect", (error, payload) => {
      console.log("disconnect", payload);
      if (error) {
        throw error;
      }
    });
  };

  const approveSession = () => {
    console.log("approveSession");
    if (!connector || !network.chain) {
      return;
    }
    connector.approveSession({ chainId: network.chain.id, accounts: [contractWalletAddress] });
    setWalletConnectMode("connected");
  };

  const rejectSession = () => {
    console.log("rejectSession");
    if (!connector) {
      return;
    }
    connector.rejectSession();
  };

  return (
    <DefaultLayout>
      <Stack spacing="8">
        <Stack spacing="4">
          <Text fontSize={"xl"} fontWeight="bold">
            ConnectApps
          </Text>
          {walletConnectMode === "notConnected" && (
            <Stack spacing="2">
              <FormControl>
                <FormLabel>Walelt Connect URL</FormLabel>
                <Input
                  type="text"
                  fontSize="xs"
                  value={walletConnectUri}
                  onChange={(e) => setWalletConnectUri(e.target.value)}
                />
              </FormControl>
              <Button w="full" onClick={connectWalletConnect} colorScheme="brand" isDisabled={!walletConnectUri}>
                Connect
              </Button>
            </Stack>
          )}
          {peerMeta && (
            <Stack spacing="2">
              <FormControl>
                <FormLabel fontSize="md" fontWeight="bold">
                  URL
                </FormLabel>
                <Text fontSize={"xs"}>{peerMeta.url}</Text>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="md" fontWeight="bold">
                  Name
                </FormLabel>
                <Text fontSize={"xs"}>{peerMeta.name}</Text>
              </FormControl>
            </Stack>
          )}
          {walletConnectMode === "connecting" && (
            <Stack spacing="2">
              <Button onClick={approveSession}>{"Approve"}</Button>
              <Button onClick={rejectSession}>{"Reject"}</Button>
            </Stack>
          )}
          {walletConnectMode === "connected" && (
            <Stack spacing="2">
              <FormControl>
                <FormLabel fontSize="md" fontWeight="bold">
                  Status
                </FormLabel>
                <Text fontSize={"xs"}>Connected</Text>
              </FormControl>
            </Stack>
          )}
        </Stack>
      </Stack>
    </DefaultLayout>
  );
};

export default HomePage;
