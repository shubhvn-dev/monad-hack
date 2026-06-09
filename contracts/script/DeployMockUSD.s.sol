// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/MockUSD.sol";

contract DeployMockUSD is Script {
    function run() external {
        vm.startBroadcast();
        MockUSD musd = new MockUSD();
        console.log("MockUSD:", address(musd));
        vm.stopBroadcast();
    }
}
