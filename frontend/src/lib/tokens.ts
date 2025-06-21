import { PublicKey } from '@solana/web3.js';

export interface TokenInfo {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  icon: string;
  color: string;
  coingeckoId?: string;
}

// Devnet token addresses
export const DEVNET_TOKENS: TokenInfo[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC devnet
    decimals: 6,
    icon: "💵",
    color: "from-blue-500 to-blue-600",
    coingeckoId: "usd-coin"
  }
];

// Mainnet token addresses (for reference)
export const MAINNET_TOKENS: TokenInfo[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    icon: "💵",
    color: "from-blue-500 to-blue-600",
    coingeckoId: "usd-coin"
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    icon: "💰",
    color: "from-green-500 to-green-600",
    coingeckoId: "tether"
  },
  {
    symbol: "BONK",
    name: "Bonk",
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decimals: 5,
    icon: "🐕",
    color: "from-orange-500 to-orange-600",
    coingeckoId: "bonk"
  },
  {
    symbol: "JUP",
    name: "Jupiter",
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    decimals: 6,
    icon: "🪐",
    color: "from-purple-500 to-purple-600",
    coingeckoId: "jupiter-exchange-solana"
  },
  {
    symbol: "RAY",
    name: "Raydium",
    mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    decimals: 6,
    icon: "⚡",
    color: "from-blue-400 to-purple-600",
    coingeckoId: "raydium"
  }
];

export const SOL_TOKEN: TokenInfo = {
  symbol: "SOL",
  name: "Solana",
  mint: "So11111111111111111111111111111111111111112", // Wrapped SOL
  decimals: 9,
  icon: "◎",
  color: "from-purple-500 to-purple-600",
  coingeckoId: "solana"
};

export function getTokens(network: 'devnet' | 'mainnet' = 'devnet'): TokenInfo[] {
  const tokens = network === 'devnet' ? DEVNET_TOKENS : MAINNET_TOKENS;
  return [SOL_TOKEN, ...tokens];
}

export function getTokenByMint(mint: string, network: 'devnet' | 'mainnet' = 'devnet'): TokenInfo | undefined {
  const tokens = getTokens(network);
  return tokens.find(token => token.mint === mint);
}

export function getTokenBySymbol(symbol: string, network: 'devnet' | 'mainnet' = 'devnet'): TokenInfo | undefined {
  const tokens = getTokens(network);
  return tokens.find(token => token.symbol === symbol);
}

export function isValidMint(mint: string): boolean {
  try {
    new PublicKey(mint);
    return true;
  } catch {
    return false;
  }
}

// Price fetching utilities (mock for now, can be replaced with real API)
export async function getTokenPrice(coingeckoId: string): Promise<number> {
  // Mock prices for development
  const mockPrices: Record<string, number> = {
    'solana': 107.50,
    'usd-coin': 1.00,
    'tether': 1.00,
    'bonk': 0.000021,
    'jupiter-exchange-solana': 0.89,
    'raydium': 4.12
  };
  
  return mockPrices[coingeckoId] || 0;
}

export function formatTokenAmount(amount: number, decimals: number): string {
  if (amount === 0) return "0.00";
  
  if (amount < 0.01) {
    return amount.toExponential(2);
  }
  
  if (amount < 1) {
    return amount.toFixed(4);
  }
  
  if (amount < 1000) {
    return amount.toFixed(2);
  }
  
  return amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
} 