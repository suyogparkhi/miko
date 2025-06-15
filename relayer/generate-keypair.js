const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Generate a new keypair
const keypair = Keypair.generate();

console.log('🔑 Generated new keypair for relayer');
console.log('Public Key:', keypair.publicKey.toString());
console.log('Private Key Array:', JSON.stringify(Array.from(keypair.secretKey)));

// Save to files
const keyObject = {
  publicKey: keypair.publicKey.toString(),
  secretKey: Array.from(keypair.secretKey)
};

fs.writeFileSync('keypair.json', JSON.stringify(keyObject, null, 2));
console.log('\n📝 Saved keypair to keypair.json');

// Update .env file
const envContent = `# Relayer Environment Configuration

# Solana RPC endpoint
RPC_ENDPOINT=https://api.devnet.solana.com

# Program ID of deployed smart contract
PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS

# Relayer private key as JSON array
RELAYER_PRIVATE_KEY=${JSON.stringify(Array.from(keypair.secretKey))}

# Port for relayer service
PORT=3000

# Mock mode (set to true for testing without real transactions)
MOCK_MODE=false
`;

fs.writeFileSync('.env', envContent);
console.log('📄 Updated .env file with new keypair');

console.log('\n⚠️  IMPORTANT:');
console.log('This is a TEST keypair. For production:');
console.log('1. Fund this address with SOL for transaction fees');
console.log('2. Use a secure keypair generation method');
console.log('3. Never commit private keys to version control');

console.log('\n💰 Fund this address on devnet:');
console.log(`solana airdrop 2 ${keypair.publicKey.toString()} --url devnet`); 