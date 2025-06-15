import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import express from 'express';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(express.json());

// Configuration
const MOCK_MODE = process.env.MOCK_MODE === 'true';

// Initialize Solana connection
const connection = new Connection(process.env.RPC_ENDPOINT || 'https://api.devnet.solana.com');

// Initialize wallet with error handling
let wallet: Keypair;
try {
  const privateKeyString = process.env.RELAYER_PRIVATE_KEY;
  if (!privateKeyString || privateKeyString === '[]') {
    throw new Error('RELAYER_PRIVATE_KEY not set in environment');
  }
  const privateKeyArray = JSON.parse(privateKeyString);
  if (!Array.isArray(privateKeyArray) || privateKeyArray.length !== 64) {
    throw new Error('RELAYER_PRIVATE_KEY must be a 64-element array');
  }
  wallet = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
  console.log('✅ Wallet loaded successfully:', wallet.publicKey.toString());
} catch (error) {
  console.error('❌ Failed to load wallet:', error);
  console.log('💡 Generate a new keypair with: node generate-keypair.js');
  process.exit(1);
}

// Load the IDL 
const idlPath = path.join(__dirname, '../contracts/target/idl/private_swap_vault.json');
let idl: any;
try {
  idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
} catch (error) {
  console.error('Failed to load IDL:', error);
  if (!MOCK_MODE) {
    process.exit(1);
  }
  console.log('🔄 Running in mock mode without IDL');
}

// Initialize Anchor program (only in non-mock mode)
let provider: AnchorProvider | null = null;
let program: Program | null = null;
let programId: PublicKey;

if (!MOCK_MODE && idl) {
  provider = new AnchorProvider(
    connection,
    new Wallet(wallet),
    { commitment: 'confirmed' }
  );

  programId = new PublicKey(process.env.PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
  program = new Program(idl, provider);
} else {
  programId = new PublicKey(process.env.PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
}

interface SwapRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  slippage: number;
  user: string;
}

interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: any;
  priceImpactPct: string;
  routePlan: any[];
}

async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
): Promise<JupiterQuoteResponse> {
  const response = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`
  );
  
  if (!response.ok) {
    throw new Error(`Jupiter quote failed: ${response.statusText}`);
  }
  
  return await response.json() as JupiterQuoteResponse;
}

async function generateMockProof(
  inputAmount: number,
  outputAmount: number,
  inputMint: string,
  outputMint: string,
  recipient: string
): Promise<string> {
  // Generate a deterministic but unique 32-byte hash for testing
  const input = `${inputAmount}-${outputAmount}-${inputMint}-${outputMint}-${recipient}`;
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  console.log('🧪 Generated mock proof hash:', hash);
  return hash;
}

async function generateZkProof(
  inputAmount: number,
  outputAmount: number,
  inputMint: string,
  outputMint: string,
  recipient: string
): Promise<string> {
  if (MOCK_MODE) {
    console.log('🔄 Mock mode: generating mock proof...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    return generateMockProof(inputAmount, outputAmount, inputMint, outputMint, recipient);
  }

  try {
    console.log('Generating ZK proof with params:', {
      inputAmount,
      outputAmount,
      inputMint,
      outputMint,
      recipient
    });

    // Build the zk-coprocessor if not already built
    const zkCoprocessorPath = path.join(__dirname, '../zk-coprocessor');
    
    // Build guest and host
    console.log('Building ZK coprocessor...');
    execSync('cargo build --release', { 
      cwd: path.join(zkCoprocessorPath, 'guest'),
      stdio: 'inherit'
    });
    
    execSync('cargo build --release', { 
      cwd: path.join(zkCoprocessorPath, 'host'),
      stdio: 'inherit'
    });

    // Run host to generate proof
    console.log('Generating proof...');
    const proofResult = execSync('cargo run --release --bin private-swap-prover', {
      cwd: path.join(zkCoprocessorPath, 'host'),
      env: {
        ...process.env,
        INPUT_AMOUNT: inputAmount.toString(),
        OUTPUT_AMOUNT: outputAmount.toString(),
        INPUT_MINT: inputMint,
        OUTPUT_MINT: outputMint,
        RECIPIENT: recipient
      }
    });

    // Extract proof hash from output
    const output = proofResult.toString();
    console.log('ZK coprocessor output:', output);
    
    const proofMatch = output.match(/PROOF_HASH:([a-fA-F0-9]{64})/);
    if (!proofMatch) {
      throw new Error('Failed to extract proof hash from zk-coprocessor output');
    }
    
    const proofHash = proofMatch[1];
    console.log('Generated proof hash:', proofHash);
    
    return proofHash;
  } catch (error) {
    console.error('ZK proof generation failed:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    wallet: wallet.publicKey.toString(),
    programId: programId.toString(),
    mockMode: MOCK_MODE,
    zkAvailable: !MOCK_MODE
  });
});

// Get Jupiter quote endpoint
app.post('/quote', async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn, slippage } = req.body;
    
    const quote = await getJupiterQuote(tokenIn, tokenOut, amountIn, slippage || 50);
    
    res.json({
      success: true,
      quote
    });
  } catch (error) {
    console.error('Quote failed:', error);
    res.status(500).json({ 
      error: 'Quote failed', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Submit proof endpoint (separate from actual swap execution)
app.post('/submit-proof', async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn, amountOut, user } = req.body;

    // Validate inputs
    if (!tokenIn || !tokenOut || !amountIn || !amountOut || !user) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate ZK proof (real or mock)
    const proofHash = await generateZkProof(amountIn, amountOut, tokenIn, tokenOut, user);

    if (MOCK_MODE) {
      // Return mock response without calling smart contract
      res.json({
        success: true,
        proofHash,
        submitProofTx: 'mock_transaction_' + Date.now(),
        swapResultPda: 'mock_pda_' + Date.now(),
        message: 'Mock proof generated successfully. In production, user would call withdraw() to claim tokens.',
        mockMode: true
      });
      return;
    }

    // Create swap result account keypair
    const swapResultKeypair = Keypair.generate();

    // Convert proof hash to 32-byte array
    const proofHashBytes = Buffer.from(proofHash, 'hex');
    if (proofHashBytes.length !== 32) {
      throw new Error('Proof hash must be exactly 32 bytes');
    }

    // Submit proof to Solana program
    console.log('Submitting proof to smart contract...');
    const tx = await program!.methods
      .submitProof(
        Array.from(proofHashBytes), // proof_hash as [u8; 32]
        new PublicKey(tokenOut),    // output_mint
        new anchor.BN(amountOut),   // output_amount  
        new PublicKey(user)         // recipient
      )
      .accounts({
        swapResult: swapResultKeypair.publicKey,
        relayer: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([swapResultKeypair])
      .rpc();

    console.log('Proof submitted successfully:', tx);

    res.json({
      success: true,
      proofHash,
      submitProofTx: tx,
      swapResultPda: swapResultKeypair.publicKey.toString(),
      message: 'Proof submitted successfully. User can now call withdraw() to claim tokens.'
    });
  } catch (error) {
    console.error('Proof submission failed:', error);
    res.status(500).json({ 
      error: 'Proof submission failed', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Test ZK proof generation endpoint
app.post('/test-zk', async (req, res) => {
  try {
    const { inputAmount = 1000000, outputAmount = 950000, inputMint = 'So11111111111111111111111111111111111111112', outputMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', recipient } = req.body;
    
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient address required' });
    }

    const proofHash = await generateZkProof(inputAmount, outputAmount, inputMint, outputMint, recipient);
    
    res.json({
      success: true,
      proofHash,
      parameters: {
        inputAmount,
        outputAmount,
        inputMint,
        outputMint,
        recipient
      },
      mockMode: MOCK_MODE
    });
  } catch (error) {
    console.error('ZK test failed:', error);
    res.status(500).json({ 
      error: 'ZK test failed', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log(`🚀 Starting relayer in ${MOCK_MODE ? 'MOCK' : 'PRODUCTION'} mode`);
    
    if (!MOCK_MODE) {
      // Test ZK coprocessor on startup
      console.log('Testing ZK coprocessor...');
      try {
        await generateZkProof(
          1000000, 
          950000, 
          'So11111111111111111111111111111111111111112', 
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          wallet.publicKey.toString()
        );
        console.log('✅ ZK coprocessor test successful');
      } catch (error) {
        console.log('⚠️ ZK coprocessor test failed:', error instanceof Error ? error.message : String(error));
        console.log('Consider enabling MOCK_MODE=true for testing');
      }
    } else {
      console.log('🧪 Mock mode enabled - ZK proofs will be simulated');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Relayer service running on port ${PORT}`);
      console.log(`📝 Program ID: ${programId.toString()}`);
      console.log(`🔑 Relayer wallet: ${wallet.publicKey.toString()}`);
      console.log(`🌐 RPC endpoint: ${connection.rpcEndpoint}`);
      console.log(`🔄 Mock mode: ${MOCK_MODE ? 'ENABLED' : 'DISABLED'}`);
      console.log('');
      console.log('Available endpoints:');
      console.log('  GET  /health - Health check');
      console.log('  POST /quote - Get Jupiter quote');
      console.log('  POST /submit-proof - Submit ZK proof to contract');
      console.log('  POST /test-zk - Test ZK proof generation');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error); 