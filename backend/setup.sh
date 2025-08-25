#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Installing Python dependencies from requirements.txt..."
pip install -r requirements.txt

# --- INSTALL SUI CLI FOR LINUX ---
echo "Installing dependencies for Sui CLI..."
# Update package list and install necessary tools like curl and git.
sudo apt-get update
sudo apt-get install -y curl git build-essential pkg-config libssl-dev cmake

# Install Rust and Cargo, which are required to build Sui
# This is a one-line installer from the Rust project.
echo "Installing Rust and Cargo..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
# Add Cargo's bin directory to the PATH for the current session
source "$HOME/.cargo/env"

# Clone and build the Sui CLI from the official repository
echo "Cloning and building Sui CLI from source..."
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui

echo "All dependencies installed successfully!"