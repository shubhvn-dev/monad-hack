// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./TrackToken.sol";
import "./TrackFund.sol";

contract TrackFundFactory {
    uint256 public trackCount;
    mapping(uint256 => address) public tracks;

    event TrackCreated(uint256 indexed trackId, address indexed trackFund, address indexed trackToken, string name);

    function createTrack(string calldata name, address stableToken)
        external
        returns (address trackFundAddr, address trackTokenAddr)
    {
        // Deploy TrackToken owned by this factory temporarily
        TrackToken token = new TrackToken(
            string.concat(name, " Token"),
            string.concat("TT", _toString(trackCount)),
            address(this)
        );

        // Deploy TrackFund, admin = caller
        TrackFund fund = new TrackFund(name, stableToken, address(token), msg.sender);

        // Transfer token ownership to TrackFund so it can mint/burn
        token.transferOwnership(address(fund));

        uint256 trackId = trackCount++;
        tracks[trackId] = address(fund);

        emit TrackCreated(trackId, address(fund), address(token), name);
        return (address(fund), address(token));
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
