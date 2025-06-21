import { Connection, ConnectionConfig , clusterApiUrl } from "@solana/web3.js"

export const endpoint = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('devnet')

export const connection = new Connection(
    endpoint,
    {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    } as ConnectionConfig
  );
