import { Buffer } from 'buffer';

// Make Buffer available globally for Solana libraries
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  (window as any).global = window;
} 