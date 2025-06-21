import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  createVault, 
  depositToVault, 
  withdrawFromVault, 
  getVaultBalance,
  getVaultPDA 
} from '@/services/vault';
import { PublicKey } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';

interface VaultContextType {
  vaultBalance: number;
  isVaultCreated: boolean;
  isLoading: boolean;
  error: string | null;
  createUserVault: () => Promise<void>;
  deposit: (amount: number) => Promise<void>;
  withdraw: (recipient: PublicKey, amount: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
  vaultAddress: PublicKey | null;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};

interface VaultProviderProps {
  children: ReactNode;
}

export const VaultProvider: React.FC<VaultProviderProps> = ({ children }) => {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [isVaultCreated, setIsVaultCreated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [vaultAddress, setVaultAddress] = useState<PublicKey | null>(null);

  const refreshBalance = async () => {
    if (!wallet.wallet || !publicKey) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get vault PDA
      const [vaultPda] = await getVaultPDA(publicKey);
      setVaultAddress(vaultPda);
      
      // Try to get vault balance
      const balance = await getVaultBalance(wallet.wallet.adapter as AnchorWallet);
      setVaultBalance(balance);
      setIsVaultCreated(true);
    } catch (error) {
      console.log('Vault not found or error fetching balance:', error);
      setIsVaultCreated(false);
      setVaultBalance(0);
    } finally {
      setIsLoading(false);
    }
  };

  const createUserVault = async () => {
    if (!wallet.wallet || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const txHash = await createVault(wallet.wallet.adapter as AnchorWallet);
      console.log('Vault created successfully:', txHash);
      
      setIsVaultCreated(true);
      await refreshBalance();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create vault';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deposit = async (amount: number) => {
    if (!wallet.wallet || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const txHash = await depositToVault(wallet.wallet.adapter as AnchorWallet, amount);
      console.log('Deposit successful:', txHash);
      
      await refreshBalance();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Deposit failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async (recipient: PublicKey, amount: number) => {
    if (!wallet.wallet || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const txHash = await withdrawFromVault(wallet.wallet.adapter as AnchorWallet, recipient, amount);
      console.log('Withdrawal successful:', txHash);
      
      await refreshBalance();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh balance when wallet connects/changes
  useEffect(() => {
    if (publicKey && wallet.wallet) {
      refreshBalance();
    } else {
      setVaultBalance(0);
      setIsVaultCreated(false);
      setVaultAddress(null);
    }
  }, [publicKey, wallet.wallet]);

  const value: VaultContextType = {
    vaultBalance,
    isVaultCreated,
    isLoading,
    error,
    createUserVault,
    deposit,
    withdraw,
    refreshBalance,
    vaultAddress,
  };

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
}; 