// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/MockUSD.sol";
import "../src/TrackFundFactory.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        MockUSD musd = new MockUSD();
        console.log("MockUSD:", address(musd));

        TrackFundFactory factory = new TrackFundFactory();
        console.log("TrackFundFactory:", address(factory));

        (address trackFund, address trackToken) = factory.createTrack(
            "Agentic Research Track",
            address(musd)
        );
        console.log("TrackFund:", trackFund);
        console.log("TrackToken:", trackToken);

        vm.stopBroadcast();
    }
}
