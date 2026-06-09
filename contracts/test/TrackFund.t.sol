// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/MockUSD.sol";
import "../src/TrackToken.sol";
import "../src/TrackFund.sol";
import "../src/TrackFundFactory.sol";

contract TrackFundTest is Test {
    MockUSD musd;
    TrackFundFactory factory;
    TrackFund fund;
    TrackToken trackToken;

    address admin = address(this);
    address investor = makeAddr("investor");
    address researcher = makeAddr("researcher");
    address projectWallet = makeAddr("projectWallet");

    function setUp() public {
        musd = new MockUSD();
        factory = new TrackFundFactory();

        (address fundAddr, address tokenAddr) = factory.createTrack("Agentic Research Track", address(musd));
        fund = TrackFund(fundAddr);
        trackToken = TrackToken(tokenAddr);

        // Fund investor with 1000 MUSD
        musd.mint(investor, 1000e18);
    }

    function testDeposit() public {
        vm.startPrank(investor);
        musd.approve(address(fund), 100e18);
        fund.deposit(100e18);
        vm.stopPrank();

        assertEq(trackToken.balanceOf(investor), 100e18);
        assertEq(fund.totalAssets(), 100e18);
        assertEq(musd.balanceOf(address(fund)), 100e18);
    }

    function testWithdraw() public {
        vm.startPrank(investor);
        musd.approve(address(fund), 100e18);
        fund.deposit(100e18);
        fund.withdraw(100e18);
        vm.stopPrank();

        assertEq(trackToken.balanceOf(investor), 0);
        assertEq(fund.totalAssets(), 0);
        assertEq(musd.balanceOf(investor), 1000e18);
    }

    function testWithdrawProRata() public {
        address investor2 = makeAddr("investor2");
        musd.mint(investor2, 1000e18);

        vm.startPrank(investor);
        musd.approve(address(fund), 100e18);
        fund.deposit(100e18);
        vm.stopPrank();

        vm.startPrank(investor2);
        musd.approve(address(fund), 100e18);
        fund.deposit(100e18);
        vm.stopPrank();

        // Investor withdraws 50 shares (half of their 100)
        vm.prank(investor);
        fund.withdraw(50e18);

        assertEq(musd.balanceOf(investor), 950e18); // started with 1000, deposited 100, got back 50
        assertEq(fund.totalAssets(), 150e18);
    }

    function testProposeAndApprove() public {
        bytes32 hash = keccak256("test proposal");

        vm.prank(researcher);
        uint256 id = fund.propose(50e18, hash);
        assertEq(id, 0);

        (uint256 pid, uint256 amount, bytes32 mh, address proposer, TrackFund.ProposalStatus status) = fund.proposals(0);
        assertEq(pid, 0);
        assertEq(amount, 50e18);
        assertEq(mh, hash);
        assertEq(proposer, researcher);
        assertEq(uint8(status), uint8(TrackFund.ProposalStatus.PENDING));

        fund.approveProposal(0);
        (, , , , TrackFund.ProposalStatus status2) = fund.proposals(0);
        assertEq(uint8(status2), uint8(TrackFund.ProposalStatus.APPROVED));
    }

    function testFundProposal() public {
        // Deposit funds first
        vm.startPrank(investor);
        musd.approve(address(fund), 200e18);
        fund.deposit(200e18);
        vm.stopPrank();

        bytes32 hash = keccak256("funded proposal");
        vm.prank(researcher);
        fund.propose(100e18, hash);

        fund.approveProposal(0);
        fund.fundProposal(0, projectWallet);

        assertEq(musd.balanceOf(projectWallet), 100e18);
        assertEq(fund.totalAssets(), 100e18);
        (, , , , TrackFund.ProposalStatus status) = fund.proposals(0);
        assertEq(uint8(status), uint8(TrackFund.ProposalStatus.FUNDED));
    }

    function testRegisterProjectToken() public {
        // Setup: deposit, propose, approve, fund
        vm.startPrank(investor);
        musd.approve(address(fund), 200e18);
        fund.deposit(200e18);
        vm.stopPrank();

        vm.prank(researcher);
        fund.propose(100e18, keccak256("project"));
        fund.approveProposal(0);
        fund.fundProposal(0, projectWallet);

        // Project team issues a token and registers it
        MockUSD projectToken = new MockUSD(); // reuse MockUSD as a stand-in project token
        projectToken.mint(projectWallet, 1000e18);

        vm.startPrank(projectWallet);
        projectToken.approve(address(fund), 100e18);
        fund.registerProjectToken(0, address(projectToken), 100e18);
        vm.stopPrank();

        assertEq(fund.projectTokenBalances(address(projectToken)), 100e18);
        assertEq(projectToken.balanceOf(address(fund)), 100e18);
    }

    function testOnlyAdminApprove() public {
        vm.prank(researcher);
        fund.propose(50e18, keccak256("x"));

        vm.prank(researcher);
        vm.expectRevert("TrackFund: not admin");
        fund.approveProposal(0);
    }

    function testOnlyAdminFund() public {
        vm.startPrank(investor);
        musd.approve(address(fund), 200e18);
        fund.deposit(200e18);
        vm.stopPrank();

        vm.prank(researcher);
        fund.propose(50e18, keccak256("x"));
        fund.approveProposal(0);

        vm.prank(researcher);
        vm.expectRevert("TrackFund: not admin");
        fund.fundProposal(0, projectWallet);
    }

    function testCannotDepositZero() public {
        vm.prank(investor);
        vm.expectRevert("TrackFund: zero amount");
        fund.deposit(0);
    }

    function testCannotWithdrawMoreThanBalance() public {
        vm.startPrank(investor);
        musd.approve(address(fund), 100e18);
        fund.deposit(100e18);
        vm.expectRevert("TrackFund: insufficient shares");
        fund.withdraw(200e18);
        vm.stopPrank();
    }
}
