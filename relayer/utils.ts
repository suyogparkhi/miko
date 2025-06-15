// Utility functions for the relayer
import { PublicKey, Keypair } from '@solana/web3.js';
import fs from 'fs/promises';

export class RelayerUtils {
  
  // Load Solana keypair from JSON file
  static async loadKeypairFromFile(filePath: string): Promise<Keypair> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const secretKey = JSON.parse(data);
      return Keypair.fromSecretKey(new Uint8Array(secretKey));
    } catch (error) {
      throw new Error(`Failed to load keypair from ${filePath}: ${error.message}`);
    }
  }
  
  // Generate a new random keypair
  static generateKeypair(): Keypair {
    return Keypair.generate();
  }
  
  // Save keypair to JSON file
  static async saveKeypairToFile(keypair: Keypair, filePath: string): Promise<void> {
    try {
      const secretKeyArray = Array.from(keypair.secretKey);
      await fs.writeFile(filePath, JSON.stringify(secretKeyArray));
    } catch (error) {
      throw new Error(`Failed to save keypair to ${filePath}: ${error.message}`);
    }
  }
  
  // Validate Solana public key
  static isValidPublicKey(pubkeyString: string): boolean {
    try {
      new PublicKey(pubkeyString);
      return true;
    } catch {
      return false;
    }
  }
  
  // Generate unique ID for swap intents
  static generateIntentId(): string {
    return `intent_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  
  // Format SOL amount for display
  static formatSolAmount(lamports: number): string {
    return (lamports / 1e9).toFixed(6) + ' SOL';
  }
  
  // Convert SOL to lamports
  static solToLamports(sol: number): number {
    return Math.floor(sol * 1e9);
  }
  
  // Convert lamports to SOL
  static lamportsToSol(lamports: number): number {
    return lamports / 1e9;
  }
  
  // Sleep utility
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Retry function with exponential backoff
  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries) {
          throw lastError;
        }
        
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  // Validate swap parameters
  static validateSwapParams(params: {
    inputMint: string;
    outputMint: string;
    inputAmount: number;
    minOutputAmount: number;
  }): boolean {
    const { inputMint, outputMint, inputAmount, minOutputAmount } = params;
    
    return (
      this.isValidPublicKey(inputMint) &&
      this.isValidPublicKey(outputMint) &&
      inputAmount > 0 &&
      minOutputAmount > 0 &&
      inputMint !== outputMint
    );
  }
  
  // Get current timestamp
  static getCurrentTimestamp(): number {
    return Date.now();
  }
  
  // Check if timestamp is expired
  static isExpired(timestamp: number, expirationMs: number): boolean {
    return Date.now() - timestamp > expirationMs;
  }
} 