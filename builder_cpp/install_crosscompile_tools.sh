#!/bin/bash
# Comprehensive setup for Linux cross-compilation environment

set -e

echo "================================================"
echo "Linux-to-Windows Cross-Compilation Setup"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}[!] This script is for Linux systems only${NC}"
    exit 1
fi

# Check if running with sudo for apt commands
if ! command -v sudo &> /dev/null; then
    echo -e "${YELLOW}[!] sudo is required${NC}"
    exit 1
fi

echo -e "${YELLOW}[*] Step 1: Updating package list...${NC}"
sudo apt-get update

echo -e "${YELLOW}[*] Step 2: Installing MinGW-w64 toolchain...${NC}"
sudo apt-get install -y \
    mingw-w64 \
    mingw-w64-i686 \
    mingw-w64-x86-64 \
    gcc \
    g++

echo -e "${YELLOW}[*] Step 3: Installing Python dependencies...${NC}"
if command -v python3 &> /dev/null; then
    echo "[i] Python3 is installed: $(python3 --version)"
else
    echo -e "${RED}[-] Python3 is not installed${NC}"
    exit 1
fi

echo ""
echo "================================================"
echo "Verification"
echo "================================================"
echo ""

echo -e "${YELLOW}[*] Checking MinGW-w64 compiler...${NC}"
if command -v x86_64-w64-mingw32-g++ &> /dev/null; then
    echo -e "${GREEN}[+] MinGW-w64 (x86_64) found:${NC}"
    x86_64-w64-mingw32-g++ --version | head -1
else
    echo -e "${RED}[-] MinGW-w64 (x86_64) NOT found${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[*] Checking i686 MinGW-w64 compiler...${NC}"
if command -v i686-w64-mingw32-g++ &> /dev/null; then
    echo -e "${GREEN}[+] MinGW-w64 (i686) found:${NC}"
    i686-w64-mingw32-g++ --version | head -1
else
    echo -e "${YELLOW}[*] MinGW-w64 (i686) not found (optional)${NC}"
fi

echo ""
echo -e "${YELLOW}[*] Checking Python3...${NC}"
echo -e "${GREEN}[+] Python3:${NC}"
python3 --version

echo ""
echo -e "${YELLOW}[*] Current directory:${NC}"
pwd

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "You can now build Windows executables on Linux:"
echo "  $ python3 builder_cpp/build_agents.py"
echo ""
echo "Or use Docker for isolated builds:"
echo "  $ docker build -f Dockerfile.crosscompile -t agent-builder ."
echo "  $ docker run -v \$(pwd):/app agent-builder"
echo ""
