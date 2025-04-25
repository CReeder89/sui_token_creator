#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Installing Python dependencies from requirements.txt..."
pip install -r requirements.txt

# Download latest Sui release (replace <VERSION> with actual version/tag)
wget https://github.com/MystenLabs/sui/releases/download/mainnet-v1.47.1/sui-ubuntu-x86_64.tgz
tar -xzf sui-ubuntu-x86_64.tgz
sudo mv sui /usr/local/bin/

echo "All dependencies installed successfully!"