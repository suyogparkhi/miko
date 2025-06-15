# ======================================
# 🔧 Private Swap Vault Environment Setup (Windows)
# ======================================

Write-Host "🚀 Setting up Private Swap Vault environment files..." -ForegroundColor Green

# Function to copy env file if it doesn't exist
function Copy-EnvFile {
    param(
        [string]$ExampleFile,
        [string]$TargetFile,
        [string]$Description
    )
    
    if (-not (Test-Path $TargetFile)) {
        if (Test-Path $ExampleFile) {
            Copy-Item $ExampleFile $TargetFile
            Write-Host "✅ Created $TargetFile ($Description)" -ForegroundColor Green
        } else {
            Write-Host "❌ $ExampleFile not found" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  $TargetFile already exists, skipping..." -ForegroundColor Yellow
    }
}

# Create environment files
Write-Host "📁 Creating environment files..."

# Root level
Copy-EnvFile ".env.example" ".env" "Main project config"

# Relayer
Copy-EnvFile "relayer\.env.example" "relayer\.env" "Relayer service config"

# Frontend
Copy-EnvFile "frontend\.env.example" "frontend\.env" "Frontend config"

# Contracts
Copy-EnvFile "contracts\.env.example" "contracts\.env" "Contracts config"

# Docker
Copy-EnvFile ".env.docker" ".env.docker.local" "Docker compose config"

Write-Host ""
Write-Host "🔐 IMPORTANT SECURITY STEPS:" -ForegroundColor Yellow
Write-Host "1. Generate a new relayer keypair:"
Write-Host "   solana-keygen new --outfile relayer-keypair.json"
Write-Host ""
Write-Host "2. Convert the keypair to array format and update RELAYER_PRIVATE_KEY in relayer\.env"
Write-Host "   You can use: Get-Content relayer-keypair.json"
Write-Host ""
Write-Host "3. Update the PROGRAM_ID in all .env files after deploying your contract"
Write-Host ""
Write-Host "4. For production, use mainnet-beta RPC endpoints"
Write-Host ""
Write-Host "🏗️  NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Install dependencies:"
Write-Host "   - Install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools"
Write-Host "   - Install Anchor: npm install -g @coral-xyz/anchor"
Write-Host "   - Install Risc0: https://risczero.com/docs/installation"
Write-Host ""
Write-Host "2. Build and deploy:"
Write-Host "   cd contracts && anchor build && anchor deploy"
Write-Host ""
Write-Host "3. Start services:"
Write-Host "   cd relayer && npm run build:all && npm start"
Write-Host ""
Write-Host "✅ Environment setup complete!" -ForegroundColor Green
Write-Host "⚠️  Remember to update the environment variables with your actual values" -ForegroundColor Yellow 