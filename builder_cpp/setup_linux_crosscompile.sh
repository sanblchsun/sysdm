#!/bin/bash
# Setup script for Linux-to-Windows cross-compilation
# Requires: Debian/Ubuntu-based systems

echo "[*] Installing MinGW-w64 cross-compilation toolchain..."

# Update package list
sudo apt-get update

# Install MinGW-w64
echo "[*] Installing mingw-w64..."
sudo apt-get install -y mingw-w64 mingw-w64-i686 mingw-w64-x86-64

# Verify installation
echo "[*] Verifying installation..."
x86_64-w64-mingw32-g++ --version

if [ $? -eq 0 ]; then
    echo "[+] MinGW-w64 installed successfully!"
    echo "[+] You can now build Windows executables on Linux using:"
    echo "    python3 builder_cpp/build_agents.py"
else
    echo "[-] Failed to install MinGW-w64"
    exit 1
fi
