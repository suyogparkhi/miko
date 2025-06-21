import { useState } from "react";
import { Button } from "@/components/ui/button";

export const WithdrawForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleWithdraw = async () => {
    setIsLoading(true);
    
    // Simulate withdrawal transaction
    setTimeout(() => {
      setIsLoading(false);
      setIsComplete(true);
    }, 2000);
  };

  if (isComplete) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Withdrawal Complete!</h2>
        <p className="text-gray-400 mb-6">
          Your BONK tokens have been successfully withdrawn to your wallet.
        </p>
        <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-400 mb-2">Transaction Hash</div>
          <div className="text-white font-mono text-sm break-all">
            3k2mN7vQ8xR...9pL5wX2yT
          </div>
        </div>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Start New Swap
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Withdraw Tokens</h2>
      
      <div className="space-y-6">
        {/* Success Notice */}
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-green-400">✅</span>
            <span className="text-sm font-medium text-green-400">Proof Verified</span>
          </div>
          <p className="text-xs text-gray-300">
            Zero-knowledge proof has been verified. Your swap is ready for withdrawal.
          </p>
        </div>

        {/* Withdrawal Details */}
        <div className="bg-gray-700/30 rounded-lg p-6">
          <h3 className="font-medium text-white mb-4">Withdrawal Summary</h3>
          
          <div className="flex items-center justify-between p-4 bg-gray-600/30 rounded-lg mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🐕</span>
              <div>
                <div className="font-medium text-white">BONK</div>
                <div className="text-sm text-gray-400">Bonk Token</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-white text-lg">2,450,000</div>
              <div className="text-sm text-gray-400">≈ $490.00</div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white">~0.00015 SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Destination</span>
              <span className="text-white font-mono">7x4k...9mPQ</span>
            </div>
          </div>
        </div>

        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Processing Withdrawal...</span>
            </div>
          ) : (
            "Withdraw 2,450,000 BONK"
          )}
        </Button>

        {/* Privacy Confirmation */}
        <div className="text-center text-xs text-gray-500">
          <p>✅ Your trading activity remains completely private</p>
          <p>✅ No on-chain trace of swap intent or intermediary steps</p>
        </div>
      </div>
    </div>
  );
};
