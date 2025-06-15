use anchor_lang::prelude::*;

#[error_code]
pub enum SwapError {
    #[msg("Swap has already been executed")]
    AlreadyExecuted,
    #[msg("Invalid proof hash")]
    InvalidProofHash,
    #[msg("Insufficient vault balance")]
    InsufficientBalance,
    #[msg("Invalid token mint")]
    InvalidTokenMint,
} 