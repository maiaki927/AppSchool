const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("bignumber.js");

describe("ComptrollerG7.sol",
    () => {

        const e1 = 10 ** 18;
      

        let User1;
        let User2;
        const UNImockAddress = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
        const USDCmockAddress = "0xa205fD7344656c72FDC645b72fAF5a3DE0B3E825";
        let ComptrollerG7;
        let ComptrollerG7_contract;

        let Flashloan;
        let Flashloan_contract;

        let Unitroller;
        let Unitroller_contract;

        let SimplePriceOracle;
        let SimplePriceOracle_contract;

        let WhitePaperInterestRateModel;
        let WhitePaperInterestRateModel_contract;

        let tokenB;//tokenA REC20
        let tokenB_contract;

        let tokenA;//tokenB REC20
        let tokenA_contract;

        let CErc20Delegate;
        let CErc20Delegate_contract;

        let CtokenBDelegator;
        let CtokenBDelegator_contract;

        let CtokenADelegator;
        let CtokenADelegator_contract;

        before(async () => {
            [User1, User2] = await ethers.getSigners();

            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [UNImockAddress],
            });
            signerUNI = await ethers.provider.getSigner(UNImockAddress);//有uni的大戶


            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [USDCmockAddress],
            });
            signerUSDC = await ethers.provider.getSigner(USDCmockAddress);//有USDC的大戶

            ComptrollerG7 = await ethers.getContractFactory("ComptrollerG7");
            ComptrollerG7_contract = await ComptrollerG7.deploy();

            Unitroller = await ethers.getContractFactory("Unitroller");
            Unitroller_contract = await Unitroller.deploy();

            SimplePriceOracle = await ethers.getContractFactory("SimplePriceOracle");
            SimplePriceOracle_contract = await SimplePriceOracle.deploy();

            WhitePaperInterestRateModel = await ethers.getContractFactory("WhitePaperInterestRateModel");
            WhitePaperInterestRateModel_contract = await WhitePaperInterestRateModel.deploy(0, 0);

            tokenA = await ethers.getContractAt("ERC20Token", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");//usdc
            tokenB = await ethers.getContractAt("ERC20Token", "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984");//uni

            let thisAddressBalance = await tokenB.balanceOf(signerUNI._address);

            console.log("signerUNI UNI is : ", thisAddressBalance, signerUNI._address);

            thisAddressBalance = await tokenA.balanceOf(signerUSDC._address);

            console.log("signerUSDC USDC is : ", thisAddressBalance, signerUSDC._address);
            console.log("=================================================");


            CErc20Delegate = await ethers.getContractFactory("CErc20Delegate");
            CErc20Delegate_contract = await CErc20Delegate.deploy();



            CtokenBDelegator = await ethers.getContractFactory("CErc20Delegator");
            CtokenBDelegator_contract = await CtokenBDelegator.deploy(
                tokenB.address,
                ComptrollerG7_contract.address,
                WhitePaperInterestRateModel_contract.address,
                BigNumber(e1).toString(),
                "UNI",
                "cUNI",
                18,
                User1.address,
                CErc20Delegate_contract.address,
                "0x"
            );

            CtokenADelegator = await ethers.getContractFactory("CErc20Delegator");
            CtokenADelegator_contract = await CtokenADelegator.deploy(
                tokenA.address,
                ComptrollerG7_contract.address,
                WhitePaperInterestRateModel_contract.address,
                BigNumber(10 ** 6).toString(),
                "UDSC",
                "cUDSC",
                18,
                User1.address,
                CErc20Delegate_contract.address,
                "0x"
            );
            console.log("depoly flashloan")
            Flashloan = await ethers.getContractFactory("Useflashloan");
            Flashloan_contract = await Flashloan.deploy();


            // console.log("set Unitroller _setPendingImplementation=", ComptrollerG7_contract.address);
            await Unitroller_contract._setPendingImplementation(ComptrollerG7_contract.address);

            // console.log("set ComptrollerG7 _become=", Unitroller_contract.address);
            await ComptrollerG7_contract._become(Unitroller_contract.address);

            // console.log("set ComptrollerG7 _setPriceOracle=", SimplePriceOracle_contract.address);
            await ComptrollerG7_contract._setPriceOracle(SimplePriceOracle_contract.address);

            // console.log("set ComptrollerG7 ctokenB _supportMarket=", CtokenBDelegator_contract.address);
            await ComptrollerG7_contract._supportMarket(CtokenBDelegator_contract.address);

            // console.log("set ComptrollerG7 ctokenA _supportMarket=", CtokenADelegator_contract.address);
            await ComptrollerG7_contract._supportMarket(CtokenADelegator_contract.address);

            // console.log("set ComptrollerG7 ctokenB CtokenA enterMarkets=", [CtokenBDelegator_contract.address,CtokenADelegator_contract.address]);
            await ComptrollerG7_contract.connect(signerUNI).enterMarkets([CtokenBDelegator_contract.address, CtokenADelegator_contract.address]);
            await ComptrollerG7_contract.connect(signerUSDC).enterMarkets([CtokenBDelegator_contract.address, CtokenADelegator_contract.address]);
            await ComptrollerG7_contract.enterMarkets([CtokenBDelegator_contract.address, CtokenADelegator_contract.address]);

            console.log("set SimplePriceOracle tokenB setUnderlyingPrice=", CtokenBDelegator_contract.address, ethers.utils.formatEther(BigNumber(e1 * 10).toString()));
            await SimplePriceOracle_contract.setUnderlyingPrice(CtokenBDelegator_contract.address, BigNumber(e1 * 10).toString());

            console.log("set SimplePriceOracle tokenA setUnderlyingPrice=", CtokenADelegator_contract.address, ethers.utils.formatEther(BigNumber(e1).toString()));
            await SimplePriceOracle_contract.setUnderlyingPrice(CtokenADelegator_contract.address, ethers.utils.parseUnits("1", 30));

            console.log("set ComptrollerG7 CtokenA _setCollateralFactor=", CtokenADelegator_contract.address, ethers.utils.formatEther(BigNumber(e1 / 2).toString()));
            await ComptrollerG7_contract._setCollateralFactor(CtokenADelegator_contract.address, BigNumber(e1 / 2).toString());

            console.log("set ComptrollerG7 CtokenB _setCollateralFactor=", CtokenBDelegator_contract.address, ethers.utils.formatEther(BigNumber(e1 / 2).toString()));
            await ComptrollerG7_contract._setCollateralFactor(CtokenBDelegator_contract.address, BigNumber(e1 / 2).toString());

            console.log("set ComptrollerG7  _setLiquidationIncentive=", ethers.utils.formatEther(BigNumber(e1 * 108 / 100).toString()));
            await ComptrollerG7_contract._setLiquidationIncentive(BigNumber(e1 * 108 / 100).toString());

            console.log("set ComptrollerG7  _setCloseFactor=", ethers.utils.formatEther(BigNumber(e1 * 0.5).toString()));
            await ComptrollerG7_contract._setCloseFactor(BigNumber(e1 * 0.5).toString());



        });



        describe("Q6", () => {
            it("signerUSDC mint 10000 cUDSC", async () => {

                await tokenA.connect(signerUSDC).approve(CtokenADelegator_contract.address, ethers.utils.parseUnits("100000", 6));
                console.log("--------------------------------------------------------------------");
                console.log("signerUSDC      mint CtokenA:", 10000);
                await CtokenADelegator_contract.connect(signerUSDC).mint(ethers.utils.parseUnits("10000", 6));
                const signerUSDC_ctokenA = ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(signerUSDC._address), 6);
                expect(signerUSDC_ctokenA).to.equal("10000.0");

            });

            it("signerUNI mint 1000 cUNI", async () => {

                await tokenB.connect(signerUNI).approve(CtokenBDelegator_contract.address, ethers.utils.parseUnits("10000", 18));
                console.log("--------------------------------------------------------------------");
                console.log("signerUNI      mint CtokenB:", 1000);
                await CtokenBDelegator_contract.connect(signerUNI).mint(ethers.utils.parseUnits("1000", 18));
                const signerUNI_ctokenB = ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(signerUNI._address));
                expect(signerUNI_ctokenB).to.equal("1000.0");

            });

            it("signerUNI borrow 5000 USDC", async () => {

                console.log("--------------------------------------------------------------------");
                console.log("signerUNI      borrow tokenA:", 5000);
                const signerUNI_tokenA_bf = await tokenA.balanceOf(signerUNI._address);
                await CtokenADelegator_contract.connect(signerUNI).borrow(ethers.utils.parseUnits("5000", 6));
                const signerUNI_tokenA = await tokenA.balanceOf(signerUNI._address) - signerUNI_tokenA_bf;
                expect(signerUNI_tokenA).to.equal(ethers.utils.parseUnits("5000", 6));

            });

            it("set UNI price 6.2", async () => {

                console.log("--------------------------------------------------------------------");
                await SimplePriceOracle_contract.setUnderlyingPrice(CtokenBDelegator_contract.address, ethers.utils.parseUnits("62", 17));
                console.log("set UNI price 6.2");
                const UNIprice = ethers.utils.formatEther(await SimplePriceOracle_contract.getUnderlyingPrice(CtokenBDelegator_contract.address));
                expect(UNIprice).to.equal("6.2");

            });

            // it("signerUSDC can liquidateBorrow signerUNI", async () => {


            //     // console.log("--------------------------------------------------------------------");
            //     await CtokenADelegator_contract.connect(signerUSDC).liquidateBorrow(signerUNI._address, ethers.utils.parseUnits("2500",6), CtokenBDelegator_contract.address);

            //     console.log("signerUSDC liquidateBorrow 2500 USDC of signerUNI");

            //     console.log("signerUSDC  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(signerUSDC._address)));
            //     console.log("signerUNI  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(signerUNI._address)));
            //     // const UNIprice =ethers.utils.formatEther( await SimplePriceOracle_contract.getUnderlyingPrice(CtokenBDelegator_contract.address));
            //     // expect(UNIprice).to.equal("6.2");

            // });

            it("signerUSDC can liquidateBorrow signerUNI use Flashloan", async () => {

                await CtokenADelegator_contract.connect(signerUSDC).approve(Flashloan_contract.address, ethers.utils.parseUnits("100000", 18));
                await tokenA.connect(signerUSDC).approve(Flashloan_contract.address, ethers.utils.parseUnits("100000", 6));
                await CtokenBDelegator_contract.connect(signerUSDC).approve(Flashloan_contract.address, ethers.utils.parseUnits("100000", 18));
                console.log("--------------------------------------------------------------------");
                console.log("signerUSDC liquidateBorrow 2500 USDC of signerUNI");
                await Flashloan_contract.connect(signerUSDC).UseAAVEtoliquidate
                    (
                        signerUNI._address,
                        CtokenBDelegator_contract.address,
                        CtokenBDelegator_contract.address,
                        CtokenADelegator_contract.address,
                        [tokenA.address],
                        [ethers.utils.parseUnits("2500", 6)],
                        [0]

                    );

                console.log("signerUSDC  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(signerUSDC._address)));
                console.log("signerUNI  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(signerUNI._address)));
                console.log("FlashLoanContract USDC balanceOf", await tokenA.balanceOf(Flashloan_contract.address));


            });

        });

    }
);