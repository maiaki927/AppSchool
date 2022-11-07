# 運行與檔案設定

需要建置.env檔案

將三種KEY填入

```env
ETHERSCAN_API_KEY=""
ALCHEMY_API_KEY=""
PRIVATE_KEY=""
```

環境正常的話應該直接跑test就可以

1至5題為test.js

```shell
npx hardhat test test/test.js
```

第6題為test6.js

```shell
npx hardhat test test/test6.js
```

我自己一開始npm套件的時候全域沒分好 直接run會掛

要先跑這個

```shell
npm i --save-dev hardhat --force
```

# Week12 更新第6題Flashloan

新增合約Flashloan.sol

與test文件test6.js

### 6. test 從mint開始測試到Flashloan，不還原鏈上狀態，一路執行至結束。

清算獎勵_setLiquidationIncentive= 1.08

log:

```
signerUSDC      mint CtokenA: 10000
      ✔ signerUSDC mint 1000 cUDSC (2089ms)
--------------------------------------------------------------------
signerUNI      mint CtokenB: 1000
      ✔ signerUNI mint 1000 cUNI (2818ms)
--------------------------------------------------------------------
signerUNI      borrow tokenA: 5000
      ✔ signerUNI borrow 5000 USDC (802ms)
--------------------------------------------------------------------
set UNI price 6.2
      ✔ set UNI price 6.2 (38ms)
--------------------------------------------------------------------
signerUSDC liquidateBorrow 2500 USDC of signerUNI
signerUSDC  CtokenB balanceOf 0.0
signerUNI  CtokenB balanceOf 564.516129032258064517
FlashLoanContract USDC balanceOf BigNumber { value: "121739940" }
      ✔ signerUSDC can liquidateBorrow signerUNI use Flashloan (24992ms)
```

透過FlashLoan清算2500顆USDC後

確認最後有賺到121多顆USDC存在合約中

# Wee11 的1到5題

合約資料夾有其他合約，還沒整理很亂ＸＤ
test只有一個

環境正常的話應該直接跑test就可以
```shell
npx hardhat test test/test.js
```

我自己一開始npm套件的時候全域沒分好 直接run會掛
要先跑這個
```shell
npm i --save-dev hardhat --force
```
測試目前都是先log

因為目前那份test的可讀性近乎0
這邊解釋一下作業流程

### 1.沒特別寫測試，反正1沒完成後面都跑不了ＸＤ
### 2.test 為should mint/redeem ok
log:
```
User1  tokenB balanceOf: 100.0
--------------------------------------------------------------------
User1      mint CtokenB: 100.0
User1 CtokenB balanceOf: 100.0
--------------------------------------------------------------------
User1    redeem CtokenB: 100.0
User1 CtokenB balanceOf: 0.0
User1 tokenB  balanceOf: 100.0
```

### 3.test 為 should borrow/repay ok
log:
```
set SimplePriceOracle tokenB setUnderlyingPrice= 0x9E545E3C0baAB3E08CdfD552C960A1050f373042 100.0
set SimplePriceOracle tokenA setUnderlyingPrice= 0x9E545E3C0baAB3E08CdfD552C960A1050f373042 1.0
set ComptrollerG7 CtokenA _setCollateralFactor= 0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9 0.5
set ComptrollerG7 CtokenB _setCollateralFactor= 0x9E545E3C0baAB3E08CdfD552C960A1050f373042 0.5
set ComptrollerG7  _setLiquidationIncentive= 1.08
set ComptrollerG7  _setCloseFactor= 0.5
set CtokenBDelegator _setReserveFactor= 1.0
User2 tokenA balanceOf: 100.0
User1 tokenB balanceOf: 100.0
--------------------------------------------------------------------
User2 mint CtokenA: 100.0
User2 CtokenA balanceOf 100.0
CtokenADelegator tokenA balanceOf: 100.0
User1 mint CtokenB: 100.0
User1 CtokenB balanceOf 100.0
--------------------------------------------------------------------
User1 borrow tokenA: 50.0
User1 CtokenA balanceOf 0.0
User1 CtokenB balanceOf 100.0
User1  tokenA balanceOf 50.0
User1  tokenB balanceOf 0.0
--------------------------------------------------------------------
User1 repayBorrow tokenA: 50.0
User1 CtokenA balanceOf 0.0
User1 CtokenB balanceOf 100.0
User1  tokenA balanceOf 0.0
User1  tokenB balanceOf 0.0
--------------------------------------------------------------------
```

4.5.這兩個test的差異只有是更改collateral factor或是oracle
前面借貸的log都一樣，這邊只截取liquidateBorrow部分的log
### 4 test 為 change CollateralFactor tokenB to 0.1 should liquidateBorrow ok

這邊測試將_setCollateralFactor改成0.1

每次可還款百分比上限_setCloseFactor= 0.5

清算獎勵_setLiquidationIncentive= 1.08

User2清算25顆tokenA
log:
```
set ComptrollerG7 Token _setCollateralFactor= 0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07 0.1
User2 liquidateBorrow User1 tokenA: 25.0
-----------------------------------------
User2  CtokenA balanceOf 100.0
User2  CtokenB balanceOf 0.26244
User2   tokenA balanceOf 9875.0
User2   tokenB balanceOf 0.0
-----------------------------------------
User1  CtokenA balanceOf 0.0
User1  CtokenB balanceOf 0.73
User1   tokenA balanceOf 50.0
User1   tokenB balanceOf 99.0
-----------------------------------------
```
由於4設定的_setCollateralFactor是0.1

tokenA的借入上限從50顆變成10顆

一次清算最大值只能50%顆

但是經歷過一次25顆的清算過後 還剩下25顆 仍然超越上限的10顆

所以可以繼續被清算


### 5 test 為 change tokenB price should liquidateBorrow ok

這邊測試將tokenB setUnderlyingPrice的價格改成10

每次可還款百分比上限_setCloseFactor= 0.5

清算獎勵_setLiquidationIncentive= 1.08

User2清算5顆tokenA
log:
```
set SimplePriceOracle tokenB setUnderlyingPrice= 0x4C2F7092C2aE51D986bEFEe378e50BD4dB99C901 10.0
User2 liquidateBorrow User1 tokenA: 5.0
-----------------------------------------
User2  CtokenA balanceOf 100.0
User2  CtokenB balanceOf 0.52488
User2   tokenA balanceOf 9895.0
User2   tokenB balanceOf 0.0
-----------------------------------------
User1  CtokenA balanceOf 0.0
User1  CtokenB balanceOf 0.46
User1   tokenA balanceOf 50.0
User1   tokenB balanceOf 99.0
```
由於5將tokenB的價格調整到原本的10%

即使清算上限一次是50% 理論上應該可以清25顆

但是因為tokenB價格暴跌

User1手上的CtokenB只有1顆 價值無法達到25顆tokenA

因此只能清算小於10 tokenB（還要扣掉清算獎勵等）


