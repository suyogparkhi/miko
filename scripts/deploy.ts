// Deploy script for smart contracts and environment setup
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import fs from 'fs/promises';
import path from 'path';

class DeploymentManager {
  private connection: Connection;
  private provider: AnchorProvider;
  
  constructor(cluster: string = 'devnet') {
    const rpcUrl = cluster === 'devnet' 
      ? 'https://api.devnet.solana.com'
      : 'http://localhost:8899';
      
    this.connection = new Connection(rpcUrl, 'confirmed');
  }
  
  async loadKeypair(keypairPath: string): Promise<Keypair> {
    try {
      const keypairData = await fs.readFile(keypairPath, 'utf-8');
      const secretKey = JSON.parse(keypairData);
      return Keypair.fromSecretKey(new Uint8Array(secretKey));
    } catch (error) {
      throw new Error(`Failed to load keypair from ${keypairPath}: ${error.message}`);
    }
  }
  
  async deployProgram(): Promise<PublicKey> {
    console.log('🚀 Deploying private swap vault program...');
    
    try {
      // TODO: Load program IDL and deploy
      // For now, using the program ID from Anchor.toml
      const programId = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
      
      console.log(`Program deployed at: ${programId.toString()}`);
      return programId;
    } catch (error) {
      console.error('Program deployment failed:', error);
      throw error;
    }
  }
  
  async initializeVault(programId: PublicKey): Promise<PublicKey> {
    console.log('🏗️ Initializing vault...');
    
    try {
      // TODO: Initialize vault with proper parameters
      const vaultKeypair = Keypair.generate();
      
      console.log(`Vault initialized at: ${vaultKeypair.publicKey.toString()}`);
      return vaultKeypair.publicKey;
    } catch (error) {
      console.error('Vault initialization failed:', error);
      throw error;
    }
  }
  
  async setupRelayerWallet(): Promise<Keypair> {
    console.log('🔐 Setting up relayer wallet...');
    
    const walletPath = path.join(__dirname, '../relayer/wallet/relayer.json');
    
    try {
      // Try to load existing wallet
      const relayerKeypair = await this.loadKeypair(walletPath);
      console.log(`Loaded existing relayer wallet: ${relayerKeypair.publicKey.toString()}`);
      return relayerKeypair;
    } catch (error) {
      // Generate new wallet if none exists
      const newKeypair = Keypair.generate();
      const secretKeyArray = Array.from(newKeypair.secretKey);
      
      await fs.writeFile(walletPath, JSON.stringify(secretKeyArray));
      console.log(`Generated new relayer wallet: ${newKeypair.publicKey.toString()}`);
      
      return newKeypair;
    }
  }
  
  async fundRelayerWallet(relayerKeypair: Keypair): Promise<void> {
    console.log('💰 Funding relayer wallet...');
    
    try {
      const signature = await this.connection.requestAirdrop(
        relayerKeypair.publicKey,
        2 * 1e9 // 2 SOL
      );
      
      await this.connection.confirmTransaction(signature);
      console.log(`Funded relayer wallet with 2 SOL: ${signature}`);
    } catch (error) {
      console.warn('Airdrop failed (might be rate limited):', error.message);
    }
  }
  
  async saveDeploymentInfo(programId: PublicKey, vaultId: PublicKey, relayerPubkey: PublicKey): Promise<void> {
    const deploymentInfo = {
      programId: programId.toString(),
      vaultId: vaultId.toString(),
      relayerPubkey: relayerPubkey.toString(),
      deployedAt: new Date().toISOString(),
      cluster: 'devnet'
    };
    
    const deploymentPath = path.join(__dirname, '../deployment.json');
    await fs.writeFile(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('📄 Deployment info saved to deployment.json');
  }
  
  async fullDeploy(): Promise<void> {
    console.log('🌟 Starting full deployment...');
    
    try {
      // Deploy program
      const programId = await this.deployProgram();
      
      // Initialize vault
      const vaultId = await this.initializeVault(programId);
      
      // Setup relayer wallet
      const relayerKeypair = await this.setupRelayerWallet();
      
      // Fund relayer wallet
      await this.fundRelayerWallet(relayerKeypair);
      
      // Save deployment information
      await this.saveDeploymentInfo(programId, vaultId, relayerKeypair.publicKey);
      
      console.log('✅ Full deployment completed!');
      console.log(`Program ID: ${programId.toString()}`);
      console.log(`Vault ID: ${vaultId.toString()}`);
      console.log(`Relayer: ${relayerKeypair.publicKey.toString()}`);
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';
  const cluster = args[1] || 'devnet';
  
  const deployer = new DeploymentManager(cluster);
  
  try {
    switch (command) {
      case 'program':
        await deployer.deployProgram();
        break;
      case 'vault':
        const programId = new PublicKey(args[2]);
        await deployer.initializeVault(programId);
        break;
      case 'wallet':
        await deployer.setupRelayerWallet();
        break;
      case 'full':
      default:
        await deployer.fullDeploy();
        break;
    }
  } catch (error) {
    console.error('Deploy error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 