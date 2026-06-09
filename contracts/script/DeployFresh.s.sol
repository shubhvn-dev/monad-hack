// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/TrackToken.sol";
import "../src/TrackFund.sol";

contract DeployFresh is Script {
    address constant MOCK_USD  = 0xCCBE5a3C7dC5287C412598dfb5AEA6571710021e;
    // Safe multisig is admin — agent proposes txs, owners co-sign
    address constant ADMIN     = 0x0257C2bFad2c97E8fb69f6E0106d6CE07EF2B72F;

    function run() external {
        vm.startBroadcast();

        TrackToken trackToken = new TrackToken("Agentic Research Track Token", "ART", msg.sender);
        TrackFund  trackFund  = new TrackFund("Agentic Research Track", MOCK_USD, address(trackToken), ADMIN);
        trackToken.transferOwnership(address(trackFund));

        console.log("TrackToken:", address(trackToken));
        console.log("TrackFund:", address(trackFund));

        vm.stopBroadcast();
    }
}
