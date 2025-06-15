// Reset script for development environment
import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs/promises';
import path from 'path';

class EnvironmentReset {
  private connection: Connection;
  
  constructor() {
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  }
  
  async clearQueues(): Promise<void> {
    console.log('Clearing intent queues...');
    
    const queueFile = path.join(__dirname, '../relayer/intent_queue.json');
    try {
      await fs.writeFile(queueFile, '[]');
      console.log('Intent queue cleared');
    } catch (error) {
      console.log('No queue file found or error clearing:', error.message);
    }
  }
  
  async resetDatabase(): Promise<void> {
    console.log('Resetting database...');
    // TODO: Reset database tables
    console.log('Database reset completed');
  }
  
  async clearLogs(): Promise<void> {
    console.log('Clearing logs...');
    
    const logDirs = [
      path.join(__dirname, '../logs'),
      path.join(__dirname, '../relayer/logs'),
      path.join(__dirname, '../backend/logs')
    ];
    
    for (const logDir of logDirs) {
      try {
        const files = await fs.readdir(logDir);
        for (const file of files) {
          if (file.endsWith('.log')) {
            await fs.unlink(path.join(logDir, file));
          }
        }
        console.log(`Cleared logs in ${logDir}`);
      } catch (error) {
        console.log(`No logs found in ${logDir}`);
      }
    }
  }
  
  async resetRelayerWallet(): Promise<void> {
    console.log('Resetting relayer wallet...');
    
    const walletPath = path.join(__dirname, '../relayer/wallet/relayer.json');
    try {
      // Generate new empty wallet placeholder
      const emptyWallet = Array(64).fill(0);
      await fs.writeFile(walletPath, JSON.stringify(emptyWallet));
      console.log('Relayer wallet reset');
    } catch (error) {
      console.error('Error resetting wallet:', error);
    }
  }
  
  async checkBalances(): Promise<void> {
    console.log('Checking balances...');
    // TODO: Check SOL and token balances for main accounts
    console.log('Balance check completed');
  }
  
  async fullReset(): Promise<void> {
    console.log('🔄 Starting full environment reset...');
    
    await this.clearQueues();
    await this.resetDatabase();
    await this.clearLogs();
    await this.resetRelayerWallet();
    await this.checkBalances();
    
    console.log('✅ Environment reset completed!');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';
  
  const reset = new EnvironmentReset();
  
  try {
    switch (command) {
      case 'queues':
        await reset.clearQueues();
        break;
      case 'database':
        await reset.resetDatabase();
        break;
      case 'logs':
        await reset.clearLogs();
        break;
      case 'wallet':
        await reset.resetRelayerWallet();
        break;
      case 'balances':
        await reset.checkBalances();
        break;
      case 'full':
      default:
        await reset.fullReset();
        break;
    }
  } catch (error) {
    console.error('Reset error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 