#!/bin/bash

# Private Swap Integration Setup Script
# This script sets up all components for the private swap integration

echo "🚀 Setting up Private Swap Integration"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
echo -e "\n📦 Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Check if Rust is installed
echo -e "\n🦀 Checking Rust installation..."
if command -v cargo &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    print_status "Rust found: $RUST_VERSION"
else
    print_error "Rust not found. Please install Rust first."
    echo "Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check if Risc0 is installed
echo -e "\n🔐 Checking Risc0 installation..."
if command -v rzup &> /dev/null; then
    print_status "Risc0 tools found"
else
    print_warning "Risc0 not found. Installing..."
    curl -L https://risczero.com/install | bash
    rzup install
    print_status "Risc0 installed"
fi

# Install relayer dependencies
echo -e "\n📚 Installing relayer dependencies..."
cd relayer
if [ -f "package.json" ]; then
    npm install
    print_status "Relayer dependencies installed"
else
    print_error "package.json not found in relayer directory"
    exit 1
fi
cd ..

# Create environment file for relayer
echo -e "\n🔧 Setting up environment..."
if [ ! -f "relayer/.env" ]; then
    cp relayer/.env.example relayer/.env
    print_status "Environment file created"
    print_warning "Please edit relayer/.env with your actual configuration"
else
    print_status "Environment file already exists"
fi

# Build ZK coprocessor
echo -e "\n🏗️  Building ZK coprocessor..."
cd zk-coprocessor/guest
if cargo build --release; then
    print_status "ZK guest built successfully"
else
    print_error "ZK guest build failed"
    exit 1
fi

cd ../host
if cargo build --release; then
    print_status "ZK host built successfully"
else
    print_error "ZK host build failed"
    exit 1
fi
cd ../..

# Check if IDL exists
echo -e "\n📄 Checking IDL files..."
if [ -f "contracts/target/idl/private_swap_vault.json" ]; then
    print_status "IDL file found"
else
    print_warning "IDL file not found. Building contracts..."
    cd contracts
    if [ -f "build-fix.ps1" ]; then
        # On Windows, suggest running the PowerShell script
        print_warning "Please run build-fix.ps1 to build the contracts"
    else
        print_warning "Please build the contracts first"
    fi
    cd ..
fi

# Test ZK coprocessor
echo -e "\n🧪 Testing ZK coprocessor..."
cd zk-coprocessor/host
if INPUT_AMOUNT=1000000 OUTPUT_AMOUNT=950000 cargo run --release --bin private-swap-prover 2>/dev/null | grep -q "PROOF_HASH:"; then
    print_status "ZK coprocessor test passed"
else
    print_error "ZK coprocessor test failed"
    exit 1
fi
cd ../..

# Install integration test dependencies
echo -e "\n📦 Installing integration test dependencies..."
npm install @coral-xyz/anchor @solana/web3.js

print_status "Setup completed successfully!"

echo -e "\n📋 Next steps:"
echo "1. Configure your relayer/.env file with:"
echo "   - RELAYER_PRIVATE_KEY (your Solana keypair)"
echo "   - RPC_ENDPOINT (Solana RPC endpoint)"
echo "   - PROGRAM_ID (your deployed program ID)"
echo ""
echo "2. Run the integration test:"
echo "   node integration-test.js"
echo ""
echo "3. Start the relayer service:"
echo "   cd relayer && npm run dev"
echo ""
echo "4. Test the endpoints:"
echo "   curl http://localhost:3000/health"
echo "   curl -X POST http://localhost:3000/test-zk -H 'Content-Type: application/json' -d '{\"recipient\":\"YOUR_WALLET_ADDRESS\"}'"

print_status "Integration setup complete! 🎉" 