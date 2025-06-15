# Private Swap DApp

A decentralized private swap application built on Solana using Anchor, Jupiter, and Risc0 zkVM.

## Architecture

- **Smart Contract**: Anchor + SPL Token for vault management
- **Vault Logic**: PDA-based token custody
- **Relayer**: Node.js service for swap execution
- **zk Coprocessor**: Risc0 zkVM (Rust) for private swap validation
- **zk Verifier**: Hash commit verification in Solana contract
- **Frontend**: Next.js with Phantom/Backpack wallet integration
- **Swap Router**: Jupiter Aggregator API integration
- **Deployment**: Solana CLI, Anchor, Docker, GitHub Actions

## Setup

1. Install Dependencies:
   ```bash
   # Solana CLI
   sh -c "$(curl -sSfL https://release.solana.com/v1.14.29/install)"
   
   # Anchor
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install latest
   avm use latest
   
   # Node.js dependencies
   npm install
   ```

2. Configure Environment:
   - Copy `.env.example` to `.env`
   - Add your Solana wallet keypair
   - Configure Jupiter API keys
   - Set up Risc0 proving parameters

3. Build & Deploy:
   ```bash
   # Build Anchor program
   anchor build
   
   # Deploy to devnet
   anchor deploy
   
   # Start frontend
   cd frontend
   npm run dev
   ```

## Development

- `/contracts`: Anchor smart contract for vault management
- `/relayer`: Off-chain service for swap execution
- `/zk-coprocessor`: Risc0 zkVM prover implementation
- `/frontend`: Next.js user interface
- `/docs`: Technical documentation and architecture

## Testing

```bash
# Run Anchor tests
anchor test

# Run relayer tests
cd relayer && npm test

# Run frontend tests
cd frontend && npm test
```

## Security

This project implements private swaps using:
- PDA-based token custody
- Zero-knowledge proofs for swap validation
- Hash commitment scheme for proof verification

## License

MIT 