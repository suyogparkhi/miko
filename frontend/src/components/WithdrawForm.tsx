import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/contexts/VaultContext";
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

export const WithdrawForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  
  const { vaultBalance, withdraw } = useVault();
  const { publicKey } = useWallet();

  const handleWithdraw = async () => {
    if (!amount || !recipientAddress) {
      console.error('Amount and recipient address are required');
      return;
    }

    setIsLoading(true);
    
    try {
      const recipient = recipientAddress === 'self' && publicKey 
        ? publicKey 
        : new PublicKey(recipientAddress);
      
      await withdraw(recipient, parseFloat(amount));
      setIsComplete(true);
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Withdrawal Complete!</h2>
        <p className="text-gray-400 mb-6">
          Your SOL has been successfully withdrawn from the vault.
        </p>
        <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-400 mb-2">Amount Withdrawn</div>
          <div className="text-white font-medium">
            {amount} SOL
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
      <h2 className="text-2xl font-bold text-white mb-6">Withdraw from Vault</h2>
      
      <div className="space-y-6">
        {/* Vault Balance Display */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Available Balance</span>
            <span className="text-white font-medium">{vaultBalance.toFixed(4)} SOL</span>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="withdraw-amount" className="text-sm font-medium text-gray-300">
            Amount to Withdraw
          </Label>
          <div className="relative">
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={vaultBalance}
              className="bg-gray-800/90 border-gray-600 text-white pr-20"
            />
            <button
              type="button"
              onClick={() => setAmount(vaultBalance.toString())}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Recipient Address */}
        <div className="space-y-2">
          <Label htmlFor="recipient" className="text-sm font-medium text-gray-300">
            Recipient Address
          </Label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setRecipientAddress('self')}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                recipientAddress === 'self' 
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="font-medium">Withdraw to My Wallet</div>
              <div className="text-sm text-gray-400">
                {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
              </div>
            </button>
            <div className="text-center text-gray-500 text-sm">or</div>
            <Input
              id="recipient"
              type="text"
              placeholder="Enter recipient address"
              value={recipientAddress === 'self' ? '' : recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="bg-gray-800/90 border-gray-600 text-white"
            />
          </div>
        </div>

        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          disabled={isLoading || !amount || !recipientAddress || parseFloat(amount) > vaultBalance}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Processing Withdrawal...</span>
            </div>
          ) : (
            `Withdraw ${amount || '0'} SOL`
          )}
        </Button>

        {/* Info */}
        <div className="text-center text-xs text-gray-500">
          <p>Network fees will be deducted from your wallet balance</p>
        </div>
      </div>
    </div>
  );
};
