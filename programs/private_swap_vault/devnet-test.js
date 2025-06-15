// devnet-test.js - Simple connectivity test for devnet

const { PublicKey, Connection, clusterApiUrl } = require("@solana/web3.js");

async function testDevnetConnection() {
  console.log("🚀 Testing devnet connection...");
  
  try {
    // Connect to devnet
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
    
    console.log(`📋 Program ID: ${PROGRAM_ID.toString()}`);
    
    // Check network connectivity
    const slot = await connection.getSlot();
    console.log(`✅ Current slot: ${slot}`);
    
    // Check if program exists
    const account = await connection.getAccountInfo(PROGRAM_ID);
    console.log(`Program exists: ${!!account ? '✅ YES' : '❌ NO'}`);
    
    if (account) {
      console.log(`✅ Program deployed! Data length: ${account.data.length} bytes`);
      console.log(`✅ Owner: ${account.owner.toString()}`);
      console.log(`✅ Executable: ${account.executable}`);
      console.log(`✅ Lamports: ${account.lamports}`);
    } else {
      console.log(`❌ Program not deployed yet on devnet`);
      console.log(`ℹ️  To deploy, you would run: solana program deploy <program.so>`);
    }
    
    // Test vault PDA derivation
    const [vaultPDA, bump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      PROGRAM_ID
    );
    console.log(`\n🔍 Vault PDA: ${vaultPDA.toString()}`);
    console.log(`🔍 Bump: ${bump}`);
    
    // Check if vault is initialized
    const vaultAccount = await connection.getAccountInfo(vaultPDA);
    console.log(`Vault initialized: ${!!vaultAccount ? '✅ YES' : '❌ NO'}`);
    
    console.log(`\n🎉 Devnet connectivity test completed!`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

testDevnetConnection(); 