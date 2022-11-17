// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { ISimpleSwap } from "./interface/ISimpleSwap.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract SimpleSwap is ISimpleSwap, ERC20 {
    address public AToken;
    address public BToken;

    uint256 private reserveA;
    uint256 private reserveB;

    constructor(address _AToken, address _BToken) ERC20("Anna", "Anna") {
        require(_AToken != address(0), "SimpleSwap: TOKENA_IS_NOT_CONTRACT");
        require(_BToken != address(0), "SimpleSwap: TOKENB_IS_NOT_CONTRACT");
        require(_BToken != _AToken, "SimpleSwap: TOKENA_TOKENB_IDENTICAL_ADDRESS");
        AToken = _AToken;
        BToken = _BToken;
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external override returns (uint256 amountOut) {
        require(tokenIn == AToken || tokenIn == BToken, "SimpleSwap: INVALID_TOKEN_IN");
        require(tokenOut == AToken || tokenOut == BToken, "SimpleSwap: INVALID_TOKEN_OUT");
        require(tokenOut != tokenIn, "SimpleSwap: IDENTICAL_ADDRESS");
        require(amountIn != 0, "SimpleSwap: INSUFFICIENT_INPUT_AMOUNT");
        ERC20(tokenIn).transferFrom(_msgSender(), address(this), amountIn);

        if (reserveA == 0 || reserveB == 0) {
            amountOut = 0;
           
        } else {
            amountOut = tokenIn == AToken
                ? (amountIn * reserveB) / (reserveA + amountIn)
                : (amountIn * reserveA) / (reserveB + amountIn);
            updateReserves(
                tokenIn == AToken ? reserveA + amountIn : reserveA - amountOut,
                tokenIn == BToken ? reserveB + amountIn : reserveB - amountOut
            );
        }
        require(amountOut != 0, "SimpleSwap: INSUFFICIENT_OUTPUT_AMOUNT");
        ERC20(tokenOut).approve(address(this), amountOut);
        ERC20(tokenOut).transferFrom(address(this), _msgSender(), amountOut);

        emit Swap(_msgSender(), tokenIn, tokenOut, amountIn, amountOut);
    }

    function addLiquidity(uint256 amountAIn, uint256 amountBIn)
        external
        override
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        )
    {
        require(amountAIn != 0, "SimpleSwap: INSUFFICIENT_INPUT_AMOUNT");

        require(amountBIn != 0, "SimpleSwap: INSUFFICIENT_INPUT_AMOUNT");

        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountAIn, amountBIn);
            updateReserves(amountA, amountB);
        } else {
            amountA = (amountBIn * reserveA) / reserveB > amountAIn ? amountAIn : (amountBIn * reserveA) / reserveB;
            amountB = (amountAIn * reserveB) / reserveA > amountBIn ? amountBIn : (amountAIn * reserveB) / reserveA;
            updateReserves(reserveA + amountA, reserveB + amountB);
        }

        ERC20(AToken).transferFrom(_msgSender(), address(this), amountA);
        ERC20(BToken).transferFrom(_msgSender(), address(this), amountB);
        liquidity = sqrt(amountA * amountB);
        _mint(_msgSender(), liquidity);
        emit AddLiquidity(_msgSender(), amountA, amountB, liquidity);
    }

    function removeLiquidity(uint256 liquidity) external override returns (uint256 amountA, uint256 amountB) {
        require(liquidity != 0, "SimpleSwap: INSUFFICIENT_LIQUIDITY_BURNED");

        amountA = (liquidity * reserveA) / totalSupply();
        amountB = (liquidity * reserveB) / totalSupply();

        ERC20(AToken).approve(address(this), amountA);
        ERC20(AToken).transferFrom(address(this), _msgSender(), amountA);
        ERC20(BToken).approve(address(this), amountB);
        ERC20(BToken).transferFrom(address(this), _msgSender(), amountB);

        updateReserves(reserveA - amountA, reserveB - amountB);

        transfer(address(this), liquidity);
        _burn(address(this), liquidity);

        emit RemoveLiquidity(_msgSender(), amountA, amountB, liquidity);
    }

    function updateReserves(uint256 _reserveA, uint256 _reserveB) internal {
        reserveA = _reserveA;
        reserveB = _reserveB;
    }

    function getReserves() external view override returns (uint256 _reserveA, uint256 _reserveB) {
        _reserveA = reserveA;
        _reserveB = reserveB;
    }

    function getTokenA() external view override returns (address tokenA) {
        tokenA = AToken;
    }

    function getTokenB() external view override returns (address tokenB) {
        tokenB = BToken;
    }

    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
