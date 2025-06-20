import { useContext } from "react";
import { WalletConnect } from "@/components/WalletConnect";
import { VaultInterface } from "@/components/VaultInterface";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { WalletContext } from "@/contexts/WalletContext";

const Index = () => {
  const { isConnected } = useContext(WalletContext);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col">
      {/* AppBar/Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60 bg-gray-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">ZK</span>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Vault Dashboard</span>
        </div>
        <WalletConnect />
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Welcome{isConnected ? ", User" : "!"}</h2>
            <PrivacyBadge />
          </div>
          <div className="text-gray-400 text-sm md:text-base">All your private swaps, in one place.</div>
        </div>
        <section className="flex-1 flex flex-col">
          {isConnected ? (
            <VaultInterface />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 min-h-[300px] bg-gray-900/70 border border-gray-800/60 rounded-2xl p-8 text-center shadow-xl transition-all">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-gray-400 mb-6">
                Connect your Solana wallet to access your vault and start making private swaps.
              </p>
              <div className="text-sm text-gray-500">
                Supports Phantom, Backpack, Solflare & more
              </div>
            </div>
          )}
        </section>
      </main>
      <footer className="border-t border-gray-800/60 p-6 text-center text-gray-500 bg-gray-900/80">
        &copy; 2024 ZKSwap Vault. Privacy-first trading on Solana.
      </footer>
    </div>
  );
};

export default Index;
