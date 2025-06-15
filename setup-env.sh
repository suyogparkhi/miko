#!/bin/bash

# ======================================
# 🔧 Private Swap Vault Environment Setup
# ======================================

echo "🚀 Setting up Private Swap Vault environment files..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to copy env file if it doesn't exist
copy_env_file() {
    local example_file=$1
    local target_file=$2
    local description=$3
    
    if [ ! -f "$target_file" ]; then
        if [ -f "$example_file" ]; then
            cp "$example_file" "$target_file"
            echo -e "${GREEN}✅ Created $target_file ($description)${NC}"
        else
            echo -e "${RED}❌ $example_file not found${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  $target_file already exists, skipping...${NC}"
    fi
}

# Create environment files
echo "📁 Creating environment files..."

# Root level
copy_env_file ".env.example" ".env" "Main project config"

# Relayer
copy_env_file "relayer/.env.example" "relayer/.env" "Relayer service config"

# Frontend
copy_env_file "frontend/.env.example" "frontend/.env" "Frontend config"

# Contracts
copy_env_file "contracts/.env.example" "contracts/.env" "Contracts config"

# Docker
copy_env_file ".env.docker" ".env.docker.local" "Docker compose config"

echo ""
echo "🔐 IMPORTANT SECURITY STEPS:"
echo "1. Generate a new relayer keypair:"
echo "   solana-keygen new --outfile relayer-keypair.json"
echo ""
echo "2. Convert the keypair to array format and update RELAYER_PRIVATE_KEY in relayer/.env"
echo "   You can use: cat relayer-keypair.json"
echo ""
echo "3. Update the PROGRAM_ID in all .env files after deploying your contract"
echo ""
echo "4. For production, use mainnet-beta RPC endpoints"
echo ""
echo "🏗️  NEXT STEPS:"
echo "1. Install dependencies:"
echo "   - Install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools"
echo "   - Install Anchor: npm install -g @coral-xyz/anchor"
echo "   - Install Risc0: curl -L https://risczero.com/install | bash && rzup install"
echo ""
echo "2. Build and deploy:"
echo "   cd contracts && anchor build && anchor deploy"
echo ""
echo "3. Start services:"
echo "   cd relayer && npm run build:all && npm start"
echo ""
echo -e "${GREEN}✅ Environment setup complete!${NC}"
echo -e "${YELLOW}⚠️  Remember to update the environment variables with your actual values${NC}" 