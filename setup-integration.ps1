# Private Swap Integration Setup Script (Windows PowerShell)
# This script sets up all components for the private swap integration

Write-Host "🚀 Setting up Private Swap Integration" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check if Node.js is installed
Write-Host "`n📦 Checking Node.js installation..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Error "Node.js not found. Please install Node.js 18+ first."
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Blue
    exit 1
}

# Check if Rust is installed
Write-Host "`n🦀 Checking Rust installation..." -ForegroundColor Cyan
try {
    $rustVersion = rustc --version
    Write-Success "Rust found: $rustVersion"
} catch {
    Write-Error "Rust not found. Please install Rust first."
    Write-Host "Download from: https://rustup.rs/" -ForegroundColor Blue
    exit 1
}

# Check if Risc0 is installed
Write-Host "`n🔐 Checking Risc0 installation..." -ForegroundColor Cyan
try {
    rzup --version | Out-Null
    Write-Success "Risc0 tools found"
} catch {
    Write-Warning "Risc0 not found. Please install manually:"
    Write-Host "1. Run: curl -L https://risczero.com/install | bash" -ForegroundColor Blue
    Write-Host "2. Then: rzup install" -ForegroundColor Blue
    Write-Host "3. Restart PowerShell" -ForegroundColor Blue
    Write-Error "Please install Risc0 and re-run this script"
    exit 1
}

# Install relayer dependencies
Write-Host "`n📚 Installing relayer dependencies..." -ForegroundColor Cyan
Set-Location relayer
if (Test-Path "package.json") {
    npm install
    Write-Success "Relayer dependencies installed"
} else {
    Write-Error "package.json not found in relayer directory"
    exit 1
}
Set-Location ..

# Create environment file for relayer
Write-Host "`n🔧 Setting up environment..." -ForegroundColor Cyan
if (!(Test-Path "relayer\.env")) {
    Copy-Item "relayer\.env.example" "relayer\.env"
    Write-Success "Environment file created"
    Write-Warning "Please edit relayer\.env with your actual configuration"
} else {
    Write-Success "Environment file already exists"
}

# Build ZK coprocessor
Write-Host "`n🏗️  Building ZK coprocessor..." -ForegroundColor Cyan
Set-Location zk-coprocessor\guest
try {
    cargo build --release
    Write-Success "ZK guest built successfully"
} catch {
    Write-Error "ZK guest build failed"
    exit 1
}

Set-Location ..\host
try {
    cargo build --release
    Write-Success "ZK host built successfully"
} catch {
    Write-Error "ZK host build failed"
    exit 1
}
Set-Location ..\..

# Check if IDL exists
Write-Host "`n📄 Checking IDL files..." -ForegroundColor Cyan
if (Test-Path "contracts\target\idl\private_swap_vault.json") {
    Write-Success "IDL file found"
} else {
    Write-Warning "IDL file not found. Building contracts..."
    Set-Location contracts
    if (Test-Path "build-fix.ps1") {
        Write-Host "Running build-fix.ps1..." -ForegroundColor Blue
        .\build-fix.ps1
    } else {
        Write-Warning "Please build the contracts first"
    }
    Set-Location ..
}

# Test ZK coprocessor
Write-Host "`n🧪 Testing ZK coprocessor..." -ForegroundColor Cyan
Set-Location zk-coprocessor\host
try {
    $env:INPUT_AMOUNT = "1000000"
    $env:OUTPUT_AMOUNT = "950000"
    $zkOutput = cargo run --release --bin private-swap-prover 2>$null
    if ($zkOutput -match "PROOF_HASH:") {
        Write-Success "ZK coprocessor test passed"
    } else {
        Write-Error "ZK coprocessor test failed"
        exit 1
    }
} catch {
    Write-Error "ZK coprocessor test failed: $_"
    exit 1
}
Set-Location ..\..

# Install integration test dependencies
Write-Host "`n📦 Installing integration test dependencies..." -ForegroundColor Cyan
npm install @coral-xyz/anchor @solana/web3.js

Write-Success "Setup completed successfully!"

Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure your relayer\.env file with:" -ForegroundColor White
Write-Host "   - RELAYER_PRIVATE_KEY (your Solana keypair)" -ForegroundColor Gray
Write-Host "   - RPC_ENDPOINT (Solana RPC endpoint)" -ForegroundColor Gray
Write-Host "   - PROGRAM_ID (your deployed program ID)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Run the integration test:" -ForegroundColor White
Write-Host "   node integration-test.js" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the relayer service:" -ForegroundColor White
Write-Host "   cd relayer" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test the endpoints:" -ForegroundColor White
Write-Host "   Invoke-RestMethod -Uri http://localhost:3000/health" -ForegroundColor Gray
Write-Host "   # Use Postman or similar for POST requests" -ForegroundColor Gray

Write-Success "Integration setup complete! 🎉" 