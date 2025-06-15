import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, utils } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Import the IDL
const idl = require('../idl/private_swap_vault.json');
const programId = new PublicKey(idl.metadata.address);

export function useVault() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [program, setProgram] = useState<Program | null>(null);

  useEffect(() => {
    if (!publicKey || !signTransaction) return;

    const provider = new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction,
        signAllTransactions,
      },
      { commitment: 'confirmed' }
    );

    const program = new Program(idl, programId, provider);
    setProgram(program);
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  const getVaultAddress = async (mint: PublicKey) => {
    if (!program) return null;

    const [vaultAddress] = await PublicKey.findProgramAddress(
      [Buffer.from('vault')],
      program.programId
    );

    return vaultAddress;
  };

  const getVaultTokenAccount = async (mint: PublicKey, vault: PublicKey) => {
    return await utils.token.associatedAddress({
      mint,
      owner: vault,
    });
  };

  const deposit = async (mint: PublicKey, amount: number) => {
    if (!program || !publicKey) throw new Error('Program not initialized');

    const vault = await getVaultAddress(mint);
    if (!vault) throw new Error('Vault not found');

    const userTokenAccount = await utils.token.associatedAddress({
      mint,
      owner: publicKey,
    });

    const vaultTokenAccount = await getVaultTokenAccount(mint, vault);

    return await program.methods
      .deposit(new web3.BN(amount))
      .accounts({
        vault,
        userTokenAccount,
        vaultTokenAccount,
        mint,
        user: publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  };

  const submitProof = async (proofHash: Buffer, amountIn: number, amountOut: number) => {
    if (!program || !publicKey) throw new Error('Program not initialized');

    return await program.methods
      .submitSwapProof(proofHash, new web3.BN(amountIn), new web3.BN(amountOut))
      .accounts({
        user: publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  };

  const executeSwap = async (
    swapAccount: PublicKey,
    vaultTokenAccount: PublicKey,
    userTokenAccount: PublicKey
  ) => {
    if (!program || !publicKey) throw new Error('Program not initialized');

    const vault = await getVaultAddress(null);
    if (!vault) throw new Error('Vault not found');

    return await program.methods
      .executeSwap()
      .accounts({
        vault,
        swap: swapAccount,
        vaultTokenAccount,
        userTokenAccount,
        user: publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  };

  return {
    program,
    getVaultAddress,
    getVaultTokenAccount,
    deposit,
    submitProof,
    executeSwap,
  };
} 