#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Installing Python dependencies from requirements.txt..."
pip install -r requirements.txt

# Install Homebrew if not installed
if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "Homebrew already installed."
fi

# Ensure Homebrew is up to date
brew update

# Install Sui CLI if not installed
if ! command -v sui &> /dev/null; then
    echo "Installing Sui CLI via Homebrew..."
    brew install sui
else
    echo "Sui CLI already installed."
fi

echo "All dependencies installed successfully!"