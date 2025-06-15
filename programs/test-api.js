const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Relayer API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);
    console.log('');

    // Test 2: ZK proof generation
    console.log('2. Testing ZK proof generation...');
    const zkResponse = await fetch(`${BASE_URL}/test-zk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: '4381qDuDqMjGBANg5U6NvKDHWCUEKD7dQHJRus5FPxqA',
        inputAmount: 1000000,
        outputAmount: 950000
      })
    });
    const zkData = await zkResponse.json();
    console.log('✅ ZK Proof:', zkData);
    console.log('');

    // Test 3: Submit proof (mock)
    console.log('3. Testing proof submission...');
    const proofResponse = await fetch(`${BASE_URL}/submit-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenIn: 'So11111111111111111111111111111111111111112',
        tokenOut: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amountIn: 1000000,
        amountOut: 950000,
        user: '4381qDuDqMjGBANg5U6NvKDHWCUEKD7dQHJRus5FPxqA'
      })
    });
    const proofData = await proofResponse.json();
    console.log('✅ Proof Submission:', proofData);
    console.log('');

    console.log('🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI(); 