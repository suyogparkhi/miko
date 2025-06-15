import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ArrowDownIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:3000';

interface Token {
  mint: string;
  symbol: string;
  decimals: number;
}

const TOKENS: Token[] = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    decimals: 9,
  },
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    decimals: 6,
  },
];

export default function SwapForm() {
  const { publicKey, connected } = useWallet();
  const [tokenIn, setTokenIn] = useState<Token>(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[1]);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSwap = async () => {
    if (!publicKey || !amount) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${RELAYER_URL}/swap`, {
        tokenIn: tokenIn.mint,
        tokenOut: tokenOut.mint,
        amountIn: parseFloat(amount) * 10 ** tokenIn.decimals,
        slippage: 100, // 1%
        user: publicKey.toBase58(),
      });

      if (response.data.success) {
        console.log('Swap executed:', response.data);
        // You can add a success notification here
      }
    } catch (err) {
      console.error('Swap failed:', err);
      setError('Swap failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Private Swap</h2>
          <WalletMultiButton />
        </div>

        {/* Token Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">You Pay</label>
          <div className="flex space-x-2">
            <select
              value={tokenIn.mint}
              onChange={(e) => setTokenIn(TOKENS.find((t) => t.mint === e.target.value)!)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {TOKENS.map((token) => (
                <option key={token.mint} value={token.mint}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Switch Button */}
        <button
          onClick={switchTokens}
          className="mx-auto flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <ArrowDownIcon className="w-4 h-4 text-gray-600" />
        </button>

        {/* Token Output */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">You Receive</label>
          <div className="flex space-x-2">
            <select
              value={tokenOut.mint}
              onChange={(e) => setTokenOut(TOKENS.find((t) => t.mint === e.target.value)!)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {TOKENS.map((token) => (
                <option key={token.mint} value={token.mint}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <input
              type="text"
              readOnly
              placeholder="0.00"
              className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
            />
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!connected || loading || !amount}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            !connected || loading || !amount
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {!connected
            ? 'Connect Wallet'
            : loading
            ? 'Processing...'
            : 'Swap'}
        </button>

        {error && (
          <div className="text-red-600 text-sm mt-2">{error}</div>
        )}
      </div>
    </div>
  );
} 