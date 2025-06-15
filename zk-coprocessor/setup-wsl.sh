#!/bin/bash

# Update package list
apt-get update

# Install build essentials and other dependencies
apt-get install -y build-essential curl pkg-config libssl-dev

# Install Rust if not already installed
if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

# Install Risc0 toolchain
curl -L https://risczero.com/install | sh
source $HOME/.bashrc

# Add Risc0 to PATH
export PATH="$HOME/.local/bin:$PATH"

# Install Risc0
rzup install

# Build the guest program
cd guest
cargo build --release

# Build the host program
cd ../host
cargo build --release --features risc0

echo "Setup complete! You can now use the zk-coprocessor." 