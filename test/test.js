const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("bignumber.js");

describe("ComptrollerG7.sol",
    () => {

        const e1 = 10 ** 18;
        const e100 = e1 * 100;

        let User1;
        let User2;
        let ComptrollerG7;
        let ComptrollerG7_contract;

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

        beforeEach(async () => {
            [User1, User2] = await ethers.getSigners();


            ComptrollerG7 = await ethers.getContractFactory("ComptrollerG7");
            ComptrollerG7_contract = await ComptrollerG7.deploy();

            Unitroller = await ethers.getContractFactory("Unitroller");
            Unitroller_contract = await Unitroller.deploy();

            SimplePriceOracle = await ethers.getContractFactory("SimplePriceOracle");
            SimplePriceOracle_contract = await SimplePriceOracle.deploy();

            WhitePaperInterestRateModel = await ethers.getContractFactory("WhitePaperInterestRateModel");
            WhitePaperInterestRateModel_contract = await WhitePaperInterestRateModel.deploy(0, 0);

            tokenB = await ethers.getContractFactory("ERC20Token");
            tokenB_contract = await tokenB.deploy("tokenB", "tokenB");

            tokenA = await ethers.getContractFactory("ERC20Token");
            tokenA_contract = await tokenA.deploy("tokenA", "tokenA");


            CErc20Delegate = await ethers.getContractFactory("CErc20Delegate");
            CErc20Delegate_contract = await CErc20Delegate.deploy();



            CtokenBDelegator = await ethers.getContractFactory("CErc20Delegator");
            CtokenBDelegator_contract = await CtokenBDelegator.deploy(
                tokenB_contract.address,
                ComptrollerG7_contract.address,
                WhitePaperInterestRateModel_contract.address,
                BigNumber(e1).toString(),
                "tokenB",
                "ctokenB",
                18,
                User1.address,
                CErc20Delegate_contract.address,
                "0x"
            );

            CtokenADelegator = await ethers.getContractFactory("CErc20Delegator");
            CtokenADelegator_contract = await CtokenADelegator.deploy(
                tokenA_contract.address,
                ComptrollerG7_contract.address,
                WhitePaperInterestRateModel_contract.address,
                BigNumber(e1).toString(),
                "tokenA",
                "ctokenA",
                18,
                User1.address,
                CErc20Delegate_contract.address,
                "0x"
            );



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
            await ComptrollerG7_contract.enterMarkets([CtokenBDelegator_contract.address, CtokenADelegator_contract.address]);

            console.log("set SimplePriceOracle tokenB setUnderlyingPrice=", CtokenBDelegator_contract.address, ethers.utils.formatEther(BigNumber(e100).toString()));
            await SimplePriceOracle_contract.setUnderlyingPrice(CtokenBDelegator_contract.address, BigNumber(e100).toString());

            console.log("set SimplePriceOracle tokenA setUnderlyingPrice=", CtokenBDelegator_contract.address, ethers.utils.formatEther(BigNumber(e1).toString()));
            await SimplePriceOracle_contract.setUnderlyingPrice(CtokenADelegator_contract.address, BigNumber(e1).toString());

            console.log("set ComptrollerG7 CtokenA _setCollateralFactor=", CtokenADelegator_contract.address, ethers.utils.formatEther(BigNumber(e1 / 2).toString()));
            await ComptrollerG7_contract._setCollateralFactor(CtokenADelegator_contract.address, BigNumber(e1 / 2).toString());

            console.log("set ComptrollerG7 CtokenB _setCollateralFactor=", CtokenBDelegator_contract.address, ethers.utils.formatEther(BigNumber(e1 / 2).toString()));
            await ComptrollerG7_contract._setCollateralFactor(CtokenBDelegator_contract.address, BigNumber(e1 / 2).toString());

            console.log("set ComptrollerG7  _setLiquidationIncentive=", ethers.utils.formatEther(BigNumber(e1 * 108 / 100).toString()));
            await ComptrollerG7_contract._setLiquidationIncentive(BigNumber(e1 * 108 / 100).toString());

            console.log("set ComptrollerG7  _setCloseFactor=", ethers.utils.formatEther(BigNumber(e1 * 0.5).toString()));
            await ComptrollerG7_contract._setCloseFactor(BigNumber(e1 * 0.5).toString());

            console.log("set CtokenBDelegator _setReserveFactor=", ethers.utils.formatEther(BigNumber(e1).toString()));
            await CtokenBDelegator_contract._setReserveFactor(BigNumber(e1).toString());

            User1Address = await User1.getAddress();
        });



        describe("Q1 to Q5", () => {
            it("should mint/redeem ok", async () => {
                await tokenB_contract.mint(User1.address, BigNumber(e100).toString());
                const User1_tokenB = await tokenB_contract.balanceOf(User1.address)
                console.log("User1  tokenB balanceOf:", ethers.utils.formatEther(await tokenB_contract.balanceOf(User1.address)));
                expect(User1_tokenB).to.equal(BigNumber(e100).toString());
                await tokenB_contract.approve(CtokenBDelegator_contract.address, BigNumber(e100).toString());
                console.log("--------------------------------------------------------------------");
                console.log("User1      mint CtokenB:", ethers.utils.formatEther(BigNumber(e100).toString()));
                await CtokenBDelegator_contract.mint(BigNumber(e100).toString());
                console.log("User1 CtokenB balanceOf:", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User1.address)));
                console.log("--------------------------------------------------------------------");
                console.log("User1    redeem CtokenB:", ethers.utils.formatEther(BigNumber(e100).toString()));
                await CtokenBDelegator_contract.redeem(BigNumber(e100).toString());
                console.log("User1 CtokenB balanceOf:", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User1.address)));
                console.log("User1 tokenB  balanceOf:", ethers.utils.formatEther(await tokenB_contract.balanceOf(User1.address)));
                console.log("--------------------------------------------------------------------");
                console.log("--------------------------------------------------------------------");
            });

            it("should borrow/repay ok", async () => {

                await tokenA_contract.mint(User2.address, BigNumber(e100).toString());
                console.log("User2 tokenA balanceOf:", ethers.utils.formatEther(await tokenA_contract.balanceOf(User2.address)));
                await tokenA_contract.connect(User2).approve(CtokenADelegator_contract.address, BigNumber(e100).toString());

                await tokenB_contract.mint(User1.address, BigNumber(e100).toString());
                console.log("User1 tokenB balanceOf:", ethers.utils.formatEther(await tokenB_contract.balanceOf(User1.address)));
                await tokenB_contract.approve(CtokenBDelegator_contract.address, BigNumber(e100).toString());
                console.log("--------------------------------------------------------------------");
                console.log("User2 mint CtokenA:", ethers.utils.formatEther(BigNumber(e100).toString()));
                await CtokenADelegator_contract.connect(User2).mint(BigNumber(e100).toString());
                console.log("User2 CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User2.address)));

                console.log("CtokenADelegator tokenA balanceOf:", ethers.utils.formatEther(await tokenA_contract.balanceOf(CtokenADelegator_contract.address)));

                console.log("User1 mint CtokenB:", ethers.utils.formatEther(BigNumber(e100).toString()));
                await CtokenBDelegator_contract.mint(BigNumber(e100).toString());
                console.log("User1 CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User1.address)));


                console.log("--------------------------------------------------------------------");
                console.log("User1 borrow tokenA:", ethers.utils.formatEther(BigNumber(e1 * 50).toString()));
                await CtokenADelegator_contract.borrow(BigNumber(e1 * 50).toString());

                console.log("User1 CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User1.address)));
                console.log("User1 CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User1.address)));
                console.log("User1  tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(User1.address)));
                console.log("User1  tokenB balanceOf", ethers.utils.formatEther(await tokenB_contract.balanceOf(User1.address)));

                console.log("--------------------------------------------------------------------");
                await tokenA_contract.approve(CtokenADelegator_contract.address, BigNumber(e1 * 50).toString());
                console.log("User1 repayBorrow tokenA:", ethers.utils.formatEther(BigNumber(e1 * 50).toString()));
                await CtokenADelegator_contract.repayBorrow(BigNumber(e1 * 50).toString());

                console.log("User1 CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User1.address)));
                console.log("User1 CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User1.address)));
                console.log("User1  tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(User1.address)));
                console.log("User1  tokenB balanceOf", ethers.utils.formatEther(await tokenB_contract.balanceOf(User1.address)));
                console.log("--------------------------------------------------------------------");
                console.log("--------------------------------------------------------------------");
            });

            it("change CollateralFactor tokenＢ to 0.1 should liquidateBorrow ok", async () => {

                await tokenA_contract.mint(User2.address, ethers.utils.parseUnits("10000", 18));
                console.log("User2 tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(User2.address)));
                await tokenA_contract.connect(User2).approve(CtokenADelegator_contract.address, ethers.utils.parseUnits("10000", 18));

                await tokenB_contract.mint(User1.address, BigNumber(e100).toString());
                console.log("User1 tokenB balanceOf", ethers.utils.formatEther(await tokenB_contract.balanceOf(User1.address)));
                await tokenB_contract.approve(CtokenBDelegator_contract.address, BigNumber(e100).toString());
                console.log("--------------------------------------------------------------------");
                console.log("User2 mint CtokenA:", ethers.utils.formatEther(BigNumber(e100).toString()));
                await CtokenADelegator_contract.connect(User2).mint(BigNumber(e100).toString());
                console.log("User2 CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User2.address)));

                console.log("CtokenADelegator tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(CtokenADelegator_contract.address)));

                console.log("User1 mint CtokenB:", ethers.utils.formatEther(BigNumber(e1).toString()));
                await CtokenBDelegator_contract.mint(BigNumber(e1).toString());
                console.log("User1 CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User1.address)));

                console.log("--------------------------------------------------------------------");
                console.log("User1 borrow tokenA:", ethers.utils.formatEther(BigNumber(e1 * 50).toString()));
                await CtokenADelegator_contract.borrow(BigNumber(e1 * 50).toString());

                console.log("User2  CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User2.address)));
                console.log("User2  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User2.address)));
                console.log("User2   tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(User2.address)));
                console.log("User2   tokenB balanceOf", ethers.utils.formatEther(await tokenB_contract.balanceOf(User2.address)));
                console.log("-----------------------------------------");
                console.log("User1  CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User1.address)));
                console.log("User1  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User1.address)));
                console.log("User1   tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(User1.address)));
                console.log("User1   tokenB balanceOf", ethers.utils.formatEther(await tokenB_contract.balanceOf(User1.address)));
                console.log("-----------------------------------------");
                console.log("set ComptrollerG7 TokenB _setCollateralFactor=", CtokenBDelegator_contract.address, ethers.utils.formatEther(BigNumber(e1 / 10).toString()));
                console.log("User2 liquidateBorrow User1 tokenA:", ethers.utils.formatEther(BigNumber(e1 * 25).toString()));

                await ComptrollerG7_contract._setCollateralFactor(CtokenBDelegator_contract.address, BigNumber(e1 / 10).toString());

                await CtokenADelegator_contract.connect(User2).liquidateBorrow(User1.address, BigNumber(e1 * 25).toString(), CtokenBDelegator_contract.address);

                console.log("-----------------------------------------");
                console.log("User2  CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User2.address)));
                console.log("User2  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User2.address)));
                console.log("User2   tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(User2.address)));
                console.log("User2   tokenB balanceOf", ethers.utils.formatEther(await tokenB_contract.balanceOf(User2.address)));
                console.log("-----------------------------------------");
                console.log("User1  CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User1.address)));
                console.log("User1  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User1.address)));
                console.log("User1   tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(User1.address)));
                console.log("User1   tokenB balanceOf", ethers.utils.formatEther(await tokenB_contract.balanceOf(User1.address)));
                console.log("-----------------------------------------");

            });
            it("change tokenB price should liquidateBorrow ok", async () => {

                await tokenA_contract.mint(User2.address, ethers.utils.parseUnits("10000", 18));
                console.log("User2 tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(User2.address)));
                await tokenA_contract.connect(User2).approve(CtokenADelegator_contract.address, ethers.utils.parseUnits("10000", 18));

                await tokenB_contract.mint(User1.address, BigNumber(e100).toString());
                console.log("User1 tokenB balanceOf", ethers.utils.formatEther(await tokenB_contract.balanceOf(User1.address)));
                await tokenB_contract.approve(CtokenBDelegator_contract.address, BigNumber(e100).toString());
                console.log("--------------------------------------------------------------------");
                console.log("User2 mint CtokenA:", ethers.utils.formatEther(BigNumber(e100).toString()));
                await CtokenADelegator_contract.connect(User2).mint(BigNumber(e100).toString());
                console.log("User2 CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User2.address)));

                console.log("CtokenADelegator tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(CtokenADelegator_contract.address)));

                console.log("User1 mint CtokenB:", ethers.utils.formatEther(BigNumber(e1).toString()));
                await CtokenBDelegator_contract.mint(BigNumber(e1).toString());
                console.log("User1 CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User1.address)));

                console.log("--------------------------------------------------------------------");
                console.log("User1 borrow tokenA:", ethers.utils.formatEther(BigNumber(e1 * 50).toString()));
                await CtokenADelegator_contract.borrow(BigNumber(e1 * 50).toString());

                console.log("User2  CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User2.address)));
                console.log("User2  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User2.address)));
                console.log("User2   tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(User2.address)));
                console.log("User2   tokenB balanceOf", ethers.utils.formatEther(await tokenB_contract.balanceOf(User2.address)));
                console.log("-----------------------------------------");
                console.log("User1  CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User1.address)));
                console.log("User1  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User1.address)));
                console.log("User1   tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(User1.address)));
                console.log("User1   tokenB balanceOf", ethers.utils.formatEther(await tokenB_contract.balanceOf(User1.address)));
                console.log("-----------------------------------------");

                console.log("set SimplePriceOracle tokenB setUnderlyingPrice=", CtokenBDelegator_contract.address, ethers.utils.formatEther(BigNumber(e1 * 10).toString()));
                await SimplePriceOracle_contract.setUnderlyingPrice(CtokenBDelegator_contract.address, BigNumber(e1 * 10).toString());

                console.log("User2 liquidateBorrow User1 tokenA:", ethers.utils.formatEther(BigNumber(e1 * 5).toString()));

                await CtokenADelegator_contract.connect(User2).liquidateBorrow(User1.address, BigNumber(e1 * 5).toString(), CtokenBDelegator_contract.address);
                console.log("-----------------------------------------");
                console.log("User2  CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User2.address)));
                console.log("User2  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User2.address)));
                console.log("User2   tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(User2.address)));
                console.log("User2   tokenB balanceOf", ethers.utils.formatEther(await tokenB_contract.balanceOf(User2.address)));
                console.log("-----------------------------------------");
                console.log("User1  CtokenA balanceOf", ethers.utils.formatEther(await CtokenADelegator_contract.balanceOf(User1.address)));
                console.log("User1  CtokenB balanceOf", ethers.utils.formatEther(await CtokenBDelegator_contract.balanceOf(User1.address)));
                console.log("User1   tokenA balanceOf", ethers.utils.formatEther(await tokenA_contract.balanceOf(User1.address)));
                console.log("User1   tokenB balanceOf", ethers.utils.formatEther(await tokenB_contract.balanceOf(User1.address)));
                console.log("-----------------------------------------");

            });

        });

    }
);