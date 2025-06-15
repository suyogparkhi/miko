# Zero-Knowledge Constraints

## Overview

This document outlines the constraints and validation rules implemented in the Risc0 zkVM prover for private swaps. These constraints ensure the validity and security of swaps while maintaining privacy.

## Constraint Categories

### 1. Amount Constraints

```rust
// Ensure amounts are positive
assert!(amount_in > 0, "Amount in must be positive");
assert!(amount_out > 0, "Amount out must be positive");

// Ensure minimum amount is respected
assert!(
    amount_out >= min_amount_out,
    "Output amount below minimum"
);

// Validate slippage
assert!(slippage <= 100, "Invalid slippage percentage");
let max_slippage = (amount_out as f64 * (slippage as f64 / 100.0)) as u64;
assert!(
    amount_out - min_amount_out <= max_slippage,
    "Slippage too high"
);
```

### 2. Token Validation

```rust
// Token mint addresses must be valid and different
assert!(token_in != token_out, "Cannot swap same token");
assert!(is_valid_token_mint(token_in), "Invalid input token");
assert!(is_valid_token_mint(token_out), "Invalid output token");
```

### 3. User Authorization

```rust
// Verify user public key is valid
assert!(
    is_valid_pubkey(user),
    "Invalid user public key"
);

// Ensure user has signed the transaction
assert!(
    verify_signature(user, signature),
    "Invalid signature"
);
```

### 4. Price Impact

```rust
// Calculate and validate price impact
let price_impact = calculate_price_impact(
    amount_in,
    amount_out,
    token_in_price,
    token_out_price
);

assert!(
    price_impact <= MAX_PRICE_IMPACT,
    "Price impact too high"
);
```

## Hash Commitment Structure

The hash commitment combines all critical swap parameters:

```rust
struct HashCommitment {
    token_in: [u8; 32],    // Input token mint
    token_out: [u8; 32],   // Output token mint
    amount_in: u64,        // Input amount
    amount_out: u64,       // Output amount
    user: [u8; 32],        // User public key
    nonce: [u8; 32],       // Random nonce for uniqueness
}
```

## Validation Process

1. **Input Validation**
   - Check all parameters are within valid ranges
   - Verify token addresses are valid
   - Ensure amounts meet minimum requirements

2. **Slippage Calculation**
   - Calculate maximum allowed slippage
   - Verify output amount respects slippage bounds
   - Ensure price impact is acceptable

3. **Authorization**
   - Verify user signature
   - Check transaction permissions
   - Validate nonce uniqueness

4. **Hash Generation**
   - Combine all parameters into commitment
   - Generate deterministic hash
   - Prepare for on-chain submission

## Security Considerations

### Privacy Guarantees

1. **Transaction Privacy**
   - Amounts are not revealed on-chain
   - Token pairs are hidden in hash
   - User identity is protected

2. **Front-running Protection**
   - Hash commitment hides swap details
   - MEV bots cannot extract value
   - Order privacy is maintained

### Potential Attacks

1. **Replay Attacks**
   - Prevented by unique nonce
   - Each proof can only be used once
   - Nonce included in hash commitment

2. **Parameter Tampering**
   - Hash binds all parameters
   - Cannot modify after proof generation
   - Atomic execution ensures consistency

3. **Invalid State**
   - Constraints prevent invalid states
   - All conditions checked before proof
   - Cannot generate proof for invalid swap

## Implementation Notes

1. **Performance Optimization**
   - Use efficient hash function
   - Minimize constraint complexity
   - Batch similar operations

2. **Gas Efficiency**
   - Minimize on-chain storage
   - Use compact commitment format
   - Optimize verification circuit

3. **Error Handling**
   - Clear error messages
   - Graceful failure modes
   - User-friendly error reporting 