// Tests for private swap vault smart contract
import { expect } from 'chai';
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, setProvider } from '@coral-xyz/anchor';
import * as anchor from "@coral-xyz/anchor";
import { PrivateSwapVault } from "../target/types/private_swap_vault";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress
} from "@solana/spl-token";

describe("private-swap-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PrivateSwapVault as Program<PrivateSwapVault>;
  
  // Test accounts
  let authority: anchor.web3.Keypair;
  let user: anchor.web3.Keypair;
  let relayer: anchor.web3.Keypair;
  
  // Token accounts
  let mint: anchor.web3.PublicKey;
  let userTokenAccount: anchor.web3.PublicKey;
  let vaultTokenAccount: anchor.web3.PublicKey;
  
  // PDAs
  let vaultPda: anchor.web3.PublicKey;
  let vaultBump: number;
  
  // Swap result account
  let swapResultKeypair: anchor.web3.Keypair;

  before(async () => {
    // Initialize keypairs
    authority = anchor.web3.Keypair.generate();
    user = anchor.web3.Keypair.generate();
    relayer = anchor.web3.Keypair.generate();
    swapResultKeypair = anchor.web3.Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(authority.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(relayer.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);

    // Wait for airdrops to confirm
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create mint
    mint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      9 // 9 decimals
    );

    // Find vault PDA
    [vaultPda, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );

    // Create associated token accounts
    userTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      user,
      mint,
      user.publicKey
    );

    vaultTokenAccount = await getAssociatedTokenAddress(
      mint,
      vaultPda,
      true // allowOwnerOffCurve
    );

    // Mint tokens to user
    await mintTo(
      provider.connection,
      authority,
      mint,
      userTokenAccount,
      authority,
      1000 * 10**9 // 1000 tokens with 9 decimals
    );
  });

  it("Initializes the vault", async () => {
    await program.methods
      .initializeVault()
      .accounts({
        vault: vaultPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPda);
    expect(vaultAccount.bump).to.equal(vaultBump);
  });

  it("Deposits tokens into the vault", async () => {
    const depositAmount = new anchor.BN(100 * 10**9); // 100 tokens

    await program.methods
      .deposit(depositAmount)
      .accounts({
        vault: vaultPda,
        userToken: userTokenAccount,
        vaultToken: vaultTokenAccount,
        mint: mint,
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Verify token transfer
    const vaultTokenBalance = await provider.connection.getTokenAccountBalance(vaultTokenAccount);
    expect(vaultTokenBalance.value.amount).to.equal(depositAmount.toString());
  });

  it("Submits a proof for token swap", async () => {
    const proofHash = Array.from(Buffer.from("test_proof_hash_12345678901234567890", "utf8"));
    const outputMint = anchor.web3.Keypair.generate().publicKey;
    const outputAmount = new anchor.BN(95 * 10**9); // 95 tokens (after fees)
    const recipient = user.publicKey;

    await program.methods
      .submitProof(proofHash, outputMint, outputAmount, recipient)
      .accounts({
        swapResult: swapResultKeypair.publicKey,
        relayer: relayer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([relayer, swapResultKeypair])
      .rpc();

    const swapResultAccount = await program.account.swapResult.fetch(swapResultKeypair.publicKey);
    expect(swapResultAccount.proofHash).to.deep.equal(proofHash);
    expect(swapResultAccount.outputToken.toString()).to.equal(outputMint.toString());
    expect(swapResultAccount.amount.toString()).to.equal(outputAmount.toString());
    expect(swapResultAccount.recipient.toString()).to.equal(recipient.toString());
    expect(swapResultAccount.isExecuted).to.be.false;
  });

  it("Withdraws tokens from the vault", async () => {
    // Create user's output token account (this would normally be done by the client)
    const userOutputTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      user,
      mint, // Using same mint for simplicity in test
      user.publicKey
    );

    const initialBalance = await provider.connection.getTokenAccountBalance(userOutputTokenAccount);
    
    await program.methods
      .withdraw()
      .accounts({
        vault: vaultPda,
        swapResult: swapResultKeypair.publicKey,
        vaultToken: vaultTokenAccount,
        userToken: userOutputTokenAccount,
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    // Verify tokens were transferred
    const finalBalance = await provider.connection.getTokenAccountBalance(userOutputTokenAccount);
    const expectedAmount = 95 * 10**9; // Amount from proof
    expect(parseInt(finalBalance.value.amount) - parseInt(initialBalance.value.amount))
      .to.equal(expectedAmount);

    // Verify swap result account was closed
    try {
      await program.account.swapResult.fetch(swapResultKeypair.publicKey);
      expect.fail("SwapResult account should have been closed");
    } catch (error) {
      expect(error.message).to.include("Account does not exist");
    }
  });

  it("Fails to withdraw with wrong recipient", async () => {
    // Create a new swap result with a different recipient
    const wrongRecipientKeypair = anchor.web3.Keypair.generate();
    const wrongSwapResult = anchor.web3.Keypair.generate();
    
    await provider.connection.requestAirdrop(wrongRecipientKeypair.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const proofHash = Array.from(Buffer.from("test_proof_hash_wrong_recipient_12345", "utf8"));
    const outputMint = mint;
    const outputAmount = new anchor.BN(50 * 10**9);
    const recipient = wrongRecipientKeypair.publicKey; // Different recipient

    // Submit proof with different recipient
    await program.methods
      .submitProof(proofHash, outputMint, outputAmount, recipient)
      .accounts({
        swapResult: wrongSwapResult.publicKey,
        relayer: relayer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([relayer, wrongSwapResult])
      .rpc();

    // Try to withdraw with original user (should fail)
    const userOutputTokenAccount = await getAssociatedTokenAddress(mint, user.publicKey);
    
    try {
      await program.methods
        .withdraw()
        .accounts({
          vault: vaultPda,
          swapResult: wrongSwapResult.publicKey,
          vaultToken: vaultTokenAccount,
          userToken: userOutputTokenAccount,
          user: user.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();
      
      expect.fail("Should have failed with InvalidRecipient error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidRecipient");
    }
  });
}); 