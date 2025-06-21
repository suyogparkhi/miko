import { Connection, ConnectionConfig , clusterApiUrl } from "@solana/web3.js"

// Get network from environment variable, default to devnet
const networkName = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
const defaultEndpoint = clusterApiUrl(networkName as 'devnet' | 'testnet' | 'mainnet-beta');

export const endpoint = import.meta.env.VITE_SOLANA_RPC_URL || defaultEndpoint;

export const connection = new Connection(
    endpoint,
    {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    } as ConnectionConfig
  );
