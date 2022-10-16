/* eslint-disable camelcase */

/**
 ** This copied from @account-abstraction/sdk
 **/
import { EntryPoint, EntryPoint__factory, UserOperationStruct } from "@account-abstraction/contracts";
import { SimpleWalletAPI } from "@account-abstraction/sdk";
import { rethrowError } from "@account-abstraction/utils";
import { SampleRecipient, SampleRecipient__factory } from "@account-abstraction/utils/dist/src/types";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, constants } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { AccountAbstractionWalletAPI } from "../lib/AccountAbstractionWalletAPI";
import { DeterministicDeployer } from "../lib/infinitism/DeterministicDeployer";
import {
  AccountAbstractionWalletDeployer__factory,
  INonfungiblePositionManager__factory,
  ISwapRouter__factory,
  IUniswapV3Factory__factory,
  IWETH9__factory,
} from "../typechain-types";
import {
  encodePriceSqrt,
  expandTo18Decimals,
  FeeAmount,
  getMaxTick,
  getMinTick,
  TICK_SPACINGS,
} from "./helper/uniswap";

// https://docs.uniswap.org/protocol/reference/deployments
// this is used hardhat test on goerli fork
const uniswapSwapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const uniswapV3FactoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const wethAddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
const nonfungiblePositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

const provider = ethers.provider;

describe("AccountAbstractionWallet", () => {
  // for account abstraction
  let signer: SignerWithAddress;
  let owner: SignerWithAddress;
  let api: SimpleWalletAPI;
  let entryPoint: EntryPoint;
  let beneficiary: string;
  let recipient: SampleRecipient;
  let factoryAddress: string;
  let walletAddress: string;
  let walletDeployed = false;

  // for uniswap
  let wallet: SignerWithAddress;
  let trader: SignerWithAddress;

  before("init", async () => {
    [signer, owner, wallet, trader] = await ethers.getSigners();
    entryPoint = await new EntryPoint__factory(signer).deploy(1, 1);
    beneficiary = await signer.getAddress();
    recipient = await new SampleRecipient__factory(signer).deploy();
    factoryAddress = await DeterministicDeployer.deploy(AccountAbstractionWalletDeployer__factory.bytecode);
    api = new AccountAbstractionWalletAPI({
      provider,
      entryPointAddress: entryPoint.address,
      owner,
      factoryAddress,
    });
  });

  describe("Account Abstraction", () => {
    it("#getRequestId should match entryPoint.getRequestId", async function () {
      const userOp: UserOperationStruct = {
        sender: "0x".padEnd(42, "1"),
        nonce: 2,
        initCode: "0x3333",
        callData: "0x4444",
        callGasLimit: 5,
        verificationGasLimit: 6,
        preVerificationGas: 7,
        maxFeePerGas: 8,
        maxPriorityFeePerGas: 9,
        paymasterAndData: "0xaaaaaa",
        signature: "0xbbbb",
      };
      const hash = await api.getRequestId(userOp);
      const epHash = await entryPoint.getRequestId(userOp);
      expect(hash).to.equal(epHash);
    });

    it("should deploy to counterfactual address", async () => {
      walletAddress = await api.getWalletAddress();
      expect(await provider.getCode(walletAddress).then((code) => code.length)).to.equal(2);
      await signer.sendTransaction({
        to: walletAddress,
        value: parseEther("0.1"),
      });
      const op = await api.createSignedUserOp({
        target: recipient.address,
        data: recipient.interface.encodeFunctionData("something", ["hello"]),
      });
      await expect(entryPoint.handleOps([op], beneficiary))
        .to.emit(recipient, "Sender")
        .withArgs(anyValue, walletAddress, "hello");
      expect(await provider.getCode(walletAddress).then((code) => code.length)).to.greaterThan(1000);
      walletDeployed = true;
    });

    context("#rethrowError", () => {
      let userOp: UserOperationStruct;
      before(async () => {
        userOp = await api.createUnsignedUserOp({
          target: ethers.constants.AddressZero,
          data: "0x",
        });
        // expect FailedOp "invalid signature length"
        userOp.signature = "0x11";
      });
      it.skip("should parse FailedOp error", async () => {
        await expect(entryPoint.handleOps([userOp], beneficiary).catch(rethrowError)).to.revertedWith(
          "FailedOp: ECDSA: invalid signature length"
        );
      });
      it("should parse Error(message) error", async () => {
        await expect(entryPoint.addStake(0)).to.revertedWith("unstake delay too low");
      });
      it("should parse revert with no description", async () => {
        // use wrong signature for contract..
        const wrongContract = entryPoint.attach(recipient.address);
        await expect(wrongContract.addStake(0)).to.revertedWithoutReason();
      });
    });

    it("should use wallet API after creation without a factory", async function () {
      if (!walletDeployed) {
        this.skip();
      }
      const api1 = new SimpleWalletAPI({
        provider,
        entryPointAddress: entryPoint.address,
        walletAddress,
        owner,
      });
      const op1 = await api1.createSignedUserOp({
        target: recipient.address,
        data: recipient.interface.encodeFunctionData("something", ["world"]),
      });
      await expect(entryPoint.handleOps([op1], beneficiary))
        .to.emit(recipient, "Sender")
        .withArgs(anyValue, walletAddress, "world");
    });

    describe("Additional testing", () => {
      it("getCreate2Address in factory", async function () {
        // current sdk is not working for the deployed contract
        // so adding workaround to calculate contract address
        const factory = AccountAbstractionWalletDeployer__factory.connect(factoryAddress, provider);
        const salt = 0;
        const calculatedAddress = await factory.getCreate2Address(entryPoint.address, owner.address, salt);
        expect(walletAddress).to.eq(calculatedAddress);
      });

      it("integrating with uniswap", async function () {
        // AA wallet needs to make userOp with Uniswap swapRouter
        const swapRouter = ISwapRouter__factory.connect(uniswapSwapRouterAddress, signer);
        const v3Factory = IUniswapV3Factory__factory.connect(uniswapV3FactoryAddress, signer);
        const nft = INonfungiblePositionManager__factory.connect(nonfungiblePositionManager, signer);
        const weth9 = IWETH9__factory.connect(wethAddress, signer);
        // deploy test erc20
        const TestERC20 = await ethers.getContractFactory("TestERC20");
        const tokens = await Promise.all([
          TestERC20.deploy(constants.MaxUint256.div(2)), // do not use maxu256 to avoid overflowing
        ]);
        for (const token of tokens) {
          await Promise.all([
            token.approve(swapRouter.address, constants.MaxUint256),
            token.approve(nft.address, constants.MaxUint256),
            token.connect(trader).approve(swapRouter.address, constants.MaxUint256),
            token.transfer(trader.address, expandTo18Decimals(1_000_000)),
          ]);
        }
        // // assuming this is usdc
        const [usdc] = tokens;
        // create pair
        let tokenAddressA = weth9.address;
        let tokenAddressB = usdc.address;
        if (tokenAddressA.toLowerCase() > tokenAddressB.toLowerCase())
          [tokenAddressA, tokenAddressB] = [tokenAddressB, tokenAddressA];
        await nft.createAndInitializePoolIfNecessary(
          tokenAddressA,
          tokenAddressB,
          FeeAmount.MEDIUM,
          encodePriceSqrt(1, 1)
        );
        const liquidityParams = {
          token0: tokenAddressA,
          token1: tokenAddressB,
          fee: FeeAmount.MEDIUM,
          tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
          tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
          recipient: wallet.address,
          amount0Desired: 1000000,
          amount1Desired: 1000000,
          amount0Min: 0,
          amount1Min: 0,
          deadline: 1,
        };
        await nft.mint(liquidityParams);
        // const tokenIn = weth9.address;
        // const tokenOut = usdc.address;
        // const amountIn = 3;
        // const amountOutMinimum = 1;
        // // copy test for exactInputSingle from Uniswap
        // // https://github.com/Uniswap/v3-periphery/blob/464a8a49611272f7349c970e0fadb7ec1d3c1086/test/SwapRouter.spec.ts#L364
        // const inputIsWETH = weth9.address === tokenIn;
        // const outputIsWETH9 = tokenOut === weth9.address;
        // const value = inputIsWETH ? amountIn : 0;
        // const params = {
        //   tokenIn,
        //   tokenOut,
        //   fee: FeeAmount.MEDIUM,
        //   sqrtPriceLimitX96:
        //     tokenIn.toLowerCase() < tokenOut.toLowerCase()
        //       ? BigNumber.from("4295128740")
        //       : BigNumber.from("1461446703485210103287273052203988822378723970341"),
        //   recipient: outputIsWETH9 ? constants.AddressZero : trader.address,
        //   deadline: 1,
        //   amountIn: 1,
        //   amountOutMinimum: 1,
        // };
        // swapRouter.sw;
      });
    });
  });
});
