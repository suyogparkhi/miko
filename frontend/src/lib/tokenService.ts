export interface Token {
  symbol: string;
  name: string;
  address: string;
  logoURI?: string;
  price?: string;
  change24h?: string;
  positive?: boolean;
  decimals: number;
  verified?: boolean;
  marketCap?: number;
  volume24h?: number;
  tags?: string[];
  daily_volume?: number;
}

export interface TokenSearchResponse {
  tokens: Token[];
  total: number;
  hasMore: boolean;
}

// Jupiter API response interfaces
interface JupiterToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  daily_volume?: number;
  freeze_authority?: string | null;
  mint_authority?: string | null;
  extensions?: {
    coingeckoId?: string;
  };
}

interface JupiterPriceData {
  [mintAddress: string]: {
    id: string;
    mintSymbol: string;
    vsToken: string;
    vsTokenSymbol: string;
    price: number;
  };
}

class TokenService {
  private cache = new Map<string, TokenSearchResponse>();
  private priceCache = new Map<string, any>();
  private imageCache = new Map<string, boolean>();
  private allTokensCache: JupiterToken[] | null = null;
  private cacheExpiry = new Map<string, number>();
  
  private readonly JUPITER_TOKEN_API = 'https://lite-api.jup.ag/tokens/v1';
  private readonly JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MikoSwap/1.0',
          },
        });
        
        if (response.ok) {
          return response;
        }
        
        if (response.status === 429) {
          // Rate limited, wait before retry
          await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
          continue;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
      }
    }
    throw new Error('Max retries exceeded');
  }

  private async getAllTokens(): Promise<JupiterToken[]> {
    if (this.allTokensCache) {
      return this.allTokensCache;
    }

    try {
      // Use verified tokens for better quality and faster loading
      const response = await this.fetchWithRetry(`${this.JUPITER_TOKEN_API}/tagged/verified`);
      const tokens: JupiterToken[] = await response.json();
      
      this.allTokensCache = tokens;
      
      // Cache for 10 minutes
      setTimeout(() => {
        this.allTokensCache = null;
      }, 10 * 60 * 1000);
      
      return tokens;
    } catch (error) {
      console.error('Failed to fetch tokens from Jupiter API:', error);
      
      // Fallback to a smaller set of popular tokens
      return await this.getFallbackTokens();
    }
  }

  private async getFallbackTokens(): Promise<JupiterToken[]> {
    // Popular Solana token addresses as fallback
    const popularMints = [
      'So11111111111111111111111111111111111111112', // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
      'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
      'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', // ORCA
    ];

    const tokens: JupiterToken[] = [];
    
    for (const mint of popularMints) {
      try {
        const response = await this.fetchWithRetry(`${this.JUPITER_TOKEN_API}/token/${mint}`);
        const token: JupiterToken = await response.json();
        tokens.push(token);
      } catch (error) {
        console.warn(`Failed to fetch token ${mint}:`, error);
      }
    }
    
    return tokens;
  }

  private async getPrices(mintAddresses: string[]): Promise<JupiterPriceData> {
    if (mintAddresses.length === 0) return {};
    
    const cacheKey = mintAddresses.sort().join(',');
    const cached = this.priceCache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    try {
      const mintsParam = mintAddresses.slice(0, 100).join(','); // API limit
      const response = await this.fetchWithRetry(
        `${this.JUPITER_PRICE_API}?ids=${mintsParam}`
      );
      
      const priceData: { data: JupiterPriceData } = await response.json();
      
      this.priceCache.set(cacheKey, priceData.data);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      
      return priceData.data;
    } catch (error) {
      console.warn('Failed to fetch prices:', error);
      return {};
    }
  }

  private jupiterToToken(jupiterToken: JupiterToken, priceData?: any): Token {
    const price = priceData?.price;
    const isVerified = jupiterToken.tags?.includes('verified') || 
                      jupiterToken.tags?.includes('community') || 
                      jupiterToken.tags?.includes('strict');

    return {
      symbol: jupiterToken.symbol,
      name: jupiterToken.name,
      address: jupiterToken.address,
      logoURI: jupiterToken.logoURI,
      decimals: jupiterToken.decimals,
      verified: isVerified,
      tags: jupiterToken.tags,
      daily_volume: jupiterToken.daily_volume,
      price: price ? price : undefined,
      volume24h: jupiterToken.daily_volume,
      // Note: Jupiter API doesn't provide 24h change, would need additional API
      change24h: undefined,
      positive: undefined,
      marketCap: undefined, // Would need additional API call
    };
  }

  async searchTokens(
    query: string = "",
    limit: number = 20,
    offset: number = 0
  ): Promise<TokenSearchResponse> {
    const cacheKey = `${query}-${limit}-${offset}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    try {
      // Get all tokens
      const allTokens = await this.getAllTokens();
      
      // Filter tokens based on query
      let filteredTokens = allTokens;
      
      if (query.trim()) {
        const searchQuery = query.toLowerCase();
        filteredTokens = allTokens.filter(token =>
          token.symbol.toLowerCase().includes(searchQuery) ||
          token.name.toLowerCase().includes(searchQuery) ||
          token.address.toLowerCase().includes(searchQuery)
        );
      }

      // Sort by verification status and daily volume
      filteredTokens.sort((a, b) => {
        const aVerified = a.tags?.includes('verified') || a.tags?.includes('community');
        const bVerified = b.tags?.includes('verified') || b.tags?.includes('community');
        
        if (aVerified && !bVerified) return -1;
        if (!aVerified && bVerified) return 1;
        
        return (b.daily_volume || 0) - (a.daily_volume || 0);
      });

      // Apply pagination
      const paginatedTokens = filteredTokens.slice(offset, offset + limit);
      
      // Get prices for the paginated tokens
      const mintAddresses = paginatedTokens.map(token => token.address);
      const priceData = await this.getPrices(mintAddresses);
      
      // Convert to our Token interface
      const tokens: Token[] = paginatedTokens.map(token => 
        this.jupiterToToken(token, priceData[token.address])
      );
      
      // Preload images for better UX
      this.preloadImages(tokens);

      const result: TokenSearchResponse = {
        tokens,
        total: filteredTokens.length,
        hasMore: offset + limit < filteredTokens.length
      };

      // Cache result
      this.cache.set(cacheKey, result);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      
      return result;
    } catch (error) {
      console.error('Error in searchTokens:', error);
      
      // Return empty result on error
      return {
        tokens: [],
        total: 0,
        hasMore: false
      };
    }
  }

  async getPopularTokens(limit: number = 10): Promise<Token[]> {
    const result = await this.searchTokens("", limit, 0);
    return result.tokens;
  }

  async getTokenByAddress(address: string): Promise<Token | null> {
    try {
      const response = await this.fetchWithRetry(`${this.JUPITER_TOKEN_API}/token/${address}`);
      const jupiterToken: JupiterToken = await response.json();
      
      const priceData = await this.getPrices([address]);
      
      return this.jupiterToToken(jupiterToken, priceData[address]);
    } catch (error) {
      console.warn(`Failed to fetch token ${address}:`, error);
      return null;
    }
  }

  private async preloadImages(tokens: Token[]): Promise<void> {
    const imagePromises = tokens
      .filter(token => token.logoURI && !this.imageCache.has(token.logoURI))
      .map(token => this.preloadImage(token.logoURI!));
    
    await Promise.allSettled(imagePromises);
  }

  private async preloadImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(url, true);
        resolve();
      };
      img.onerror = () => {
        this.imageCache.set(url, false);
        resolve();
      };
      img.src = url;
    });
  }

  // Clear cache when needed
  clearCache(): void {
    this.cache.clear();
    this.priceCache.clear();
    this.cacheExpiry.clear();
    this.allTokensCache = null;
  }
}

export const tokenService = new TokenService(); 