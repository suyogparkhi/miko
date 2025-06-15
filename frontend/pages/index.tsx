import type { NextPage } from 'next';
import Head from 'next/head';
import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, BackpackWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import SwapForm from '../components/SwapForm';

// Default styles for wallet button
require('@solana/wallet-adapter-react-ui/styles.css');

const Home: NextPage = () => {
  // Set to 'devnet' or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new BackpackWalletAdapter(),
    ],
    []
  );

  return (
    <div>
      <Head>
        <title>Private Swap</title>
        <meta name="description" content="Private token swaps on Solana" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <main className="min-h-screen bg-gray-100 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Private Swap
                  </h1>
                  <p className="text-lg text-gray-600">
                    Swap tokens privately using zero-knowledge proofs
                  </p>
                </div>

                <SwapForm />

                <div className="mt-12 text-center text-sm text-gray-500">
                  <p>
                    Powered by Jupiter Aggregator and Risc0 zkVM
                  </p>
                </div>
              </div>
            </main>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
};

export default Home; 