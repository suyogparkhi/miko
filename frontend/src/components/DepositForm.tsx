
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DepositFormProps {
  onComplete: () => void;
}

export const DepositForm = ({ onComplete }: DepositFormProps) => {
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const tokens = [
    { symbol: "USDC", balance: "2,500.00", icon: "💵", color: "from-blue-500 to-blue-600" },
    { symbol: "SOL", balance: "12.5", icon: "◎", color: "from-purple-500 to-purple-600" },
  ];

  const handleDeposit = async () => {
    setIsLoading(true);
    
    // Simulate deposit transaction
    setTimeout(() => {
      setIsLoading(false);
      onComplete();
    }, 2000);
  };

  const handleMaxClick = () => {
    const token = tokens.find(t => t.symbol === selectedToken);
    if (token) {
      setAmount(token.balance.replace(",", ""));
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Deposit to Vault</h2>
        <p className="text-gray-400">Select a token and amount to deposit securely</p>
      </div>
      
      <div className="space-y-6">
        {/* Token Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-300">
            Select Token
          </Label>
          <div className="grid grid-cols-2 gap-4">
            {tokens.map((token) => (
              <button
                key={token.symbol}
                onClick={() => setSelectedToken(token.symbol)}
                className={`
                  group relative overflow-hidden p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105
                  ${selectedToken === token.symbol 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/25' 
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-700/50'
                  }
                `}
              >
                <div className="flex items-center space-x-4">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-2xl
                    ${selectedToken === token.symbol 
                      ? `bg-gradient-to-r ${token.color}` 
                      : 'bg-gray-700'
                    }
                  `}>
                    {token.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white text-lg">{token.symbol}</div>
                    <div className="text-sm text-gray-400">
                      Balance: {token.balance}
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
                className="bg-gray-800/90 border-gray-600 text-white text-xl placeholder-gray-400 pr-20 py-6 rounded-xl focus:border-blue-500 transition-all duration-300"
              />
              <button
                onClick={handleMaxClick}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:shadow-lg transition-all duration-200"
              >
                MAX
              </button>
            </div>
          </div>
          {amount && (
            <div className="text-sm text-gray-400 animate-fade-in">
              ≈ ${(parseFloat(amount) * (selectedToken === "SOL" ? 107 : 1)).toFixed(2)} USD
            </div>
          )}
        </div>

        {/* Deposit Button */}
        <Button
          onClick={handleDeposit}
          disabled={!amount || parseFloat(amount) <= 0 || isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-4 text-lg rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
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
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-700/50">
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
