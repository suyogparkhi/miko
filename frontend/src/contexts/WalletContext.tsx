import { createContext, useState, ReactNode } from "react";

interface WalletContextType {
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}

export const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  setIsConnected: () => {},
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  return (
    <WalletContext.Provider value={{ isConnected, setIsConnected }}>
      {children}
    </WalletContext.Provider>
  );
}; 