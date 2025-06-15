
import { useState } from "react";
import { WalletConnect } from "@/components/WalletConnect";
import { VaultInterface } from "@/components/VaultInterface";
import { PrivacyBadge } from "@/components/PrivacyBadge";

const Index = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">ZK</span>
          </div>
          <h1 className="text-xl font-bold text-white">ZKSwap Vault</h1>
        </div>
        <WalletConnect 
          isConnected={isWalletConnected} 
          onConnectionChange={setIsWalletConnected} 
        />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Private Swaps on
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {" "}Solana
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Execute private token swaps with zero-knowledge proofs. 
            Your trading activity remains completely confidential.
          </p>
          <PrivacyBadge />
        </div>

        {/* Vault Interface */}
        {isWalletConnected ? (
          <VaultInterface />
        ) : (
          <div className="max-w-md mx-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-gray-400 mb-6">
              Connect your Solana wallet to start making private swaps
            </p>
            <div className="text-sm text-gray-500">
              Supports Phantom, Backpack, Solflare & more
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700/50 p-6 text-center text-gray-400">
        <p>&copy; 2024 ZKSwap Vault. Privacy-first trading on Solana.</p>
      </footer>
    </div>
  );
};

export default Index;
