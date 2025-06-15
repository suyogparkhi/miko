// Mock ZK proof generation for development and testing
export class ZKMockService {
  async generateMockProof(
    inputAmount: number,
    outputAmount: number,
    inputMint: string,
    outputMint: string,
    userAddress: string
  ): Promise<{ proof: string; publicInputs: any }> {
    // Simulate proof generation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockProof = {
      proof: `mock_proof_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      publicInputs: {
        inputAmount,
        outputAmount,
        inputMint,
        outputMint,
        userAddress,
        timestamp: Date.now(),
      }
    };
    
    console.log('Generated mock ZK proof:', mockProof);
    return mockProof;
  }
  
  async verifyMockProof(proof: string, publicInputs: any): Promise<boolean> {
    // Mock verification - always returns true for valid format
    return proof.startsWith('mock_proof_');
  }
} 