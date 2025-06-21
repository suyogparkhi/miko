import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown } from "lucide-react";

interface WalletConnectProps {
  isConnected?: boolean;
  onConnectionChange?: (connected: boolean) => void;
}

export const WalletConnect = ({ isConnected, onConnectionChange }: WalletConnectProps) => {
  const { connected, publicKey, disconnect } = useWallet();

  // Use the Solana wallet adapter state
  const walletConnected = connected;

  if (walletConnected) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-300">
            {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={disconnect}
          className="border-gray-700/50 text-black-300 hover:bg-gray-700/50"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="wallet-adapter-button-trigger">
      <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white !font-medium !px-6 !py-2 !rounded-lg !transition-all !duration-200 !border-0" />
    </div>
  );
};
