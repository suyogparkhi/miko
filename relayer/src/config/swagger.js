import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Miko Relayer API',
      version: '1.0.0',
      description: `
A Solana token swap relayer using Jupiter aggregator with comprehensive amount validation and error handling.

**Actual Amount Requirements (Based on Testing):**
- Technical Minimum: 1 lamport (Jupiter accepts any amount!)
- Warning Threshold: 100,000 lamports (0.0001 SOL) - triggers UX warnings
- Recommended: 1,000,000+ lamports (0.001+ SOL) - optimal user experience
- Best Rates: 10,000,000+ lamports (0.01+ SOL) - minimal price impact

**Validation Features:**
- Smart warning system for small amounts (guides users to better UX)
- Price impact warnings for high-impact swaps
- Quote validation and enhancement
- Detailed error messages with specific suggestions
- Jupiter error translation to user-friendly messages

**Amount Behavior:**
- 1-99,999 lamports: Works but shows warnings about poor UX
- 100,000+ lamports: No warnings, good user experience
- 1,000,000+ lamports: Recommended for optimal rates and reliability
- 10,000,000+ lamports: Best rates with minimal price impact
      `,
      contact: {
        name: 'Miko Relayer',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Swap',
        description: 'Token swap operations with intelligent amount validation and warnings'
      }
    ],
    components: {
      schemas: {
        SwapRequest: {
          type: 'object',
          required: ['fromToken', 'toToken', 'amount', 'destinationWallet'],
          properties: {
            fromToken: {
              type: 'string',
              description: 'Source token mint address',
              example: 'So11111111111111111111111111111111111111112'
            },
            toToken: {
              type: 'string',
              description: 'Destination token mint address',
              example: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
            },
            amount: {
              type: 'string',
              description: 'Amount in smallest unit (lamports for SOL). Technical minimum: 1 lamport. Recommended: 1,000,000+ lamports (0.001+ SOL)',
              example: '10000000',
              minimum: 1
            },
            destinationWallet: {
              type: 'string',
              description: 'User wallet address to receive swapped tokens',
              example: 'YourWalletAddressHere'
            },
            slippageBps: {
              type: 'integer',
              description: 'Slippage tolerance in basis points (default: 50 = 0.5%)',
              minimum: 0,
              maximum: 10000,
              example: 50
            }
          }
        },
        SwapResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                tempWalletAddress: {
                  type: 'string',
                  description: 'Temporary wallet address created for the swap',
                  example: 'TempWalletAddressHere'
                },
                destinationWallet: {
                  type: 'string',
                  description: 'Destination wallet address',
                  example: 'YourWalletAddressHere'
                },
                swap: {
                  type: 'object',
                  properties: {
                    fromToken: { type: 'string' },
                    toToken: { type: 'string' },
                    inputAmount: { type: 'integer' },
                    expectedOutputAmount: { type: 'integer' },
                    slippageBps: { type: 'integer' },
                    priceImpactPct: { type: 'number' }
                  }
                },
                quote: {
                  type: 'object',
                  description: 'Validated and enhanced Jupiter quote response with accuracy guarantees',
                  properties: {
                    validated: {
                      type: 'boolean',
                      description: 'Indicates the quote has been validated for accuracy',
                      example: true
                    },
                    calculatedAt: {
                      type: 'string',
                      format: 'date-time',
                      description: 'When the quote was calculated and validated'
                    },
                    warnings: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Quote-specific warnings (e.g., high price impact)'
                    }
                  }
                },
                instructions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Detailed step-by-step instructions with formatted amounts'
                },
                expiresAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Quote expiration time (30 minutes from generation)'
                },
                warnings: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Combined warnings from validation and quote analysis'
                }
              }
            }
          }
        },
        ConfirmRequest: {
          type: 'object',
          required: ['tempWalletAddress', 'confirmation', 'destinationWallet', 'quoteResponse'],
          properties: {
            tempWalletAddress: {
              type: 'string',
              description: 'Temporary wallet address from swap response',
              example: 'TempWalletAddressFromSwapResponse'
            },
            confirmation: {
              type: 'boolean',
              description: 'Must be true to execute the swap, false to cancel',
              example: true
            },
            destinationWallet: {
              type: 'string',
              description: 'Destination wallet address',
              example: 'YourWalletAddressHere'
            },
            quoteResponse: {
              type: 'object',
              description: 'Complete validated quote object from /api/swap response'
            }
          }
        },
        ConfirmResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            status: {
              type: 'string',
              enum: ['completed', 'cancelled', 'failed'],
              example: 'completed'
            },
            data: {
              type: 'object',
              properties: {
                swapTransaction: {
                  type: 'string',
                  description: 'Swap transaction signature',
                  example: 'SwapTransactionSignatureHere'
                },
                transferTransaction: {
                  type: 'string',
                  description: 'Transfer transaction signature',
                  example: 'TransferTransactionSignatureHere'
                },
                tempWalletAddress: {
                  type: 'string',
                  example: 'TempWalletAddressHere'
                },
                destinationWallet: {
                  type: 'string',
                  example: 'YourWalletAddressHere'
                },
                message: {
                  type: 'string',
                  example: 'Swap and transfer completed successfully'
                },
                explorerLinks: {
                  type: 'object',
                  properties: {
                    swap: {
                      type: 'string',
                      format: 'uri',
                      example: 'https://solscan.io/tx/SwapTransactionSignatureHere'
                    },
                    transfer: {
                      type: 'string',
                      format: 'uri',
                      example: 'https://solscan.io/tx/TransferTransactionSignatureHere'
                    }
                  }
                }
              }
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error type or title',
              example: 'Amount validation failed'
            },
            message: {
              type: 'string',
              description: 'Detailed error message',
              example: 'The swap amount triggers warnings for poor user experience. Consider using a larger amount.'
            },
            details: {
              type: 'array',
              items: { type: 'string' },
              description: 'Detailed validation errors or specific issues',
              example: ['Amount is very small: 50 lamports. For better rates, use 100,000+ lamports (0.0001+ SOL)']
            },
            suggestions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Helpful suggestions to fix the issue',
              example: [
                'For better UX: use 0.0001+ SOL (100,000+ lamports)',
                'For optimal rates: use 0.001+ SOL (1,000,000+ lamports)',
                'Jupiter accepts amounts as small as 1 lamport but UX may be poor'
              ]
            }
          }
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Validation failed'
            },
            details: {
              type: 'array',
              items: { type: 'string' },
              example: ['amount is required and must be a positive integer']
            },
            suggestions: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'Check minimum amount requirements (technical minimum: 1 lamport)',
                'Ensure all required fields are provided',
                'For better UX: use 0.0001+ SOL (100,000+ lamports)',
                'For optimal rates: use 0.001+ SOL (1,000,000+ lamports)'
              ]
            }
          }
        },
        JupiterErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'No swap route available'
            },
            message: {
              type: 'string',
              example: 'Jupiter could not find a trading route for this token pair at the specified amount.'
            },
            suggestions: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'Increase the swap amount (minimum 0.001 SOL recommended for reliable quotes)',
                'Check if both tokens are actively traded',
                'Try a different token pair',
                'Verify token addresses are correct'
              ]
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/app.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec; 