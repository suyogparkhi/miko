import { useState, useEffect } from "react";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTokens, formatTokenAmount, getTokenPrice, type TokenInfo } from "@/lib/tokens";

interface DepositFormProps {
  onComplete: () => void;
}

interface TokenWithBalance extends TokenInfo {
  balance: string;
  usdValue?: number;
}

export const DepositForm = ({ onComplete }: DepositFormProps) => {
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [tokens, setTokens] = useState<TokenWithBalance[]>([]);

  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const fetchTokenBalances = async () => {
    if (!publicKey || !connected) {
      return;
    }

    setIsLoadingBalances(true);
    try {
      const tokenList = getTokens('devnet');
      const updatedTokens = await Promise.all(
        tokenList.map(async (token): Promise<TokenWithBalance> => {
          try {
            let balance = 0;
            
            if (token.symbol === "SOL") {
              // Fetch SOL balance
              const lamports = await connection.getBalance(publicKey);
              balance = lamports / LAMPORTS_PER_SOL;
            } else {
              // Fetch SPL token balance
              try {
                const mintPublicKey = new PublicKey(token.mint);
                const tokenAccount = await getAssociatedTokenAddress(
                  mintPublicKey,
                  publicKey
                );
                
                const accountInfo = await getAccount(connection, tokenAccount);
                balance = Number(accountInfo.amount) / Math.pow(10, token.decimals);
              } catch (error) {
                // Token account might not exist, return 0 balance
                console.log(`No ${token.symbol} token account found`);
                balance = 0;
              }
            }

            // Get token price for USD value calculation
            let usdValue = 0;
            if (token.coingeckoId && balance > 0) {
              try {
                const price = await getTokenPrice(token.coingeckoId);
                usdValue = balance * price;
              } catch (error) {
                console.log(`Error fetching price for ${token.symbol}`);
              }
            }

            return {
              ...token,
              balance: formatTokenAmount(balance, token.decimals),
              usdValue
            };
          } catch (error) {
            console.error(`Error fetching ${token.symbol} balance:`, error);
            return {
              ...token,
              balance: "0.00",
              usdValue: 0
            };
          }
        })
      );

      setTokens(updatedTokens);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      fetchTokenBalances();
    } else {
      // Initialize with default tokens when not connected
      const tokenList = getTokens('devnet');
      setTokens(tokenList.map(token => ({
        ...token,
        balance: "0.00",
        usdValue: 0
      })));
    }
  }, [connected, publicKey]);

  const handleDeposit = async () => {
    if (!connected || !publicKey) {
      console.error('Wallet not connected');
      return;
    }

    setIsLoading(true);
    
    try {
      // Here you would implement the actual deposit logic
      // For now, we'll simulate the transaction
      console.log(`Depositing ${amount} ${selectedToken}`);
      
      // Simulate deposit transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh balances after deposit
      await fetchTokenBalances();
      
      onComplete();
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    const token = tokens.find(t => t.symbol === selectedToken);
    if (token) {
      // Remove commas and set the full balance
      setAmount(token.balance.replace(/,/g, ""));
    }
  };

  const handleRefreshBalances = () => {
    if (connected && publicKey) {
      fetchTokenBalances();
    }
  };

  const selectedTokenData = tokens.find(t => t.symbol === selectedToken);
  const estimatedUsdValue = selectedTokenData?.coingeckoId && amount 
    ? parseFloat(amount) * (selectedTokenData.usdValue || 0) / parseFloat(selectedTokenData.balance.replace(/,/g, "") || "1")
    : 0;

  if (!connected) {
    return (
      <div className="space-y-8 max-w-xl mx-auto w-full bg-gray-900/80 border border-gray-800/60 rounded-2xl p-4 sm:p-8 shadow-lg transition-all">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">
            Please connect your Solana wallet to view balances and make deposits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl mx-auto w-full bg-gray-900/80 border border-gray-800/60 rounded-2xl p-4 sm:p-8 shadow-lg transition-all">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Deposit to Vault</h2>
        <p className="text-gray-400">Select a token and amount to deposit securely</p>
        <div className="flex items-center justify-center mt-2">
          <button
            onClick={handleRefreshBalances}
            disabled={isLoadingBalances}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1 transition-colors disabled:opacity-50"
          >
            <span className={isLoadingBalances ? "animate-spin" : ""}>🔄</span>
            <span>Refresh Balances</span>
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Token Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-300">
            Select Token
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tokens.map((token) => (
              <button
                key={token.symbol}
                aria-label={`Select ${token.symbol}`}
                onClick={() => setSelectedToken(token.symbol)}
                disabled={isLoadingBalances}
                className={`
                  group relative overflow-hidden p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  ${selectedToken === token.symbol 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/25' 
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-700/50'}
                `}
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl
                    ${selectedToken === token.symbol 
                      ? `bg-gradient-to-r ${token.color}` 
                      : 'bg-gray-700'}
                  `}>
                    {token.icon}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white text-base sm:text-lg">{token.symbol}</div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      {isLoadingBalances ? (
                        <span className="inline-block w-16 h-3 bg-gray-600 rounded animate-pulse"></span>
                      ) : (
                        <>
                          <div>Balance: {token.balance}</div>
                          {token.usdValue && token.usdValue > 0 && (
                            <div className="text-gray-500">≈ ${token.usdValue.toFixed(2)}</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {selectedToken === token.symbol && (
                  <div className="absolute top-3 right-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-4">
          <Label htmlFor="amount" className="text-sm font-medium text-gray-300">
            Amount to Deposit
          </Label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur"></div>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800/90 border-gray-600 text-white text-xl placeholder-gray-400 pr-20 py-6 rounded-xl focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-300"
                aria-label="Amount to deposit"
              />
              <button
                type="button"
                onClick={handleMaxClick}
                disabled={isLoadingBalances || !selectedTokenData}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 disabled:opacity-50"
                aria-label="Max amount"
              >
                MAX
              </button>
            </div>
          </div>
          {amount && estimatedUsdValue > 0 && (
            <div className="text-sm text-gray-400 animate-fade-in">
              ≈ ${estimatedUsdValue.toFixed(2)} USD
            </div>
          )}
        </div>

        {/* Deposit Button */}
        <Button
          onClick={handleDeposit}
          disabled={!amount || parseFloat(amount) <= 0 || isLoading || isLoadingBalances}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-4 text-lg rounded-xl transition-all duration-300 transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:transform-none disabled:opacity-50"
          aria-label="Deposit"
        >
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Processing Deposit...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>💰</span>
              <span>Deposit {amount || "0"} {selectedToken}</span>
            </div>
          )}
        </Button>

        {/* Transaction Info */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-700/50 mt-2">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white">~0.00025 SOL</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Estimated Time</span>
              <span className="text-white">~15 seconds</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Privacy Level</span>
              <span className="text-green-400 flex items-center space-x-1">
                <span>🔒</span>
                <span>Zero-Knowledge</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
