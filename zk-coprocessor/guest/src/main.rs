risc0_zkvm::guest::entry!(main);
use risc0_zkvm::guest::env;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct SwapParams {
    input_amount: u64,
    output_amount: u64,
    input_mint: [u8; 32],
    output_mint: [u8; 32],
    recipient: [u8; 32],
}

fn main() {
    // Read swap parameters from the host
    let params: SwapParams = env::read();
    
    // Validate swap parameters (basic validation)
    assert!(params.input_amount > 0, "Input amount must be positive");
    assert!(params.output_amount > 0, "Output amount must be positive");
    assert_ne!(params.input_mint, params.output_mint, "Input and output mints must be different");
    
    // Generate proof hash by combining all parameters
    let mut hash_input = Vec::new();
    hash_input.extend_from_slice(&params.input_amount.to_le_bytes());
    hash_input.extend_from_slice(&params.output_amount.to_le_bytes());
    hash_input.extend_from_slice(&params.input_mint);
    hash_input.extend_from_slice(&params.output_mint);
    hash_input.extend_from_slice(&params.recipient);
    
    // Generate SHA256 hash (32 bytes)
    let proof_hash = risc0_zkvm::sha::sha256(&hash_input);
    
    // Commit the proof hash as output
    env::commit(&proof_hash);
} 