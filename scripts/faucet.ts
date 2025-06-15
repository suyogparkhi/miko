// Faucet script for distributing test tokens
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, mintTo, createMint } from '@solana/spl-token';
import fs from 'fs/promises';

const DEVNET_RPC = 'https://api.devnet.solana.com';

interface FaucetConfig {
  solAmount: number;
  tokenAmount: number;
  mintAuthority: string;
}

class TokenFaucet {
  private connection: Connection;
  private authority: Keypair;
  
  constructor(authorityPath: string) {
    this.connection = new Connection(DEVNET_RPC, 'confirmed');
    // Load authority keypair (this would need to be implemented)
  }
  
  async airdropSol(recipient: string, amount: number = 1): Promise<string> {
    try {
      const recipientPubkey = new PublicKey(recipient);
      const signature = await this.connection.requestAirdrop(
        recipientPubkey,
        amount * LAMPORTS_PER_SOL
      );
      
      await this.connection.confirmTransaction(signature);
      console.log(`Airdropped ${amount} SOL to ${recipient}`);
      return signature;
    } catch (error) {
      console.error('Airdrop failed:', error);
      throw error;
    }
  }
  
  async createTestToken(
    authority: Keypair,
    decimals: number = 6
  ): Promise<PublicKey> {
    try {
      const mint = await createMint(
        this.connection,
        authority,
        authority.publicKey,
        null,
        decimals
      );
      
      console.log(`Created test token mint: ${mint.toString()}`);
      return mint;
    } catch (error) {
      console.error('Token creation failed:', error);
      throw error;
    }
  }
  
  async mintTokens(
    mint: PublicKey,
    recipient: string,
    amount: number
  ): Promise<string> {
    try {
      const recipientPubkey = new PublicKey(recipient);
      
      // Get or create associated token account
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.authority,
        mint,
        recipientPubkey
      );
      
      // Mint tokens
      const signature = await mintTo(
        this.connection,
        this.authority,
        mint,
        tokenAccount.address,
        this.authority,
        amount
      );
      
      console.log(`Minted ${amount} tokens to ${recipient}`);
      return signature;
    } catch (error) {
      console.error('Token minting failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: ts-node faucet.ts <command> <recipient> [amount]');
    console.log('Commands: sol, token');
    process.exit(1);
  }
  
  const [command, recipient, amountStr] = args;
  const amount = parseFloat(amountStr) || 1;
  
  const faucet = new TokenFaucet('./relayer/wallet/relayer.json');
  
  try {
    switch (command) {
      case 'sol':
        await faucet.airdropSol(recipient, amount);
        break;
      case 'token':
        // TODO: Implement token faucet
        console.log('Token faucet not implemented yet');
        break;
      default:
        console.log('Unknown command:', command);
        process.exit(1);
    }
  } catch (error) {
    console.error('Faucet error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 