// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;
pragma abicoder v2;
import "./CTokenInterfaces.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

abstract contract interface_swap {

    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        virtual
        returns (uint256 amountOut)
    {}
}

abstract contract interface_flashloan {
    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external virtual {}
}

abstract contract interface_CErc20 is CTokenInterface {
    function liquidateBorrow(
        address borrower,
        uint256 repayAmount,
        CTokenInterface cTokenCollateral
    ) external returns (uint256) {}

    function redeem(uint256 redeemTokens) external returns (uint256) {}

    function balanceOf(address owner)
        external
        view
        override
        returns (uint256)
    {}
}

contract Useflashloan {
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant UNI = 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984;
    address CErc20addressUNI;
    address CErc20addressUSDC;
    address private constant SWAP_ROUTER_02 =
        0xE592427A0AEce92De3Edee1F18E0157C05861564;
    ISwapRouter public immutable swapRouter02 = ISwapRouter(SWAP_ROUTER_02);
    interface_flashloan aave =
        interface_flashloan(0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9);
    CTokenInterface cTokenCollateral;
    address borrower;


    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool) {

        require(msg.sender==0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9,"only aave can call");
        
        interface_CErc20 CErc20UNI = interface_CErc20(CErc20addressUNI);
        interface_CErc20 CErc20USDC = interface_CErc20(CErc20addressUSDC);
        IERC20(USDC).approve(CErc20addressUSDC, amounts[0]);

        CErc20USDC.liquidateBorrow(borrower, amounts[0], cTokenCollateral);

        uint256 cUNI_balance = CErc20UNI.balanceOf(address(this));
    
        CErc20UNI.redeem(cUNI_balance);
        
        IERC20(UNI).approve(SWAP_ROUTER_02, cUNI_balance);
        swapExactInputSingle02(cUNI_balance);
     

        // Approve the LendingPool contract allowance to *pull* the owed amount
        for (uint256 i = 0; i < assets.length; i++) {
            uint256 amountOwing = amounts[i] + (premiums[i]);
        
            IERC20(assets[i]).approve(
                0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9,
                amountOwing
            );
        }

        return true;
    }

   

    function swapExactInputSingle02(uint256 amountIn)
        internal
        returns (uint256 amountOut)
    {
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: UNI,
                tokenOut: USDC,
                fee: 3000,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        amountOut = swapRouter02.exactInputSingle(params);
     
    }

    function UseAAVEtoliquidate(
        address _borrower,
        CTokenInterface _cTokenCollateral,
        address _CErc20addressUNI,
        address _CErc20addressUSDC,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes
    ) public {
        {
            cTokenCollateral = _cTokenCollateral;
            borrower = _borrower;
            CErc20addressUNI = _CErc20addressUNI;
            CErc20addressUSDC = _CErc20addressUSDC;

            aave.flashLoan(
                address(this),
                assets,
                amounts,
                modes,
                address(this),
                "",
                0
            );
        }
    }
}
