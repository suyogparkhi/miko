import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { SystemProgram, PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import assert from "assert";

describe("vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Vault as Program<Vault>;

  const user = provider.wallet;
  let vaultPda: PublicKey;
  let vaultBump: number;

  const recipient = Keypair.generate();

  it("Airdrops SOL to user and recipient", async () => {
    await provider.connection.requestAirdrop(user.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(recipient.publicKey, 1 * LAMPORTS_PER_SOL);
  });

  it("Creates a vault PDA for the user", async () => {
    [vaultPda, vaultBump] = await PublicKey.findProgramAddressSync(
      [user.publicKey.toBuffer(), Buffer.from("vault")],
      program.programId
    );

    const tx = await program.methods
      .createVault()
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Vault created:", tx);
  });

  it("Deposits 0.001 SOL into vault", async () => {
    const depositAmount = new anchor.BN(0.001 * LAMPORTS_PER_SOL);

    const tx = await program.methods
      .deposit(depositAmount)
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Deposit tx:", tx);

    const vault = await program.account.vaultAccount.fetch(vaultPda);
    assert.ok(vault.balance.eq(depositAmount));
  });

  it("Withdraws 0.0005 SOL from vault to another wallet", async () => {
    const withdrawAmount = new anchor.BN(0.0005 * LAMPORTS_PER_SOL);

    const recipientBalanceBefore = await provider.connection.getBalance(recipient.publicKey);

    const tx = await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        recipient: recipient.publicKey,
      })
      .rpc();

    console.log("Withdraw tx:", tx);

    const vault = await program.account.vaultAccount.fetch(vaultPda);
    assert.ok(vault.balance.eq(new anchor.BN(0.0005 * LAMPORTS_PER_SOL)));

    const recipientBalanceAfter = await provider.connection.getBalance(recipient.publicKey);
    const diff = recipientBalanceAfter - recipientBalanceBefore;
    assert.ok(diff >= withdrawAmount.toNumber()); // Allowing for slight overhead
  });
});
