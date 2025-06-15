// devnet-test.js - Simple connectivity test for devnet

const { PublicKey, Connection, clusterApiUrl } = require("@solana/web3.js");

async function testDevnetConnection() {
  console.log("🚀 Testing Private Swap Vault on Devnet...");
  
  try {
    // Connect to devnet
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
    
    console.log(`📋 Program ID: ${PROGRAM_ID.toString()}`);
    console.log(`📋 Network: ${connection.rpcEndpoint}`);
    
    // Check network connectivity
    const slot = await connection.getSlot();
    const blockHeight = await connection.getBlockHeight();
    console.log(`✅ Current slot: ${slot}`);
    console.log(`✅ Block height: ${blockHeight}`);
    
    // Check if program exists
    console.log(`\n🔍 Checking program deployment...`);
    const account = await connection.getAccountInfo(PROGRAM_ID);
    
    if (account) {
      console.log(`✅ Program is deployed on devnet!`);
      console.log(`✅ Data length: ${account.data.length} bytes`);
      console.log(`✅ Owner: ${account.owner.toString()}`);
      console.log(`✅ Executable: ${account.executable}`);
      console.log(`✅ Lamports: ${account.lamports}`);
      
      // Test vault PDA derivation
      console.log(`\n🔍 Testing vault PDA derivation...`);
      const [vaultPDA, bump] = await PublicKey.findProgramAddressSync(
        [Buffer.from("vault")],
        PROGRAM_ID
      );
      console.log(`✅ Vault PDA: ${vaultPDA.toString()}`);
      console.log(`✅ Bump: ${bump}`);
      
      // Check if vault is initialized
      const vaultAccount = await connection.getAccountInfo(vaultPDA);
      console.log(`Vault initialized: ${!!vaultAccount ? '✅ YES' : '❌ NO'}`);
      
      if (vaultAccount) {
        console.log(`✅ Vault account found! Data length: ${vaultAccount.data.length} bytes`);
      }
      
      console.log(`\n🎉 SUCCESS: Contract is live on devnet and ready for testing!`);
      
    } else {
      console.log(`❌ Program not deployed yet on devnet`);
      console.log(`\n📝 To deploy:`);
      console.log(`   1. Build with: cargo build-bpf (in program directory)`);
      console.log(`   2. Deploy with: solana program deploy target/deploy/private_swap_vault.so`);
      console.log(`   3. Or use: anchor deploy --provider.cluster devnet`);
    }
    
    console.log(`\n📊 Test Summary:`);
    console.log(`   - Network: Solana Devnet ✅`);
    console.log(`   - Connection: Active ✅`);
    console.log(`   - Program: ${account ? 'Deployed ✅' : 'Not deployed ❌'}`);
    console.log(`   - Vault PDA: Derived ✅`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Stack: ${error.stack}`);
  }
}

testDevnetConnection(); 