import { SystemProgram, LAMPORTS_PER_SOL, PublicKey, TransactionInstruction, Transaction } from "@solana/web3.js";
import { connection } from "@/lib/constants"
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { AnchorWallet, Wallet } from '@solana/wallet-adapter-react';
import BN from "bn.js";
import idl from "../idl/vault.json"

const VAULT_SEED = "vault";
const programID = new PublicKey(idl.address as string); 

export const getVaultProgram = (wallet: AnchorWallet) => {
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "confirmed",
    });
    return new Program(idl as Idl, provider);
  };


  export const getVaultPDA = async (user: PublicKey): Promise<[PublicKey, number]> => {
    return await PublicKey.findProgramAddress(
      [user.toBuffer(), Buffer.from(VAULT_SEED)],
      programID
    );
  };

  export const createVault = async (wallet: AnchorWallet) => {
    const program = getVaultProgram(wallet);
    const user = wallet.publicKey;
    const [vaultPda] = await getVaultPDA(user);
  
    const tx = await program.methods
      .createVault()
      .accounts({
        user,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  
    return tx;
  };

  export const depositToVault = async (wallet: AnchorWallet, amountSol: number) => {
    const program = getVaultProgram(wallet);
    const user = wallet.publicKey;
    const [vaultPda] = await getVaultPDA(user);
  
    const lamports = new BN(amountSol * LAMPORTS_PER_SOL);
  
    const tx = await program.methods
      .deposit(lamports)
      .accounts({
        user,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  
    return tx;
  };


  export const withdrawFromVault = async (
    wallet: AnchorWallet,
    recipient: PublicKey,
    amountSol: number
  ) => {
    const program = getVaultProgram(wallet);
    const user = wallet.publicKey;
    const [vaultPda] = await getVaultPDA(user);
  
    const lamports = new BN(amountSol * LAMPORTS_PER_SOL);
  
    const tx = await program.methods
      .withdraw(lamports)
      .accounts({
        user,
        vault: vaultPda,
        recipient,
      })
      .rpc();
  
    return tx;
  };


  export const getVaultBalance = async (wallet: AnchorWallet): Promise<number> => {
    const program = getVaultProgram(wallet);
    const user = wallet.publicKey;
    const [vaultPda] = await getVaultPDA(user);
  
    const accountData = await program.account["vaultAccount"].fetch(vaultPda);
    return accountData.balance.toNumber() / LAMPORTS_PER_SOL;
  };

  