import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { PrivateSwapVault } from "../../../target/types/private_swap_vault";

describe("private_swap_vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.PrivateSwapVault as Program<PrivateSwapVault>;

  it("Initializes vault", async () => {
    const [vaultPDA, bump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );
    
    await program.methods.initializeVault().accounts({
      vault: vaultPDA,
      authority: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();

    // Verify vault was initialized
    const vaultAccount = await program.account.Vault.fetch(vaultPDA);
    assert.ok(vaultAccount.bump === bump);
  });

  it("Submits proof", async () => {
    const [resultPDA] = await PublicKey.findProgramAddressSync(
      [Buffer.from("result"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const proofHash = Array.from(Buffer.alloc(32, 1)); // Sample proof hash
    const outputMint = new anchor.web3.PublicKey("TokenMintPubkeyHere");
    const outputAmount = new anchor.BN(1000000);
    const recipient = provider.wallet.publicKey;

    await program.methods.submitProof(proofHash, outputMint, outputAmount, recipient).accounts({
      relayer: provider.wallet.publicKey,
      swapResult: resultPDA,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();

    // Verify proof was submitted
    const swapResult = await program.account.SwapResult.fetch(resultPDA);
    assert.deepEqual(swapResult.proofHash, proofHash);
    assert.ok(swapResult.outputToken.equals(outputMint));
    assert.ok(swapResult.amount.eq(outputAmount));
  });
}); 