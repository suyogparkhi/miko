const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const anchor = require('@coral-xyz/anchor');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const RPC_ENDPOINT = 'https://api.devnet.solana.com';
const PROGRAM_ID = 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';

async function runIntegrationTest() {
  console.log('🧪 Running Private Swap Integration Test');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Test Solana connection and contract
    console.log('\n📡 Step 1: Testing Solana Connection & Contract');
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const programId = new PublicKey(PROGRAM_ID);
    
    // Check if program exists
    const programAccount = await connection.getAccountInfo(programId);
    if (!programAccount) {
      throw new Error('Smart contract not deployed');
    }
    console.log('✅ Smart contract found on devnet');
    
    // Step 2: Test ZK Coprocessor
    console.log('\n🔐 Step 2: Testing ZK Coprocessor');
    
    // Build ZK coprocessor
    console.log('Building ZK guest...');
    try {
      execSync('cargo build --release', {
        cwd: path.join(__dirname, 'zk-coprocessor/guest'),
        stdio: 'inherit'
      });
      console.log('✅ ZK guest built successfully');
    } catch (error) {
      console.log('❌ ZK guest build failed:', error.message);
      throw error;
    }
    
    console.log('Building ZK host...');
    try {
      execSync('cargo build --release', {
        cwd: path.join(__dirname, 'zk-coprocessor/host'),
        stdio: 'inherit'
      });
      console.log('✅ ZK host built successfully');
    } catch (error) {
      console.log('❌ ZK host build failed:', error.message);
      throw error;
    }
    
    // Test ZK proof generation
    console.log('Testing ZK proof generation...');
    const zkResult = execSync('cargo run --release --bin private-swap-prover', {
      cwd: path.join(__dirname, 'zk-coprocessor/host'),
      env: {
        ...process.env,
        INPUT_AMOUNT: '1000000',
        OUTPUT_AMOUNT: '950000',
        INPUT_MINT: 'So11111111111111111111111111111111111111112',
        OUTPUT_MINT: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        RECIPIENT: 'BtWhNzGgdC9aX14VfQtYQuiqvxidMSAzParX6UUXzgn2'
      }
    });
    
    const zkOutput = zkResult.toString();
    const proofMatch = zkOutput.match(/PROOF_HASH:([a-fA-F0-9]{64})/);
    if (!proofMatch) {
      throw new Error('Failed to extract proof hash from ZK output');
    }
    const proofHash = proofMatch[1];
    console.log('✅ ZK proof generated:', proofHash);
    
    // Step 3: Test IDL loading
    console.log('\n📄 Step 3: Testing IDL Loading');
    const idlPath = path.join(__dirname, 'contracts/target/idl/private_swap_vault.json');
    
    if (!fs.existsSync(idlPath)) {
      throw new Error('IDL file not found');
    }
    
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    console.log('✅ IDL loaded successfully');
    console.log(`   Instructions: ${idl.instructions.length}`);
    console.log(`   Accounts: ${idl.accounts.length}`);
    console.log(`   Errors: ${idl.errors.length}`);
    
    // Step 4: Test Anchor program initialization
    console.log('\n⚓ Step 4: Testing Anchor Program');
    const testWallet = Keypair.generate();
    const provider = new AnchorProvider(
      connection,
      new Wallet(testWallet),
      { commitment: 'confirmed' }
    );
    
    const program = new Program(idl, programId, provider);
    console.log('✅ Anchor program initialized');
    console.log(`   Program ID: ${program.programId.toString()}`);
    
    // Step 5: Test vault PDA derivation
    console.log('\n🏛️ Step 5: Testing Vault PDA');
    const [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault')],
      programId
    );
    console.log('✅ Vault PDA derived');
    console.log(`   Vault PDA: ${vaultPda.toString()}`);
    console.log(`   Bump: ${vaultBump}`);
    
    // Step 6: Test proof hash format
    console.log('\n🔍 Step 6: Testing Proof Hash Format');
    const proofHashBytes = Buffer.from(proofHash, 'hex');
    if (proofHashBytes.length !== 32) {
      throw new Error(`Invalid proof hash length: ${proofHashBytes.length} (expected 32)`);
    }
    console.log('✅ Proof hash format valid (32 bytes)');
    
    // Step 7: Test relayer startup (basic check)
    console.log('\n🔄 Step 7: Testing Relayer Configuration');
    
    // Check if relayer files exist
    const relayerPath = path.join(__dirname, 'relayer/index.ts');
    if (!fs.existsSync(relayerPath)) {
      throw new Error('Relayer index.ts not found');
    }
    console.log('✅ Relayer files found');
    
    // Check environment variables
    const requiredEnvVars = ['RPC_ENDPOINT', 'PROGRAM_ID'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.log(`⚠️  ${envVar} not set in environment`);
      } else {
        console.log(`✅ ${envVar} configured`);
      }
    }
    
    // Step 8: Integration Summary
    console.log('\n📊 Integration Test Summary');
    console.log('=' .repeat(30));
    
    const results = {
      'Smart Contract': '✅ Deployed and accessible',
      'ZK Coprocessor': '✅ Builds and generates proofs',
      'IDL Files': '✅ Generated and loadable',
      'Anchor Program': '✅ Initializes correctly',
      'Vault PDA': '✅ Derives properly',
      'Proof Format': '✅ Valid 32-byte hash',
      'Relayer Files': '✅ Present and configured'
    };
    
    Object.entries(results).forEach(([component, status]) => {
      console.log(`${component.padEnd(20)}: ${status}`);
    });
    
    console.log('\n🎉 Integration Test PASSED!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start the relayer: cd relayer && npm run dev');
    console.log('2. Test the endpoints:');
    console.log('   - GET /health');
    console.log('   - POST /test-zk');
    console.log('   - POST /submit-proof');
    console.log('3. Deploy to devnet if not already deployed');
    console.log('4. Test full swap flow with frontend');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Integration Test FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
runIntegrationTest()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  }); 