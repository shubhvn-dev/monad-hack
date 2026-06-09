// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./TrackToken.sol";

contract TrackFund {
    using SafeERC20 for IERC20;

    enum ProposalStatus { PENDING, APPROVED, FUNDED }

    struct Proposal {
        uint256 id;
        uint256 requestedAmount;
        bytes32 metadataHash;
        ProposalStatus status;
    }

    string public name;
    address public stableToken;
    address public trackToken;
    address public admin;
    uint256 public totalAssets;
    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public projectTokenBalances;

    event Deposited(address indexed investor, uint256 amount);
    event Withdrawn(address indexed investor, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, uint256 requestedAmount, bytes32 metadataHash);
    event ProposalApproved(uint256 indexed proposalId);
    event ProposalFunded(uint256 indexed proposalId, address indexed projectWallet, uint256 amount);
    event ProjectTokenRegistered(uint256 indexed proposalId, address indexed projectToken, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "TrackFund: not admin");
        _;
    }

    constructor(string memory _name, address _stableToken, address _trackToken, address _admin) {
        name = _name;
        stableToken = _stableToken;
        trackToken = _trackToken;
        admin = _admin;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "TrackFund: zero amount");
        IERC20(stableToken).safeTransferFrom(msg.sender, address(this), amount);
        TrackToken(trackToken).mint(msg.sender, amount);
        totalAssets += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 shareAmount) external {
        require(shareAmount > 0, "TrackFund: zero amount");
        require(IERC20(trackToken).balanceOf(msg.sender) >= shareAmount, "TrackFund: insufficient shares");

        uint256 totalShares = IERC20(trackToken).totalSupply();
        uint256 stableAmount = (shareAmount * totalAssets) / totalShares;

        TrackToken(trackToken).burn(msg.sender, shareAmount);
        totalAssets -= stableAmount;
        IERC20(stableToken).safeTransfer(msg.sender, stableAmount);
        emit Withdrawn(msg.sender, stableAmount);
    }

    function propose(uint256 requestedAmount, bytes32 metadataHash) external returns (uint256) {
        require(requestedAmount > 0, "TrackFund: zero amount");
        uint256 proposalId = proposalCount++;
        proposals[proposalId] = Proposal({
            id: proposalId,
            requestedAmount: requestedAmount,
            metadataHash: metadataHash,
            status: ProposalStatus.PENDING
        });
        emit ProposalCreated(proposalId, requestedAmount, metadataHash);
        return proposalId;
    }

    function approveProposal(uint256 proposalId) external onlyAdmin {
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.PENDING, "TrackFund: not pending");
        p.status = ProposalStatus.APPROVED;
        emit ProposalApproved(proposalId);
    }

    function fundProposal(uint256 proposalId, address projectWallet) external onlyAdmin {
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.APPROVED, "TrackFund: not approved");
        require(p.requestedAmount <= totalAssets, "TrackFund: insufficient assets");
        p.status = ProposalStatus.FUNDED;
        totalAssets -= p.requestedAmount;
        IERC20(stableToken).safeTransfer(projectWallet, p.requestedAmount);
        emit ProposalFunded(proposalId, projectWallet, p.requestedAmount);
    }

    function registerProjectToken(uint256 proposalId, address projectToken, uint256 amountToTrack) external {
        require(proposals[proposalId].status == ProposalStatus.FUNDED, "TrackFund: proposal not funded");
        IERC20(projectToken).safeTransferFrom(msg.sender, address(this), amountToTrack);
        projectTokenBalances[projectToken] += amountToTrack;
        emit ProjectTokenRegistered(proposalId, projectToken, amountToTrack);
    }
}
