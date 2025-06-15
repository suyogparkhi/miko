// Submit ZK proofs to the private swap vault smart contract
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';

export class ProofSubmissionService {
  private connection: Connection;
  private program: Program;
  private relayerWallet: Keypair;
  
  constructor(connection: Connection, program: Program, relayerWallet: Keypair) {
    this.connection = connection;
    this.program = program;
    this.relayerWallet = relayerWallet;
  }
  
  async submitSwapProof(
    vaultAccount: PublicKey,
    proof: string,
    publicInputs: any,
    swapTransaction: Transaction
  ) {
    try {
      // Submit the ZK proof to the smart contract
      const tx = await this.program.methods
        .submitSwapProof(proof, publicInputs)
        .accounts({
          vault: vaultAccount,
          relayer: this.relayerWallet.publicKey,
        })
        .transaction();
      
      // Add the actual swap transaction
      tx.add(swapTransaction);
      
      // Sign and submit the transaction
      const signature = await this.connection.sendTransaction(tx, [this.relayerWallet]);
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log('Proof submitted successfully:', signature);
      return signature;
      
    } catch (error) {
      console.error('Error submitting proof:', error);
      throw error;
    }
  }
  
  async batchSubmitProofs(proofBatch: Array<{
    vaultAccount: PublicKey;
    proof: string;
    publicInputs: any;
    swapTransaction: Transaction;
  }>) {
    const results = [];
    
    for (const proofData of proofBatch) {
      try {
        const result = await this.submitSwapProof(
          proofData.vaultAccount,
          proofData.proof,
          proofData.publicInputs,
          proofData.swapTransaction
        );
        results.push({ success: true, signature: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }
} 