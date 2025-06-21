import { Keypair } from '@solana/web3.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const secretsDir = path.resolve('secrets');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// In-memory storage for temporary wallets (better than file system for security)
const walletStore = new Map();

export async function generateWalletAndStore() {
  try {
    // Ensure secrets directory exists (for backup purposes)
    await fs.mkdir(secretsDir, { recursive: true });

    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const secretKey = Array.from(keypair.secretKey);
    
    // Store in memory
    walletStore.set(publicKey, {
      secretKey,
      createdAt: Date.now(),
      used: false
    });
    
    // Optional: Also store encrypted backup to file
    const secretKeyPath = path.join(secretsDir, `${publicKey}.json`);
    const encryptedSecretKey = encrypt(JSON.stringify(secretKey));
    await fs.writeFile(secretKeyPath, JSON.stringify({
      encryptedSecretKey,
      createdAt: Date.now()
    }));

    console.log(`Generated new wallet: ${publicKey}`);
    
    // Schedule cleanup (remove after 1 hour)
    setTimeout(() => {
      cleanupWallet(publicKey);
    }, 60 * 60 * 1000); // 1 hour

    return {
      publicKey,
      secretKeyPath: secretKeyPath // For backward compatibility
    };
  } catch (error) {
    console.error('Error generating wallet:', error);
    throw new Error(`Failed to generate wallet: ${error.message}`);
  }
}

export async function loadKeypair(publicKey) {
  try {
    // Try to load from memory first
    const walletData = walletStore.get(publicKey);
    if (walletData) {
      walletData.used = true;
      const secretKey = Uint8Array.from(walletData.secretKey);
      return Keypair.fromSecretKey(secretKey);
    }
    
    // Fallback to file system (decrypt)
    const secretKeyPath = path.join(secretsDir, `${publicKey}.json`);
    const fileContent = await fs.readFile(secretKeyPath, 'utf-8');
    const { encryptedSecretKey } = JSON.parse(fileContent);
    const decryptedSecretKey = decrypt(encryptedSecretKey);
    const secretKey = Uint8Array.from(JSON.parse(decryptedSecretKey));
    
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    console.error(`Error loading keypair for ${publicKey}:`, error);
    throw new Error(`Failed to load wallet: ${error.message}`);
  }
}

export async function cleanupWallet(publicKey) {
  try {
    // Remove from memory
    walletStore.delete(publicKey);
    
    // Remove file
    const secretKeyPath = path.join(secretsDir, `${publicKey}.json`);
    await fs.unlink(secretKeyPath).catch(() => {}); // Ignore if file doesn't exist
    
    console.log(`Cleaned up wallet: ${publicKey}`);
  } catch (error) {
    console.error(`Error cleaning up wallet ${publicKey}:`, error);
  }
}

// Cleanup old wallets on startup
export async function cleanupOldWallets() {
  try {
    const files = await fs.readdir(secretsDir).catch(() => []);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(secretsDir, file);
        const content = await fs.readFile(filePath, 'utf-8').catch(() => null);
        if (content) {
          const { createdAt } = JSON.parse(content);
          if (now - createdAt > maxAge) {
            await fs.unlink(filePath);
            console.log(`Cleaned up old wallet file: ${file}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

function encrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedData) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Initialize cleanup on module load
cleanupOldWallets(); 