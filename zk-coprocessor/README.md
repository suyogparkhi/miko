# ZK-Coprocessor for Private Swaps

This directory contains the Risc0-based zero-knowledge coprocessor for generating privacy-preserving swap proofs.

## Structure

```
zk-coprocessor/
├── guest/                   # The ZK circuit logic (runs inside Risc0 VM)
│   ├── Cargo.toml
│   └── src/main.rs
├── host/                    # The relayer interface to the guest logic
│   ├── Cargo.toml
│   └── src/main.rs
├── risczero.toml            # Configuration
└── README.md
```

## Prerequisites

- Rust 1.70+
- Risc0 toolchain

Install Risc0:
```bash
curl -L https://risczero.com/install | bash
rzup install
```

## Building

### Build Guest (ZK Circuit)
```bash
cd guest
cargo build --release
```

### Build Host (Prover)
```bash
cd host
cargo build --release
```

## Running

### Manual Test
```bash
cd host
INPUT_AMOUNT=1000000 OUTPUT_AMOUNT=50000000 cargo run --release
```

### Integration with Relayer

The relayer automatically builds and runs the zk-coprocessor when generating proofs. The host binary accepts input/output amounts via environment variables:

- `INPUT_AMOUNT`: The amount being swapped in
- `OUTPUT_AMOUNT`: The expected output amount

## How it Works

1. **Guest Code**: Runs inside the Risc0 VM and generates a hash proof of the input/output amounts
2. **Host Code**: Interfaces with the guest, passes parameters, and retrieves the generated proof
3. **Relayer Integration**: The relayer calls the host binary with swap parameters and uses the generated proof for on-chain verification

## Output

The prover outputs a proof in the format:
```
Proof: [byte_array]
```

This proof is then converted to a hex string and submitted to the Solana program via the `submit_proof` instruction. 