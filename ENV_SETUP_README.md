# 🌍 Environment Configuration Guide

This guide explains how to set up and configure the environment files for the Private Swap Vault project.

## 📁 Environment Files Overview

The project uses multiple environment files for different components:

```
miko/
├── .env.example                 # Main project configuration template
├── .env.docker                  # Docker-specific configuration
├── contracts/.env.example       # Anchor/Solana contract configuration
├── relayer/.env.example         # Relayer service configuration
├── frontend/.env.example        # Next.js frontend configuration
├── setup-env.sh                 # Linux/Mac setup script
├── setup-env.ps1                # Windows setup script
└── ENV_SETUP_README.md          # This file
```

## 🚀 Quick Setup (Recommended)

### For Linux/Mac:
```bash
chmod +x setup-env.sh
./setup-env.sh
```

### For Windows:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup-env.ps1
```

This will create all necessary `.env` files from the `.env.example` templates.

## 📝 Manual Setup

If you prefer to set up manually, copy each `.env.example` file to `.env`:

```bash
# Root level
cp .env.example .env

# Contracts
cp contracts/.env.example contracts/.env

# Relayer
cp relayer/.env.example relayer/.env

# Frontend
cp frontend/.env.example frontend/.env

# Docker
cp .env.docker .env.docker.local
```

## 🔧 Configuration Details

### 1. Main Project Configuration (`.env`)

Global configuration affecting the entire project:

```bash
# Network settings
SOLANA_NETWORK=devnet
SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com

# Program ID (update after deployment)
NEXT_PUBLIC_PROGRAM_ID=Your_Program_ID_Here
```

### 2. Relayer Configuration (`relayer/.env`)

Critical for the relayer service:

```bash
# Server
PORT=3000

# Solana
RPC_ENDPOINT=https://api.devnet.solana.com

# 🔐 IMPORTANT: Relayer Private Key
RELAYER_PRIVATE_KEY=[1,2,3,...] # Replace with actual keypair array
```

### 3. Frontend Configuration (`frontend/.env`)

For the Next.js frontend:

```bash
# All variables must be prefixed with NEXT_PUBLIC_ to be accessible in browser
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=Your_Program_ID_Here
NEXT_PUBLIC_RELAYER_URL=http://localhost:3000
```

### 4. Contracts Configuration (`contracts/.env`)

For Anchor deployment and testing:

```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=~/.config/solana/id.json
```

## 🔐 Security Setup

### 1. Generate Relayer Keypair

```bash
# Generate new keypair
solana-keygen new --outfile relayer-keypair.json

# View the keypair (copy the array)
cat relayer-keypair.json
```

### 2. Update Environment Variables

Copy the keypair array and update `RELAYER_PRIVATE_KEY` in `relayer/.env`:

```bash
RELAYER_PRIVATE_KEY=[123,45,67,89,...]  # Your actual keypair array
```

### 3. Deploy Contract and Update Program ID

```bash
# Deploy the contract
cd contracts
anchor build
anchor deploy

# Copy the Program ID from the output and update all .env files
```

## 🌐 Network Configuration

### Development (Default)
- **Network**: `devnet`
- **RPC**: `https://api.devnet.solana.com`
- **Purpose**: Testing and development

### Production
- **Network**: `mainnet-beta`
- **RPC**: `https://api.mainnet-beta.solana.com`
- **Purpose**: Live production environment

**⚠️ Important**: Update RPC endpoints in ALL environment files when switching networks.

## 🐳 Docker Configuration

For containerized deployment:

```bash
# Use Docker-specific configuration
cp .env.docker .env.docker.local

# Edit .env.docker.local with your specific values
```

## 📋 Environment Variables Reference

### Required Variables

| Variable | Component | Description | Example |
|----------|-----------|-------------|---------|
| `SOLANA_NETWORK` | All | Network type | `devnet` |
| `RPC_ENDPOINT` | All | Solana RPC URL | `https://api.devnet.solana.com` |
| `RELAYER_PRIVATE_KEY` | Relayer | Relayer wallet keypair | `[1,2,3,...]` |
| `PROGRAM_ID` | All | Deployed program ID | `Fg6PaFpoGX...` |

### Optional Variables

| Variable | Component | Description | Default |
|----------|-----------|-------------|---------|
| `PORT` | Relayer | Server port | `3000` |
| `LOG_LEVEL` | All | Logging level | `info` |
| `NODE_ENV` | All | Environment mode | `development` |

## 🔍 Troubleshooting

### Common Issues

1. **"RPC endpoint not responding"**
   - Check RPC_ENDPOINT in all .env files
   - Verify network connectivity

2. **"Program not found"**
   - Ensure PROGRAM_ID is updated after deployment
   - Check if program is deployed to the correct network

3. **"Relayer wallet insufficient funds"**
   - Airdrop SOL to relayer wallet: `solana airdrop 2 <relayer_pubkey>`

4. **"Environment variable not found"**
   - Ensure .env files exist (run setup script)
   - Check variable names match exactly

### Debug Commands

```bash
# Check Solana configuration
solana config get

# Check wallet balance
solana balance

# Test RPC connection
curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' https://api.devnet.solana.com

# Verify program deployment
solana program show <PROGRAM_ID>
```

## 📚 Next Steps

After setting up environment files:

1. **Install Dependencies**
   ```bash
   # Install Solana CLI
   sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
   
   # Install Anchor
   npm install -g @coral-xyz/anchor
   
   # Install RISC0
   curl -L https://risczero.com/install | bash
   rzup install
   ```

2. **Build and Deploy**
   ```bash
   # Build contracts
   cd contracts && anchor build
   
   # Deploy to devnet
   anchor deploy
   ```

3. **Start Services**
   ```bash
   # Start relayer
   cd relayer && npm run build:all && npm start
   
   # Start frontend (in another terminal)
   cd frontend && npm run dev
   ```

## 🔒 Security Best Practices

- ✅ Never commit actual `.env` files to version control
- ✅ Use different keypairs for different environments
- ✅ Regularly rotate private keys
- ✅ Use environment-specific RPC endpoints
- ✅ Enable rate limiting in production
- ✅ Monitor wallet balances and transactions

---

For more help, check the individual README files in each component directory. 