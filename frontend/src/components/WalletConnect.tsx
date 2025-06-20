import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown } from "lucide-react";
import { WalletContext } from "@/contexts/WalletContext";

interface WalletConnectProps {
  isConnected?: boolean;
  onConnectionChange?: (connected: boolean) => void;
}

export const WalletConnect = ({ isConnected, onConnectionChange }: WalletConnectProps) => {
  const context = useContext(WalletContext);
  const [isLoading, setIsLoading] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  // Prefer context if available
  const connected = context ? context.isConnected : isConnected;
  const setConnected = context ? context.setIsConnected : onConnectionChange;

  const walletOptions = [
    { name: "Phantom", icon: "👻" },
    { name: "Backpack", icon: "🎒" },
    { name: "Solflare", icon: "🔥" },
    { name: "Glow", icon: "✨" },
  ];

  const handleConnect = async (walletName: string) => {
    setIsLoading(true);
    setShowWalletOptions(false);
    setTimeout(() => {
      setConnected && setConnected(true);
      setIsLoading(false);
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnected && setConnected(false);
  };

  if (connected) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-300">7x4k...9mPQ</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDisconnect}
          className="border-gray-700/50 text-gray-300 hover:bg-gray-700/50"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowWalletOptions(!showWalletOptions)}
        disabled={isLoading}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Connecting...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Wallet size={16} />
            <span>Connect Wallet</span>
            <ChevronDown size={14} />
          </div>
        )}
      </Button>
      {showWalletOptions && !isLoading && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700/50 rounded-lg shadow-xl z-10">
          {walletOptions.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleConnect(wallet.name)}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left text-white hover:bg-gray-700/50 first:rounded-t-lg last:rounded-b-lg transition-colors"
            >
              <span className="text-lg">{wallet.icon}</span>
              <span>{wallet.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
