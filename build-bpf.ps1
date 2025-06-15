# Build BPF program for deployment
Write-Host "🏗️  Building BPF program for deployment..." -ForegroundColor Cyan

# Clean lock files
Write-Host "Cleaning lock files..." -ForegroundColor Yellow
Get-ChildItem -Path . -Name "Cargo.lock" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue

# Navigate to program directory
Set-Location programs/private_swap_vault

Write-Host "Building BPF target..." -ForegroundColor Yellow

# Install required target if needed
rustup target add bpf-unknown-unknown

# Build with BPF target
cargo build --target bpf-unknown-unknown --release

# Check if binary was created
$bpfTarget = "target/bpf-unknown-unknown/release/private_swap_vault.so"
if (Test-Path $bpfTarget) {
    Write-Host "✅ BPF binary created successfully!" -ForegroundColor Green
    
    # Create deploy directory and copy binary
    if (-not (Test-Path "../../target/deploy")) {
        New-Item -ItemType Directory -Path "../../target/deploy" -Force
    }
    
    Copy-Item $bpfTarget "../../target/deploy/private_swap_vault.so" -Force
    Write-Host "✅ Binary copied to target/deploy/private_swap_vault.so" -ForegroundColor Green
    
    $size = (Get-Item "../../target/deploy/private_swap_vault.so").Length
    Write-Host "📦 Binary size: $size bytes" -ForegroundColor Green
} else {
    Write-Host "❌ BPF binary not found" -ForegroundColor Red
}

# Return to contracts directory
Set-Location ../..

Write-Host "🎉 BPF build completed!" -ForegroundColor Green 