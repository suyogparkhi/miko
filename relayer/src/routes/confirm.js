import express from 'express';
import { executeSwapAndTransfer } from '../services/jupiterService.js';

const router = express.Router();

// Input validation helper
function validateConfirmRequest(body) {
  const { tempWalletAddress, confirmation, destinationWallet, quoteResponse } = body;
  const errors = [];
  
  if (!tempWalletAddress || typeof tempWalletAddress !== 'string') {
    errors.push('tempWalletAddress is required and must be a string');
  }
  
  if (confirmation !== true && confirmation !== false) {
    errors.push('confirmation is required and must be a boolean');
  }
  
  if (!destinationWallet || typeof destinationWallet !== 'string') {
    errors.push('destinationWallet is required and must be a string');
  }
  
  if (!quoteResponse || typeof quoteResponse !== 'object') {
    errors.push('quoteResponse is required and must be an object');
  }
  
  return errors;
}

/**
 * @swagger
 * /api/confirm:
 *   post:
 *     summary: Execute the token swap
 *     tags: [Swap]
 *     description: |
 *       Confirms and executes the token swap, then transfers the swapped assets to the destination wallet.
 *       
 *       **Prerequisites:**
 *       1. Must have called `/api/swap` first to get a quote
 *       2. Must have sent the input tokens to the temporary wallet
 *       3. Must provide the complete quote response from the swap endpoint
 *       
 *       **Process:**
 *       1. Validates the confirmation request
 *       2. Executes the swap via Jupiter
 *       3. Transfers the swapped tokens to the destination wallet
 *       4. Returns transaction signatures and explorer links
 *       
 *       **Important:**
 *       - Set `confirmation: true` to execute the swap
 *       - Set `confirmation: false` to cancel the swap
 *       - The temporary wallet will be cleaned up automatically
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfirmRequest'
 *           examples:
 *             Execute_Swap:
 *               summary: Execute the swap
 *               value:
 *                 tempWalletAddress: "TempWalletAddressFromSwapResponse"
 *                 confirmation: true
 *                 destinationWallet: "YourWalletAddressHere"
 *                 quoteResponse: {}
 *             Cancel_Swap:
 *               summary: Cancel the swap
 *               value:
 *                 tempWalletAddress: "TempWalletAddressFromSwapResponse"
 *                 confirmation: false
 *                 destinationWallet: "YourWalletAddressHere"
 *                 quoteResponse: {}
 *     responses:
 *       200:
 *         description: Swap confirmation response
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ConfirmResponse'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     status:
 *                       type: string
 *                       example: "cancelled"
 *                     message:
 *                       type: string
 *                       example: "Swap was not confirmed by user"
 *             examples:
 *               Success:
 *                 summary: Swap executed successfully
 *                 value:
 *                   success: true
 *                   status: "completed"
 *                   data:
 *                     swapTransaction: "5J1s..."
 *                     transferTransaction: "3K2d..."
 *                     tempWalletAddress: "Temp..."
 *                     destinationWallet: "Dest..."
 *                     message: "Swap and transfer completed successfully"
 *                     explorerLinks:
 *                       swap: "https://solscan.io/tx/5J1s..."
 *                       transfer: "https://solscan.io/tx/3K2d..."
 *               Cancelled:
 *                 summary: Swap cancelled by user
 *                 value:
 *                   success: false
 *                   status: "cancelled"
 *                   message: "Swap was not confirmed by user"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Swap execution failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 status:
 *                   type: string
 *                   example: "failed"
 *                 error:
 *                   type: string
 *                   example: "Swap execution failed: Insufficient balance"
 *                 details:
 *                   type: string
 *                   description: "Stack trace (development only)"
 */
router.post('/', async (req, res, next) => {
  try {
    console.log('Confirmation request received:', {
      ...req.body,
      quoteResponse: req.body.quoteResponse ? '[QUOTE_DATA]' : undefined
    });
    
    // Validate input
    const validationErrors = validateConfirmRequest(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    const { tempWalletAddress, confirmation, destinationWallet, quoteResponse } = req.body;
    
    // Check if user confirmed the swap
    if (!confirmation) {
      return res.json({ 
        success: false,
        status: 'cancelled',
        message: 'Swap was not confirmed by user'
      });
    }
    
    console.log(`Executing confirmed swap from ${tempWalletAddress} to ${destinationWallet}`);
    
    // Execute the swap and transfer
    const result = await executeSwapAndTransfer({
      tempWalletAddress,
      destinationWallet,
      quoteResponse
    });
    
    const response = {
      success: true,
      status: 'completed',
      data: {
        swapTransaction: result.swapTransaction,
        transferTransaction: result.transferTransaction,
        tempWalletAddress,
        destinationWallet,
        message: result.message,
        explorerLinks: {
          swap: `https://solscan.io/tx/${result.swapTransaction}`,
          transfer: result.transferTransaction ? `https://solscan.io/tx/${result.transferTransaction}` : null
        }
      }
    };
    
    console.log('Swap and transfer completed successfully');
    res.json(response);
    
  } catch (error) {
    console.error('Error in confirm route:', error);
    
    // Return detailed error information
    res.status(500).json({
      success: false,
      status: 'failed',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router; 