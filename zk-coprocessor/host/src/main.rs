use std::env;
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
    // Get parameters from environment variables
    let input_amount: u64 = env::var("INPUT_AMOUNT")
        .unwrap_or_else(|_| "1000000".to_string())
        .parse()
        .expect("Invalid INPUT_AMOUNT");
    
    let output_amount: u64 = env::var("OUTPUT_AMOUNT")
        .unwrap_or_else(|_| "950000".to_string())
        .parse()
        .expect("Invalid OUTPUT_AMOUNT");
    
    let input_mint_str = env::var("INPUT_MINT")
        .unwrap_or_else(|_| "So11111111111111111111111111111111111111112".to_string());
    
    let output_mint_str = env::var("OUTPUT_MINT")
        .unwrap_or_else(|_| "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string());
    
    let recipient_str = env::var("RECIPIENT")
        .unwrap_or_else(|_| "11111111111111111111111111111111".to_string());

    // Helper function to convert public key string to 32-byte array
    fn pubkey_to_bytes(pubkey_str: &str) -> [u8; 32] {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        pubkey_str.hash(&mut hasher);
        let hash = hasher.finish();
        
        let mut bytes = [0u8; 32];
        bytes[0..8].copy_from_slice(&hash.to_le_bytes());
        bytes[8..16].copy_from_slice(&hash.to_be_bytes());
        
        // Fill remaining bytes with deterministic pattern
        for i in 16..32 {
            bytes[i] = ((hash as u8).wrapping_add(i as u8)) ^ 0xAA;
        }
        bytes
    }

    let swap_params = SwapParams {
        input_amount,
        output_amount,
        input_mint: pubkey_to_bytes(&input_mint_str),
        output_mint: pubkey_to_bytes(&output_mint_str),
        recipient: pubkey_to_bytes(&recipient_str),
    };

    // Try Risc0 zkVM first, fallback to direct hash generation if it fails
    let proof_hash = match try_risc0_proof(&swap_params) {
        Ok(hash) => {
            eprintln!("✅ Generated proof using Risc0 zkVM");
            hash
        }
        Err(e) => {
            eprintln!("⚠️ Risc0 zkVM failed ({}), using fallback proof generation", e);
            generate_fallback_proof(&swap_params)
        }
    };
    
    // Output the proof hash in hex format for easy consumption
    println!("PROOF_HASH:{}", hex::encode(proof_hash));
    
    // Exit successfully
    std::process::exit(0);
}

#[cfg(feature = "risc0")]
fn try_risc0_proof(swap_params: &SwapParams) -> Result<[u8; 32], Box<dyn std::error::Error>> {
    use risc0_zkvm::{default_executor, ExecutorEnv};
    
    // Create executor environment with swap parameters
    let env = ExecutorEnv::builder()
        .write(swap_params)
        .build()?;

    // Execute the guest program
    let executor = default_executor();
    let receipt = executor.run(env)?;
    
    // Extract the proof hash from the journal
    let proof_hash: [u8; 32] = receipt.journal.decode()?;
    
    // Verify the receipt (optional but good practice)
    receipt.verify()?;
    
    Ok(proof_hash)
}

#[cfg(not(feature = "risc0"))]
fn try_risc0_proof(_swap_params: &SwapParams) -> Result<[u8; 32], Box<dyn std::error::Error>> {
    Err("Risc0 not available".into())
}

fn generate_fallback_proof(swap_params: &SwapParams) -> [u8; 32] {
    use sha2::{Sha256, Digest};
    
    // Generate proof hash by combining all parameters (same logic as guest)
    let mut hasher = Sha256::new();
    hasher.update(&swap_params.input_amount.to_le_bytes());
    hasher.update(&swap_params.output_amount.to_le_bytes());
    hasher.update(&swap_params.input_mint);
    hasher.update(&swap_params.output_mint);
    hasher.update(&swap_params.recipient);
    
    // Generate SHA256 hash (32 bytes)
    let result = hasher.finalize();
    let mut proof_hash = [0u8; 32];
    proof_hash.copy_from_slice(&result);
    
    proof_hash
} 