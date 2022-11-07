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

        let Flashloan;

        let Unitroller;

        let Unitroller_proxy;

        let SimplePriceOracle;
      
        let WhitePaperInterestRateModel;

        let tokenB;//UNI REC20

        let tokenA;//USDC REC20  

        let CErc20Delegate;     

        let CtokenBDelegator;

        let CtokenADelegator;
    ;

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

            ComptrollerG7 = await (await ethers.getContractFactory("ComptrollerG7")).deploy();

            Unitroller = await (await ethers.getContractFactory("Unitroller")).deploy();
      
            await Unitroller._setPendingImplementation(ComptrollerG7.address);

            await ComptrollerG7._become(Unitroller.address);

            Unitroller_proxy = (await ComptrollerG7.attach(
                Unitroller.address,
            ));



            SimplePriceOracle = await (await ethers.getContractFactory("SimplePriceOracle")).deploy();


            WhitePaperInterestRateModel = await (await ethers.getContractFactory("WhitePaperInterestRateModel")).deploy(0,0);
         

            tokenA = await ethers.getContractAt("ERC20Token", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");//usdc
            tokenB = await ethers.getContractAt("ERC20Token", "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984");//uni


            //log the Balance of signer 
            let thisAddressBalance = await tokenB.balanceOf(signerUNI._address);

            console.log("signerUNI UNI is : ", thisAddressBalance, signerUNI._address);

            thisAddressBalance = await tokenA.balanceOf(signerUSDC._address);

            console.log("signerUSDC USDC is : ", thisAddressBalance, signerUSDC._address);
            console.log("=================================================");


            CErc20Delegate = await (await ethers.getContractFactory("CErc20Delegate")).deploy();          

            CtokenBDelegator = await (await ethers.getContractFactory("CtokenBDelegator")).deploy(
               
                tokenB.address,
                Unitroller_proxy.address,
                WhitePaperInterestRateModel.address,
                BigNumber(e1).toString(),
                "UNI",
                "cUNI",
                18,
                User1.address,
                CErc20Delegate.address,
                "0x"
            );

            CtokenADelegator = await (await ethers.getContractFactory("CtokenADelegator")).deploy(
                
                tokenA.address,
                Unitroller_proxy.address,
                WhitePaperInterestRateModel.address,
                BigNumber(10 ** 6).toString(),
                "UDSC",
                "cUDSC",
                18,
                User1.address,
                CErc20Delegate.address,
                "0x"
            );
            console.log("depoly flashloan")
            Flashloan = await (await ethers.getContractFactory("Flashloan")).deploy();
            




            // console.log("set Unitroller_proxy _setPriceOracle=", SimplePriceOracle.address);
            await Unitroller_proxy._setPriceOracle(SimplePriceOracle.address);

            // console.log("set Unitroller_proxy ctokenB _supportMarket=", CtokenBDelegator.address);
            await Unitroller_proxy._supportMarket(CtokenBDelegator.address);

            // console.log("set Unitroller_proxy ctokenA _supportMarket=", CtokenADelegator.address);
            await Unitroller_proxy._supportMarket(CtokenADelegator.address);

            await Unitroller_proxy.connect(signerUNI).enterMarkets([CtokenBDelegator.address, CtokenADelegator.address]);
            await Unitroller_proxy.connect(signerUSDC).enterMarkets([CtokenBDelegator.address, CtokenADelegator.address]);
            await Unitroller_proxy.enterMarkets([CtokenBDelegator.address, CtokenADelegator.address]);

            console.log("set SimplePriceOracle tokenB setUnderlyingPrice=", CtokenBDelegator.address, ethers.utils.formatEther(BigNumber(e1 * 10).toString()));
            await SimplePriceOracle.setUnderlyingPrice(CtokenBDelegator.address, BigNumber(e1 * 10).toString());

            console.log("set SimplePriceOracle tokenA setUnderlyingPrice=", CtokenADelegator.address, ethers.utils.formatEther(BigNumber(e1).toString()));
            await SimplePriceOracle.setUnderlyingPrice(CtokenADelegator.address, ethers.utils.parseUnits("1", 30));

            console.log("set Unitroller_proxy CtokenA _setCollateralFactor=", CtokenADelegator.address, ethers.utils.formatEther(BigNumber(e1 / 2).toString()));
            await Unitroller_proxy._setCollateralFactor(CtokenADelegator.address, BigNumber(e1 / 2).toString());

            console.log("set Unitroller_proxy CtokenB _setCollateralFactor=", CtokenBDelegator.address, ethers.utils.formatEther(BigNumber(e1 / 2).toString()));
            await Unitroller_proxy._setCollateralFactor(CtokenBDelegator.address, BigNumber(e1 / 2).toString());

            console.log("set Unitroller_proxy  _setLiquidationIncentive=", ethers.utils.formatEther(BigNumber(e1 * 108 / 100).toString()));
            await Unitroller_proxy._setLiquidationIncentive(BigNumber(e1 * 108 / 100).toString());

            console.log("set Unitroller_proxy  _setCloseFactor=", ethers.utils.formatEther(BigNumber(e1 * 0.5).toString()));
            await Unitroller_proxy._setCloseFactor(BigNumber(e1 * 0.5).toString());



        });



        describe("Q6", () => {
            it("signerUSDC mint 10000 cUDSC", async () => {

                await tokenA.connect(signerUSDC).approve(CtokenADelegator.address, ethers.utils.parseUnits("100000", 6));
                console.log("--------------------------------------------------------------------");
                console.log("signerUSDC      mint CtokenA:", 10000);
                await CtokenADelegator.connect(signerUSDC).mint(ethers.utils.parseUnits("10000", 6));
                const signerUSDC_ctokenA = ethers.utils.formatEther(await CtokenADelegator.balanceOf(signerUSDC._address), 6);
                expect(signerUSDC_ctokenA).to.equal("10000.0");

            });

            it("signerUNI mint 1000 cUNI", async () => {

                await tokenB.connect(signerUNI).approve(CtokenBDelegator.address, ethers.utils.parseUnits("10000", 18));
                console.log("--------------------------------------------------------------------");
                console.log("signerUNI      mint CtokenB:", 1000);
                await CtokenBDelegator.connect(signerUNI).mint(ethers.utils.parseUnits("1000", 18));
                const signerUNI_ctokenB = ethers.utils.formatEther(await CtokenBDelegator.balanceOf(signerUNI._address));
                expect(signerUNI_ctokenB).to.equal("1000.0");

            });

            it("signerUNI borrow 5000 USDC", async () => {

                console.log("--------------------------------------------------------------------");
                console.log("signerUNI      borrow tokenA:", 5000);
                const signerUNI_tokenA_bf = await tokenA.balanceOf(signerUNI._address);
                await CtokenADelegator.connect(signerUNI).borrow(ethers.utils.parseUnits("5000", 6));
                const signerUNI_tokenA = await tokenA.balanceOf(signerUNI._address) - signerUNI_tokenA_bf;
                expect(signerUNI_tokenA).to.equal(ethers.utils.parseUnits("5000", 6));

            });

            it("set UNI price 6.2", async () => {

                console.log("--------------------------------------------------------------------");
                await SimplePriceOracle.setUnderlyingPrice(CtokenBDelegator.address, ethers.utils.parseUnits("62", 17));
                console.log("set UNI price 6.2");
                const UNIprice = ethers.utils.formatEther(await SimplePriceOracle.getUnderlyingPrice(CtokenBDelegator.address));
                expect(UNIprice).to.equal("6.2");

            });

            // it("signerUSDC can liquidateBorrow signerUNI", async () => {


            //     // console.log("--------------------------------------------------------------------");
            //     await CtokenADelegator.connect(signerUSDC).liquidateBorrow(signerUNI._address, ethers.utils.parseUnits("2500",6), CtokenBDelegator.address);

            //     console.log("signerUSDC liquidateBorrow 2500 USDC of signerUNI");

            //     console.log("signerUSDC  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator.balanceOf(signerUSDC._address)));
            //     console.log("signerUNI  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator.balanceOf(signerUNI._address)));
            //     // const UNIprice =ethers.utils.formatEther( await SimplePriceOracle.getUnderlyingPrice(CtokenBDelegator.address));
            //     // expect(UNIprice).to.equal("6.2");

            // });

            it("signerUSDC can liquidateBorrow signerUNI use Flashloan", async () => {

                await CtokenADelegator.connect(signerUSDC).approve(Flashloan.address, ethers.utils.parseUnits("100000", 18));
                await tokenA.connect(signerUSDC).approve(Flashloan.address, ethers.utils.parseUnits("100000", 6));
                await CtokenBDelegator.connect(signerUSDC).approve(Flashloan.address, ethers.utils.parseUnits("100000", 18));
                console.log("--------------------------------------------------------------------");
                console.log("signerUSDC liquidateBorrow 2500 USDC of signerUNI");
                await Flashloan.connect(signerUSDC).UseAAVEtoliquidate
                    (
                        signerUNI._address,
                        CtokenBDelegator.address,
                        CtokenBDelegator.address,
                        CtokenADelegator.address,
                        [tokenA.address],
                        [ethers.utils.parseUnits("2500", 6)],
                        [0]

                    );

                console.log("signerUSDC  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator.balanceOf(signerUSDC._address)));
                console.log("signerUNI  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator.balanceOf(signerUNI._address)));
                console.log("FlashLoanContract USDC balanceOf", await tokenA.balanceOf(Flashloan.address));


            });

        });

    }
);
