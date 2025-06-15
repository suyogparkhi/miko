# Zero-Knowledge Proof Flow

## Overview

The private swap system uses Risc0 zkVM to generate zero-knowledge proofs that validate swap parameters without revealing them on-chain. Instead of submitting the actual swap details to the blockchain, we submit a hash commitment that proves the validity of the swap while maintaining privacy.

## Components

1. **Risc0 zkVM Prover**
   - Runs off-chain in the relayer service
   - Takes swap parameters as private inputs
   - Validates swap conditions
   - Generates a hash commitment

2. **Hash Commitment**
   - Contains:
     - Token input mint
     - Token output mint
     - Amount in
     - Amount out
     - User public key
   - Stored on-chain without revealing actual values

3. **On-chain Verification**
   - Verifies the hash commitment
   - Ensures swap execution matches committed parameters
   - No direct ZK verification on-chain (for efficiency)

## Proof Generation Process

1. **User Input**
   ```typescript
   interface SwapParams {
     token_in: PublicKey;    // Input token mint
     token_out: PublicKey;   // Output token mint
     amount_in: u64;         // Input amount
     amount_out: u64;        // Expected output amount
     min_amount_out: u64;    // Minimum output with slippage
     slippage: u8;          // Allowed slippage percentage
     user: PublicKey;       // User's wallet
   }
   ```

2. **Prover Validation**
   - Checks if `amount_out >= min_amount_out`
   - Validates slippage is within bounds
   - Ensures amounts are positive
   - Verifies token mints are valid

3. **Hash Generation**
   ```rust
   let mut hasher = Sha256::new();
   hasher.update(&swap_params.token_in);
   hasher.update(&swap_params.token_out);
   hasher.update(&swap_params.amount_in.to_le_bytes());
   hasher.update(&swap_params.amount_out.to_le_bytes());
   hasher.update(&swap_params.user);
   let hash_result = hasher.finalize();
   ```

## Security Properties

1. **Privacy**
   - Actual swap amounts are not revealed on-chain
   - Only hash commitments are stored
   - Prevents front-running and MEV

2. **Correctness**
   - ZK proof ensures swap parameters are valid
   - Hash commitment binds execution to proven parameters
   - Cannot execute with different parameters than proven

3. **Atomicity**
   - Swap execution is atomic with proof verification
   - Either both succeed or both fail
   - No partial execution possible

## Limitations

1. **Performance**
   - ZK proof generation adds latency
   - Not suitable for high-frequency trading
   - Proof generation takes ~1-2 seconds

2. **Cost**
   - Additional gas cost for hash storage
   - Relayer must pay for proof generation
   - Higher total transaction cost

## Future Improvements

1. **Recursive Proofs**
   - Batch multiple swaps in single proof
   - Reduce per-swap overhead
   - Improve throughput

2. **On-chain Verification**
   - Add lightweight ZK verification circuit
   - Stronger security guarantees
   - Trade-off with gas costs

3. **Privacy Enhancements**
   - Add token amount privacy
   - Hide token types
   - Full transaction privacy 