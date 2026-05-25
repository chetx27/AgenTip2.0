// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Minimal interface for resolving ENS text records
interface IENSRegistry {
    function resolver(bytes32 node) external view returns (address);
}

interface IENSResolver {
    function text(bytes32 node, string calldata key) external view returns (string memory);
    function text(bytes32 node, string[] calldata keys) external view returns (string[] memory);
}

/**
 * @title AgentTipWill
 * @dev Autonomous DeFi Will executed by reading ENS text records directly on-chain.
 */
contract AgentTipWill is Ownable {
    IERC20 public usdc;
    IENSRegistry public ensRegistry;

    // Track total USDC deposited per creator wallet
    mapping(address => uint256) public balances;
    
    // Track when each will was last claimed / active
    mapping(address => uint256) public lastActive;

    event Deposited(address indexed creator, uint256 amount);
    event Withdrawn(address indexed creator, uint256 amount);
    event WillExecuted(address indexed creator, uint256 totalDistributed);

    constructor(
        address _usdcAddress, 
        address _ensRegistryAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        usdc = IERC20(_usdcAddress);
        ensRegistry = IENSRegistry(_ensRegistryAddress);
    }

    /**
     * @dev Deposit USDC into the Will escrow
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        balances[msg.sender] += amount;
        lastActive[msg.sender] = block.timestamp;

        emit Deposited(msg.sender, amount);
    }

    /**
     * @dev Creator withdraws their own funds, resetting their inactivity timer.
     */
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        lastActive[msg.sender] = block.timestamp;

        require(usdc.transfer(msg.sender, amount), "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Keep-alive ping to reset the inactivity timer without withdrawing.
     */
    function ping() external {
        lastActive[msg.sender] = block.timestamp;
    }

    /**
     * @dev Note: For the actual implementation to be fully autonomous *on-chain*,
     * parsing complex strings (like "friend.eth:60,gitcoin.eth:40") and resolving 
     * multiple ENS names inside the EVM is highly gas-intensive. 
     * 
     * In a production Rollup environment, this function would likely accept the 
     * off-chain resolved addresses and percentages, verify them via CCIP Read or 
     * require the executor to provide Merkle proofs of the ENS text records.
     * 
     * For this implementation phase, we rely on the backend executor to pass the 
     * resolved beneficiaries and verify the idle time off-chain before calling this.
     */
    function executeWill(
        address creator,
        address[] calldata recipients,
        uint256[] calldata basisPoints // out of 10000 (e.g., 6000 = 60%)
    ) external onlyOwner {
        uint256 totalBalance = balances[creator];
        require(totalBalance > 0, "No funds to distribute");
        require(recipients.length == basisPoints.length, "Array mismatch");

        // Note: In full production, this would confirm `block.timestamp > lastActive[creator] + idleDays`
        // by reading the `agenttip.will.idle-days` text record on-chain.

        balances[creator] = 0; // Zero out before transfer (reentrancy protection)

        uint256 distributed = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 amount = (totalBalance * basisPoints[i]) / 10000;
            if (amount > 0 && recipients[i] != address(0)) {
                require(usdc.transfer(recipients[i], amount), "Transfer failed");
                distributed += amount;
            }
        }

        emit WillExecuted(creator, distributed);
    }
}
