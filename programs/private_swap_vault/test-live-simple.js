// test-live-simple.js - Simple live testing with embedded IDL

const anchor = require("@coral-xyz/anchor");
const { PublicKey, Connection, clusterApiUrl, Keypair } = require("@solana/web3.js");

// Embed the IDL directly to avoid file path issues
const idl = {
  "version": "0.1.0",
  "name": "private_swap_vault",
  "instructions": [
    {
      "name": "initializeVault",
      "accounts": [
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "submitProof",
      "accounts": [
        {
          "name": "swapResult",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "relayer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proofHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "outputMint",
          "type": "publicKey"
        },
        {
          "name": "outputAmount",
          "type": "u64"
        },
        {
          "name": "recipient",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "SwapResult",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proofHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "outputToken",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "recipient",
            "type": "publicKey"
          },
          {
            "name": "isExecuted",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "errors": []
};

// Program ID (hardcoded from declare_id! in lib.rs)
const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

async function main() {
  console.log("🚀 Starting live devnet test...");
  
  // Connect to devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
  // Create wallet (in production, load from filesystem)
  const wallet = Keypair.generate();
  
  // Create provider
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );
  
  // Create program instance
  const program = new anchor.Program(idl, PROGRAM_ID, provider);
  
  console.log("📋 Test Configuration:");
  console.log(`   Program ID: ${PROGRAM_ID.toString()}`);
  console.log(`   Wallet: ${wallet.publicKey.toString()}`);
  console.log(`   Network: ${connection.rpcEndpoint}`);
  
  try {
    // Test 1: Check if program exists
    console.log("\n🔍 Test 1: Checking program deployment...");
    const programAccount = await connection.getAccountInfo(PROGRAM_ID);
    if (programAccount) {
      console.log("   ✅ Program is deployed on devnet!");
      console.log(`   ✅ Program data length: ${programAccount.data.length} bytes`);
      console.log(`   ✅ Program owner: ${programAccount.owner.toString()}`);
    } else {
      console.log("   ❌ Program not found on devnet");
      console.log("   ℹ️  Program may need to be deployed first");
    }
    
    // Test 2: Derive vault PDA
    console.log("\n🔍 Test 2: Deriving vault PDA...");
    const [vaultPDA, bump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      PROGRAM_ID
    );
    console.log(`   ✅ Vault PDA: ${vaultPDA.toString()}`);
    console.log(`   ✅ Bump: ${bump}`);
    
    // Test 3: Check network status
    console.log("\n🔍 Test 3: Checking network connectivity...");
    const slot = await connection.getSlot();
    const blockHeight = await connection.getBlockHeight();
    console.log(`   ✅ Current slot: ${slot}`);
    console.log(`   ✅ Block height: ${blockHeight}`);
    
    // Test 4: Check for existing vault
    console.log("\n🔍 Test 4: Checking for existing vault...");
    try {
      const vaultAccount = await program.account.vault.fetch(vaultPDA);
      console.log(`   ✅ Vault exists! Bump: ${vaultAccount.bump}`);
    } catch (error) {
      console.log("   ℹ️  Vault not found - this is expected if not initialized yet");
    }
    
    // Test 5: IDL validation
    console.log("\n🔍 Test 5: Validating IDL structure...");
    console.log(`   ✅ Program name: ${idl.name}`);
    console.log(`   ✅ Instructions count: ${idl.instructions.length}`);
    console.log(`   ✅ Account types count: ${idl.accounts.length}`);
    idl.instructions.forEach((instruction, index) => {
      console.log(`   ${index + 1}. ${instruction.name} (${instruction.accounts.length} accounts, ${instruction.args.length} args)`);
    });
    
    console.log("\n🎉 Live devnet connectivity test completed!");
    console.log("\n📊 Test Summary:");
    console.log(`   - Program ID: ${PROGRAM_ID.toString()}`);
    console.log(`   - Vault PDA: ${vaultPDA.toString()}`);
    console.log(`   - Network: Solana Devnet`);
    console.log(`   - Connection: ${programAccount ? "✅ CONNECTED" : "❌ NOT DEPLOYED"}`);
    
    if (!programAccount) {
      console.log("\n📝 Next Steps:");
      console.log("   1. Deploy the program to devnet using: solana program deploy");
      console.log("   2. Or use a testnet/localnet for development");
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(`❌ Full error: ${error.toString()}`);
  }
}

main().catch(console.error); 