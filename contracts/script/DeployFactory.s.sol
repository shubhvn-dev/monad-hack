// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/TrackFundFactory.sol";

contract DeployFactory is Script {
    function run() external {
        vm.startBroadcast();
        TrackFundFactory factory = new TrackFundFactory();
        console.log("TrackFundFactory:", address(factory));
        vm.stopBroadcast();
    }
}
