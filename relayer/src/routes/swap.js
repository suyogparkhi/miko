import express from 'express';
import { generateWalletAndStore } from '../services/walletService.js';
import { getSwapQuote } from '../services/jupiterService.js';

const router = express.Router();

// Minimum amounts for different tokens (in their smallest units)
// Based on actual Jupiter testing - Jupiter is very permissive!
const MINIMUM_AMOUNTS = {
  'So11111111111111111111111111111111111111112': 1, // 1 lamport minimum (Jupiter accepts this)
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1, // 1 micro-USDC minimum
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1, // 1 micro-USDT minimum
  default: 1 // Default minimum for other tokens
};

// Recommended minimums for best user experience and reliable quotes
const RECOMMENDED_AMOUNTS = {
  'So11111111111111111111111111111111111111112': 1000000, // 0.001 SOL recommended
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1000, // 0.001 USDC recommended
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1000, // 0.001 USDT recommended
  default: 1000 // Default recommended for other tokens
};

// Warning thresholds for small amounts that might have poor UX
const WARNING_THRESHOLDS = {
  'So11111111111111111111111111111111111111112': 100000, // 0.0001 SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 100, // 0.0001 USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 100, // 0.0001 USDT
  default: 100 // Default warning threshold
};

// Input validation helper
function validateSwapRequest(body) {
  const { fromToken, toToken, amount, destinationWallet, slippageBps } = body;
  const errors = [];
  const warnings = [];
  
  if (!fromToken || typeof fromToken !== 'string') {
    errors.push('fromToken is required and must be a string');
  }
  
  if (!toToken || typeof toToken !== 'string') {
    errors.push('toToken is required and must be a string');
  }
  
  if (!amount || !Number.isInteger(Number(amount)) || Number(amount) <= 0) {
    errors.push('amount is required and must be a positive integer');
  } else {
    const amountNum = Number(amount);
    const minAmount = MINIMUM_AMOUNTS[fromToken] || MINIMUM_AMOUNTS.default;
    const recAmount = RECOMMENDED_AMOUNTS[fromToken] || RECOMMENDED_AMOUNTS.default;
    const warnThreshold = WARNING_THRESHOLDS[fromToken] || WARNING_THRESHOLDS.default;
    
    if (amountNum < minAmount) {
      const tokenName = fromToken === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'tokens';
      errors.push(`Amount too small. Minimum 1 lamport required for ${tokenName} swaps. You provided: ${amountNum} lamports.`);
    } else if (amountNum < warnThreshold) {
      const tokenName = fromToken === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'tokens';
      const warnAmountDisplay = fromToken === 'So11111111111111111111111111111111111111112' 
        ? (warnThreshold / 1000000000).toFixed(4) + ' SOL'
        : warnThreshold + ' tokens';
      
      warnings.push(`⚠️ Very small amount detected! For better rates and user experience, consider using ${warnAmountDisplay} or more. Current amount: ${(amountNum / 1000000000).toFixed(9)} SOL`);
    } else if (amountNum < recAmount) {
      const tokenName = fromToken === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'tokens';
      const recAmountDisplay = fromToken === 'So11111111111111111111111111111111111111112' 
        ? (recAmount / 1000000000).toFixed(3) + ' SOL'
        : recAmount + ' tokens';
      
      warnings.push(`💡 Small amount. For optimal rates and reliability, consider using ${recAmountDisplay} or more.`);
    }
  }
  
  if (!destinationWallet || typeof destinationWallet !== 'string') {
    errors.push('destinationWallet is required and must be a string');
  }
  
  if (slippageBps && (!Number.isInteger(Number(slippageBps)) || Number(slippageBps) < 0 || Number(slippageBps) > 10000)) {
    errors.push('slippageBps must be an integer between 0 and 10000');
  }
  
  return { errors, warnings };
}

// Helper function to validate and enhance quote data
function validateQuoteResponse(quote, inputAmount) {
  if (!quote || !quote.outAmount) {
    throw new Error('Invalid quote response from Jupiter');
  }
  
  const outputAmount = Number(quote.outAmount);
  const priceImpactPct = Number(quote.priceImpactPct || 0);
  
  // Check for suspicious quotes
  if (outputAmount <= 0) {
    throw new Error('Invalid output amount in quote');
  }
  
  // Warn about high price impact
  const warnings = [];
  if (priceImpactPct > 5) {
    warnings.push(`⚠️ High price impact: ${priceImpactPct.toFixed(2)}%. Consider using a smaller amount.`);
  } else if (priceImpactPct > 1) {
    warnings.push(`💡 Moderate price impact: ${priceImpactPct.toFixed(2)}%. Larger amounts may get better rates.`);
  }
  
  return {
    ...quote,
    validated: true,
    warnings,
    calculatedAt: new Date().toISOString()
  };
}

// Helper function to get user-friendly error messages
function getJupiterErrorMessage(error) {
  const errorMessage = error.message || error.toString();
  
  if (errorMessage.includes('Could not find any route')) {
    return {
      error: 'No swap route available',
      message: 'Jupiter could not find a trading route for this token pair at the specified amount. Try increasing the amount or using a different token pair.',
      suggestions: [
        'Increase the swap amount (minimum 0.001 SOL recommended for reliable quotes)',
        'Check if both tokens are actively traded',
        'Try a different token pair',
        'Reduce slippage tolerance if it\'s very low'
      ]
    };
  }
  
  if (errorMessage.includes('Cannot compute other amount threshold')) {
    return {
      error: 'Amount too small for slippage calculation',
      message: 'The swap amount is too small for Jupiter to calculate slippage. Please increase the amount.',
      suggestions: [
        'Use at least 0.001 SOL (1,000,000 lamports)',
        'Reduce slippage tolerance (try 100-500 bps)',
        'Try a larger amount for better liquidity'
      ]
    };
  }
  
  if (errorMessage.includes('No quote') || errorMessage.includes('Invalid quote')) {
    return {
      error: 'Quote unavailable',
      message: 'Unable to get a valid price quote for this swap. The amount might be too small or the tokens might not have sufficient liquidity.',
      suggestions: [
        'Increase the swap amount',
        'Try during active trading hours',
        'Check token availability on Jupiter',
        'Verify token addresses are correct'
      ]
    };
  }
  
  return {
    error: 'Jupiter API error',
    message: errorMessage,
    suggestions: [
      'Try again with a larger amount',
      'Check network connectivity',
      'Verify token addresses are correct',
      'Contact support if the issue persists'
    ]
  };
}

/**
 * @swagger
 * /api/swap:
 *   post:
 *     summary: Initialize a token swap
 *     tags: [Swap]
 *     description: |
 *       Creates a temporary wallet and gets a swap quote from Jupiter.
 *       
 *       **Process:**
 *       1. Validates input parameters
 *       2. Creates a secure temporary wallet
 *       3. Gets the best swap quote from Jupiter
 *       4. Returns wallet address and swap instructions
 *       
 *       **Amount Requirements:**
 *       - Technical Minimum: 1 lamport (Jupiter accepts any amount)
 *       - Practical Minimum: 0.0001 SOL (100,000 lamports) for reasonable UX
 *       - Recommended: 0.001+ SOL (1,000,000+ lamports) for optimal rates
 *       
 *       **Next Steps:**
 *       1. Send the specified amount of tokens to the returned temporary wallet
 *       2. Call `/api/confirm` to execute the swap
 *       
 *       **Common Token Addresses:**
 *       - SOL: `So11111111111111111111111111111111111111112`
 *       - USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
 *       - USDT: `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SwapRequest'
 *           examples:
 *             SOL_to_USDC_tiny:
 *               summary: Swap 0.00001 SOL to USDC (minimal test)
 *               value:
 *                 fromToken: "So11111111111111111111111111111111111111112"
 *                 toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
 *                 amount: "10000"
 *                 destinationWallet: "YourWalletAddressHere"
 *                 slippageBps: 50
 *             SOL_to_USDC_small:
 *               summary: Swap 0.0001 SOL to USDC (warning threshold)
 *               value:
 *                 fromToken: "So11111111111111111111111111111111111111112"
 *                 toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
 *                 amount: "100000"
 *                 destinationWallet: "YourWalletAddressHere"
 *                 slippageBps: 50
 *             SOL_to_USDC_recommended:
 *               summary: Swap 0.001 SOL to USDC (recommended minimum)
 *               value:
 *                 fromToken: "So11111111111111111111111111111111111111112"
 *                 toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
 *                 amount: "1000000"
 *                 destinationWallet: "YourWalletAddressHere"
 *                 slippageBps: 50
 *             SOL_to_USDC_optimal:
 *               summary: Swap 0.01 SOL to USDC (optimal for testing)
 *               value:
 *                 fromToken: "So11111111111111111111111111111111111111112"
 *                 toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
 *                 amount: "10000000"
 *                 destinationWallet: "YourWalletAddressHere"
 *                 slippageBps: 50
 *             USDC_to_SOL:
 *               summary: Swap 10 USDC to SOL
 *               value:
 *                 fromToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
 *                 toToken: "So11111111111111111111111111111111111111112"
 *                 amount: "10000000"
 *                 destinationWallet: "YourWalletAddressHere"
 *                 slippageBps: 100
 *     responses:
 *       200:
 *         description: Swap quote generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tempWalletAddress:
 *                       type: string
 *                       description: Temporary wallet address
 *                     destinationWallet:
 *                       type: string
 *                       description: Destination wallet address
 *                     swap:
 *                       type: object
 *                       properties:
 *                         fromToken: { type: string }
 *                         toToken: { type: string }
 *                         inputAmount: { type: integer }
 *                         expectedOutputAmount: { type: integer }
 *                         slippageBps: { type: integer }
 *                         priceImpactPct: { type: number }
 *                     quote:
 *                       type: object
 *                       description: Validated Jupiter quote response
 *                     instructions:
 *                       type: array
 *                       items: { type: string }
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     warnings:
 *                       type: array
 *                       items: { type: string }
 *                       description: Warnings about amount size or price impact
 *       400:
 *         description: Validation error or Jupiter API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', async (req, res, next) => {
  try {
    console.log('Swap request received:', req.body);
    
    // Validate input
    const { errors, warnings } = validateSwapRequest(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed', 
        details: errors,
        suggestions: [
          'Check minimum amount requirements (technical minimum: 1 lamport)',
          'Ensure all required fields are provided',
          'Use valid Solana addresses',
          'For better UX: use 0.0001+ SOL (100,000+ lamports)',
          'For optimal rates: use 0.001+ SOL (1,000,000+ lamports)'
        ]
      });
    }
    
    const { fromToken, toToken, amount, destinationWallet, slippageBps = 50 } = req.body;
    
    // Validate that fromToken and toToken are different
    if (fromToken === toToken) {
      return res.status(400).json({ 
        success: false,
        error: 'fromToken and toToken must be different',
        message: 'Cannot swap a token to itself'
      });
    }
    
    // Generate temporary wallet for the swap
    const { publicKey: tempWalletAddress } = await generateWalletAndStore();
    console.log(`Generated temporary wallet: ${tempWalletAddress}`);
    
    // Get swap quote from Jupiter
    const rawQuote = await getSwapQuote({
      fromToken,
      toToken,
      amount: Number(amount),
      slippageBps: Number(slippageBps)
    });
    
    // Validate and enhance the quote
    const quote = validateQuoteResponse(rawQuote, Number(amount));
    
    // Calculate expected output amount and price impact
    const inputAmount = Number(amount);
    const outputAmount = Number(quote.outAmount);
    const priceImpactPct = Number(quote.priceImpactPct || 0);
    
    // Get token display names
    const fromTokenName = fromToken === 'So11111111111111111111111111111111111111112' ? 'SOL' : 
                         fromToken === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USDC' :
                         fromToken === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' ? 'USDT' : 'tokens';
    
    const toTokenName = toToken === 'So11111111111111111111111111111111111111112' ? 'SOL' : 
                       toToken === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USDC' :
                       toToken === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' ? 'USDT' : 'tokens';
    
    // Combine all warnings
    const allWarnings = [...warnings, ...(quote.warnings || [])];
    
    const response = {
      success: true,
      data: {
        tempWalletAddress,
        destinationWallet,
        swap: {
          fromToken,
          toToken,
          inputAmount,
          expectedOutputAmount: outputAmount,
          slippageBps: Number(slippageBps),
          priceImpactPct
        },
        quote,
        instructions: [
          `1. Send ${inputAmount} ${fromTokenName} (${(inputAmount / 1000000000).toFixed(9)} ${fromTokenName}) to: ${tempWalletAddress}`,
          `2. Call /api/confirm with confirmation=true to execute the swap`,
          `3. You will receive approximately ${outputAmount} ${toTokenName} units at: ${destinationWallet}`
        ],
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        warnings: allWarnings.length > 0 ? allWarnings : undefined
      }
    };
    
    console.log(`Swap quote generated successfully. Input: ${inputAmount} ${fromTokenName}, Output: ${outputAmount} ${toTokenName}, Price Impact: ${priceImpactPct}%`);
    res.json(response);
    
  } catch (error) {
    console.error('Error in swap route:', error);
    
    // Handle Jupiter-specific errors with helpful messages
    const jupiterError = getJupiterErrorMessage(error);
    
    return res.status(400).json({
      success: false,
      ...jupiterError
    });
  }
});

export default router; 