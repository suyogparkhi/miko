use anchor_lang::prelude::*;

declare_id!("2aur2Det6v69t2iyPNSuZCBkMrU3SZv1EHCHfDS9yjwK"); 

#[program]
pub mod vault {
    use super::*;

    pub fn create_vault(_ctx: Context<CreateVault>) -> Result<()> {
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &vault.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                vault.to_account_info(),
            ],
        )?;

        vault.balance += amount;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        require!(vault.balance >= amount, VaultError::InsufficientFunds);

        **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.recipient.try_borrow_mut_lamports()? += amount;

        vault.balance -= amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateVault<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 8,
        seeds = [user.key().as_ref(), b"vault"],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds = [user.key().as_ref(), b"vault"], bump)]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, seeds = [user.key().as_ref(), b"vault"], bump)]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: This can be any recipient address
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
}

#[account]
pub struct VaultAccount {
    pub balance: u64,
}

#[error_code]
pub enum VaultError {
    #[msg("Not enough funds to withdraw")]
    InsufficientFunds,
}
