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
import { Token } from "@uniswap/sdk-core";
import { abi as IUniswapV3PoolABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { AccountAbstractionWalletAPI } from "../lib/AccountAbstractionWalletAPI";
import { daiInGoerli, mockUSDCRate, usdcInGoerli } from "../lib/data";
import { DeterministicDeployer } from "../lib/infinitism/DeterministicDeployer";
import {
  AccountAbstractionWalletDeployer__factory,
  IMockERC20__factory,
  INonfungiblePositionManager__factory,
  ISwapRouter__factory,
  IUniswapV3Factory__factory,
  MockSwap__factory,
} from "../typechain-types";
import { FeeAmount, getMaxTick, getMinTick, TICK_SPACINGS } from "./helper/uniswap";

const provider = ethers.provider;

// for uniswap integration
const uniswapSwapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const uniswapV3FactoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const nonfungiblePositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

// https://github.com/hop-protocol/contracts/blob/master/config/constants.ts#L163
const usdcAddress = usdcInGoerli;
const daiAddress = daiInGoerli;

interface Immutables {
  factory: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  maxLiquidityPerTick: BigNumber;
}

interface State {
  liquidity: BigNumber;
  sqrtPriceX96: BigNumber;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
}

describe("AccountAbstractionWallet", () => {
  let signer: SignerWithAddress;
  let owner: SignerWithAddress;

  let api: AccountAbstractionWalletAPI;
  let entryPoint: EntryPoint;
  let beneficiary: string;
  let recipient: SampleRecipient;
  let factoryAddress: string;
  let walletAddress: string;
  let walletDeployed = false;

  before("init", async () => {
    [signer, owner] = await ethers.getSigners();
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
      it("should parse FailedOp error", async () => {
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
        const factory = AccountAbstractionWalletDeployer__factory.connect(factoryAddress, provider);
        const salt = 0;
        const calculatedAddress = await factory.getCreate2Address(entryPoint.address, owner.address, salt);
        expect(walletAddress).to.eq(calculatedAddress);
      });

      it("integrating with uniswap", async function () {
        const swapRouter = ISwapRouter__factory.connect(uniswapSwapRouterAddress, signer);
        const v3Factory = IUniswapV3Factory__factory.connect(uniswapV3FactoryAddress, signer);
        const usdc = IMockERC20__factory.connect(usdcAddress, signer);
        const dai = IMockERC20__factory.connect(daiAddress, signer);
        const nft = INonfungiblePositionManager__factory.connect(nonfungiblePositionManager, signer);

        const poolFee = 3000;

        const usdcMintAmmount = "1000000000000"; // 1000000 USDC (decimals = 6)
        await usdc.mint(signer.address, usdcMintAmmount);

        const daiMintAmmount = "1000000000000000000000000"; // 1000000 DAI (decimals = 18)
        await dai.mint(signer.address, daiMintAmmount);

        await v3Factory
          .createPool(usdcAddress, daiAddress, FeeAmount.MEDIUM)
          .catch(() => console.log("pool already created"));

        const poolAddress = await v3Factory.getPool(usdcAddress, daiAddress, poolFee);
        const poolContract = new ethers.Contract(poolAddress, IUniswapV3PoolABI, signer);
        const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] = await Promise.all([
          poolContract.factory(),
          poolContract.token0(),
          poolContract.token1(),
          poolContract.fee(),
          poolContract.tickSpacing(),
          poolContract.maxLiquidityPerTick(),
        ]);

        const immutables: Immutables = {
          factory,
          token0,
          token1,
          fee,
          tickSpacing,
          maxLiquidityPerTick,
        };

        const [liquidity, slot] = await Promise.all([poolContract.liquidity(), poolContract.slot0()]);

        const state: State = {
          liquidity,
          sqrtPriceX96: slot[0],
          tick: slot[1],
          observationIndex: slot[2],
          observationCardinality: slot[3],
          observationCardinalityNext: slot[4],
          feeProtocol: slot[5],
          unlocked: slot[6],
        };

        // console.log(immutables);
        // console.log(state);

        const USDC = new Token(3, usdcAddress, 6, "USDC", "USD Coin");
        const DAI = new Token(3, daiAddress, 18, "DAI", "Dai Stablecoin");

        // this is not working
        // const USDC_DAI_POOL = new Pool(
        //   USDC,
        //   DAI,
        //   immutables.fee,
        //   state.sqrtPriceX96.toString(),
        //   state.liquidity.toString(),
        //   state.tick
        // );

        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNumber);
        // console.log(block);

        const liquidityParams = {
          token0: usdcAddress,
          token1: daiAddress,
          fee: FeeAmount.MEDIUM,
          tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
          tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
          recipient: signer.address,
          amount0Desired: 1000000,
          amount1Desired: 1000000,
          amount0Min: 0,
          amount1Min: 0,
          deadline: blockNumber + 10000,
        };

        // this is not working
        // await nft.mint(liquidityParams);
      });

      it("integrate with mock swap", async function () {
        const MockSwap = await ethers.getContractFactory("MockSwap");
        const mockSwap = await MockSwap.deploy(usdcInGoerli, mockUSDCRate);
        const amountIn = 100;
        const amountOut = await mockSwap.getOutputAmount(amountIn);
        const usdc = IMockERC20__factory.connect(usdcInGoerli, signer);
        const previouBalance = await usdc.balanceOf(signer.address);
        await mockSwap.swap({ value: amountIn });
        const currentBalance = await usdc.balanceOf(signer.address);
        expect(currentBalance).to.eq(previouBalance.add(amountOut));
      });

      it("integrate with mock swap with aa", async function () {
        const MockSwap = await ethers.getContractFactory("MockSwap");
        const mockSwap = await MockSwap.deploy(usdcInGoerli, mockUSDCRate);
        const amountIn = 100;
        const amountOut = await mockSwap.getOutputAmount(amountIn);
        const usdc = IMockERC20__factory.connect(usdcInGoerli, signer);
        const previouBalance = await usdc.balanceOf(walletAddress);
        const op = await api.createSignedUserOp({
          target: mockSwap.address,
          data: mockSwap.interface.encodeFunctionData("swap"),
          value: amountIn,
        });
        await entryPoint.handleOps([op], beneficiary);
        const currentBalance = await usdc.balanceOf(walletAddress);
        expect(currentBalance).to.eq(previouBalance.add(amountOut));
      });
    });
  });
});
