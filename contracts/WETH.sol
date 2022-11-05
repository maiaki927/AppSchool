// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SampleERC20
 * @dev Create a sample ERC20 standard token
 */
contract  WETH is ERC20 {

    constructor() ERC20("ANNA_test", "WETH") {}

    function deposit() external payable{
        _mint(msg.sender,msg.value);
    }
    function withdraw(uint _amount) external payable{
        _burn(msg.sender,msg.value);
        payable(msg.sender).transfer(_amount);
    }
    
}