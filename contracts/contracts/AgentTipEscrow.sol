// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentTipEscrow
 * @dev Handles incoming x402 micropayments and tips in USDC, deducting a 1.5% platform fee.
 */
contract AgentTipEscrow is Ownable {
    IERC20 public usdc;
    uint256 public constant FEE_DENOMINATOR = 1000;
    uint256 public feeNumerator = 15; // 1.5% fee

    event PaymentProcessed(
        address indexed sender,
        address indexed creator,
        uint256 amount,
        string paymentType,
        string context
    );
    event FeeUpdated(uint256 newFeeNumerator);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    constructor(address _usdcAddress, address initialOwner) Ownable(initialOwner) {
        usdc = IERC20(_usdcAddress);
    }

    /**
     * @dev Process a human tip or agent micropayment.
     * @param creator The content creator receiving the funds.
     * @param amount The total payment amount in USDC (6 decimals).
     * @param paymentType E.g., "human" or "agent".
     * @param context Optional context or query string from the agent.
     */
    function payCreator(
        address creator,
        uint256 amount,
        string calldata paymentType,
        string calldata context
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        require(creator != address(0), "Invalid creator address");

        // Calculate platform fee
        uint256 fee = (amount * feeNumerator) / FEE_DENOMINATOR;
        uint256 creatorAmount = amount - fee;

        // Transfer funds from sender to this contract
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Transfer the creator's share
        require(
            usdc.transfer(creator, creatorAmount),
            "Creator transfer failed"
        );

        emit PaymentProcessed(msg.sender, creator, amount, paymentType, context);
    }

    /**
     * @dev Process a batch of micropayments (useful for agent operators).
     */
    function batchPayCreators(
        address[] calldata creators,
        uint256[] calldata amounts,
        string[] calldata paymentTypes,
        string[] calldata contexts
    ) external {
        require(
            creators.length == amounts.length &&
            amounts.length == paymentTypes.length &&
            paymentTypes.length == contexts.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < creators.length; i++) {
            this.payCreator(creators[i], amounts[i], paymentTypes[i], contexts[i]);
        }
    }

    /**
     * @dev Allows the owner to withdraw accumulated platform fees.
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        
        require(usdc.transfer(owner(), balance), "Withdrawal failed");
        emit FeesWithdrawn(owner(), balance);
    }

    /**
     * @dev Update the platform fee percentage. Maximum allowed fee is 10%.
     */
    function setFeeNumerator(uint256 _newFeeNumerator) external onlyOwner {
        require(_newFeeNumerator <= 100, "Fee cannot exceed 10%");
        feeNumerator = _newFeeNumerator;
        emit FeeUpdated(_newFeeNumerator);
    }
}
