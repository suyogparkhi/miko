pub mod error;
pub mod state;

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod private_swap_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token.to_account_info(),
            to: ctx.accounts.vault_token.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;
        Ok(())
    }

    pub fn submit_proof(ctx: Context<SubmitProof>, proof_hash: [u8; 32], output_mint: Pubkey, output_amount: u64, recipient: Pubkey) -> Result<()> {
        let swap = &mut ctx.accounts.swap_result;
        swap.proof_hash = proof_hash;
        swap.output_token = output_mint;
        swap.amount = output_amount;
        swap.recipient = recipient;
        swap.is_executed = false;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let swap_result = &ctx.accounts.swap_result;
        
        // Validate that the user is the intended recipient
        require!(
            swap_result.recipient == ctx.accounts.user.key(),
            SwapError::InvalidRecipient
        );
        
        // Validate that the swap hasn't been executed already
        require!(
            !swap_result.is_executed,
            SwapError::AlreadyExecuted
        );

        let seeds = &[b"vault".as_ref(), &[ctx.accounts.vault.bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token.to_account_info(),
            to: ctx.accounts.user_token.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new_with_signer(cpi_program, cpi_accounts, signer), swap_result.amount)?;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 1,
        seeds = [b"vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault
    )]
    pub vault_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitProof<'info> {
    #[account(
        init,
        payer = relayer,
        space = 8 + 32 + 32 + 8 + 32 + 1  // discriminator + proof_hash + output_token + amount + recipient + is_executed
    )]
    pub swap_result: Account<'info, SwapResult>,
    #[account(mut)]
    pub relayer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        close = user
    )]
    pub swap_result: Account<'info, SwapResult>,
    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Vault {
    pub bump: u8,
}

#[account]
pub struct SwapResult {
    pub proof_hash: [u8; 32],
    pub output_token: Pubkey,
    pub amount: u64,
    pub recipient: Pubkey,
    pub is_executed: bool,
}

#[error_code]
pub enum SwapError {
    #[msg("Swap has already been executed")]
    AlreadyExecuted,
    #[msg("Invalid recipient for this swap")]
    InvalidRecipient,
} 