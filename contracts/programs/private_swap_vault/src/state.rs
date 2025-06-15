use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub bump: u8,
}

#[account]
pub struct SwapResult {
    pub proof_hash: [u8; 32],
    pub output_token: Pubkey,
    pub amount: u64,
} 