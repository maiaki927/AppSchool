// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Counter is Initializable {
    uint256 public counter;

    function initialize() public initializer {
        counter = 0;
    }

    function setIncrement() external {
        counter += 1;
    }
}