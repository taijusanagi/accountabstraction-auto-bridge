import { Box, Button, ButtonGroup, Center, Container, Flex, HStack, Text } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/router";
import React, { useMemo } from "react";

export interface DefaultLayoutProps {
  children: React.ReactNode;
}

export const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  // ========== Nextjs ===========
  const router = useRouter();

  // ========== Memo ===========
  const currentPathBase = useMemo(() => {
    return router.asPath.split("/")[1];
  }, [router]);

  // ========== OnClick ===========
  const onClickAccount = () => {
    router.push("/");
  };

  const onClickConnect = () => {
    router.push("/connect");
  };

  const onClickBridge = () => {
    router.push("/bridge");
  };

  // ========== Style ===========
  const inActiveProps = {
    bgColor: "white",
    _hover: {
      bgColor: "gray.50",
    },
    _active: {
      bgColor: "gray.100",
    },
  };

  const activeProps = {
    bgColor: "gray.100",
    _hover: {},
    _active: {},
  };

  const homeButtonProps = currentPathBase === "" ? activeProps : inActiveProps;
  const connectButtonProps = currentPathBase === "connect" ? activeProps : inActiveProps;
  const bridgeButtonProps = currentPathBase === "bridge" ? activeProps : inActiveProps;

  return (
    <Flex minHeight={"100vh"} direction={"column"}>
      <Container as="section" maxW="8xl" mb="8">
        <Box as="nav" py="4">
          <Center my="4" position={"absolute"} right="0" left="0" top={"16"} h="8">
            <ButtonGroup bgColor={"white"} py="1" px="1" rounded="xl" shadow="md" size="xs">
              <Button onClick={onClickAccount} {...homeButtonProps}>
                Account
              </Button>
              <Button onClick={onClickConnect} {...connectButtonProps}>
                Connect
              </Button>
              <Button onClick={onClickBridge} {...bridgeButtonProps}>
                Bridge
              </Button>
            </ButtonGroup>
          </Center>
          <Flex justify="space-between" alignItems={"center"} h="8">
            <Text fontSize="lg" fontWeight={"bold"}>
              AA Auto Bridge
            </Text>
            <HStack>
              <ConnectButton accountStatus={"avatar"} showBalance={false} chainStatus={"name"} />
            </HStack>
          </Flex>
        </Box>
      </Container>
      <Container maxW="2xl" py="12">
        <Box py="8" px="8" boxShadow={"base"} borderRadius="2xl" bgColor={"white"}>
          {children}
        </Box>
      </Container>
    </Flex>
  );
};
