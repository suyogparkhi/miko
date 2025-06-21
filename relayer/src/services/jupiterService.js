import axios from 'axios';
import { loadKeypair } from './walletService.js';
import { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  sendAndConfirmTransaction,
  VersionedTransaction
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';

const JUPITER_API = 'https://quote-api.jup.ag/v6';
const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC, 'confirmed');

// Native SOL mint address
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export async function getSwapQuote({ fromToken, toToken, amount, slippageBps = 50 }) {
  try {
    console.log(`Getting quote: ${amount} ${fromToken} -> ${toToken}`);
    
    const params = new URLSearchParams({
      inputMint: fromToken,
      outputMint: toToken,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
      swapMode: 'ExactIn',
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false'
    });

    const response = await axios.get(`${JUPITER_API}/quote?${params}`);
    
    if (!response.data) {
      throw new Error('No quote received from Jupiter');
    }

    console.log('Quote received successfully');
    return response.data;
  } catch (error) {
    console.error('Error getting swap quote:', error.response?.data || error.message);
    throw new Error(`Failed to get swap quote: ${error.response?.data?.error || error.message}`);
  }
}

export async function getSwapTransaction(quoteResponse, userPublicKey) {
  try {
    console.log('Getting swap transaction for:', userPublicKey);
    
    const response = await axios.post(`${JUPITER_API}/swap`, {
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      useSharedAccounts: true,
      feeAccount: undefined,
      trackingAccount: undefined,
      prioritizationFeeLamports: 'auto'
    });

    if (!response.data.swapTransaction) {
      throw new Error('No swap transaction received from Jupiter');
    }

    console.log('Swap transaction received successfully');
    return response.data.swapTransaction;
  } catch (error) {
    console.error('Error getting swap transaction:', error.response?.data || error.message);
    throw new Error(`Failed to get swap transaction: ${error.response?.data?.error || error.message}`);
  }
}

export async function executeSwapAndTransfer({ 
  tempWalletAddress, 
  destinationWallet, 
  quoteResponse 
}) {
  try {
    console.log(`Executing swap and transfer from ${tempWalletAddress} to ${destinationWallet}`);
    
    // Load the temporary wallet keypair
    const tempKeypair = await loadKeypair(tempWalletAddress);
    
    // Get the swap transaction
    const swapTransaction = await getSwapTransaction(quoteResponse, tempWalletAddress);
    
    // Deserialize and sign the transaction
    const transaction = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));
    transaction.sign([tempKeypair]);
    
    // Execute the swap
    console.log('Executing swap transaction...');
    const swapTxId = await connection.sendTransaction(transaction);
    
    console.log('Swap transaction sent:', swapTxId);
    
    // Wait for swap confirmation
    const swapConfirmation = await connection.confirmTransaction(swapTxId, 'confirmed');
    
    if (swapConfirmation.value.err) {
      throw new Error(`Swap transaction failed: ${swapConfirmation.value.err}`);
    }
    
    console.log('Swap confirmed, now transferring assets...');
    
    // Transfer the swapped tokens to destination wallet
    const transferTxId = await transferAssets(
      tempKeypair,
      destinationWallet,
      quoteResponse.outputMint
    );
    
    return {
      status: 'success',
      swapTransaction: swapTxId,
      transferTransaction: transferTxId,
      message: 'Swap and transfer completed successfully'
    };
    
  } catch (error) {
    console.error('Error in executeSwapAndTransfer:', error);
    throw new Error(`Swap execution failed: ${error.message}`);
  }
}

async function transferAssets(fromKeypair, destinationWallet, tokenMint) {
  try {
    const destinationPubkey = new PublicKey(destinationWallet);
    const fromPubkey = fromKeypair.publicKey;
    
    if (tokenMint === SOL_MINT) {
      // Transfer SOL
      return await transferSOL(fromKeypair, destinationPubkey);
    } else {
      // Transfer SPL Token
      return await transferSPLToken(fromKeypair, destinationPubkey, tokenMint);
    }
  } catch (error) {
    console.error('Error transferring assets:', error);
    throw error;
  }
}

async function transferSOL(fromKeypair, destinationPubkey) {
  try {
    const balance = await connection.getBalance(fromKeypair.publicKey);
    
    // Reserve some SOL for transaction fees and rent
    const reserveAmount = 10000; // ~0.00001 SOL
    const transferAmount = balance - reserveAmount;
    
    if (transferAmount <= 0) {
      throw new Error('Insufficient SOL balance for transfer');
    }
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: destinationPubkey,
        lamports: transferAmount,
      })
    );
    
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [fromKeypair],
      { commitment: 'confirmed' }
    );
    
    console.log(`SOL transfer completed: ${signature}`);
    return signature;
  } catch (error) {
    console.error('Error transferring SOL:', error);
    throw error;
  }
}

async function transferSPLToken(fromKeypair, destinationPubkey, tokenMint) {
  try {
    const tokenMintPubkey = new PublicKey(tokenMint);
    
    // Get source token account
    const sourceTokenAccount = await getAssociatedTokenAddress(
      tokenMintPubkey,
      fromKeypair.publicKey
    );
    
    // Get destination token account
    const destinationTokenAccount = await getAssociatedTokenAddress(
      tokenMintPubkey,
      destinationPubkey
    );
    
    // Check if destination token account exists
    const destinationAccountInfo = await connection.getAccountInfo(destinationTokenAccount);
    const needsDestinationAccount = !destinationAccountInfo;
    
    // Get token balance
    const sourceAccountInfo = await connection.getTokenAccountBalance(sourceTokenAccount);
    const tokenBalance = sourceAccountInfo.value.amount;
    
    if (tokenBalance === '0') {
      throw new Error('No tokens to transfer');
    }
    
    const transaction = new Transaction();
    
    // Add create destination account instruction if needed
    if (needsDestinationAccount) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromKeypair.publicKey,
          destinationTokenAccount,
          destinationPubkey,
          tokenMintPubkey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }
    
    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        sourceTokenAccount,
        destinationTokenAccount,
        fromKeypair.publicKey,
        BigInt(tokenBalance),
        [],
        TOKEN_PROGRAM_ID
      )
    );
    
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [fromKeypair],
      { commitment: 'confirmed' }
    );
    
    console.log(`SPL token transfer completed: ${signature}`);
    return signature;
  } catch (error) {
    console.error('Error transferring SPL token:', error);
    throw error;
  }
} 