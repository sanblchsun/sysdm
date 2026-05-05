#!/bin/bash
# Quick check if the system is ready for cross-compilation

echo "Cross-Compilation Environment Check"
echo "===================================="
echo ""

READY=true

# Check MinGW x86_64
echo -n "MinGW-w64 (x86_64): "
if command -v x86_64-w64-mingw32-g++ &> /dev/null; then
    echo "✓ OK"
else
    echo "✗ NOT FOUND"
    READY=false
fi

# Check MinGW i686
echo -n "MinGW-w64 (i686):   "
if command -v i686-w64-mingw32-g++ &> /dev/null; then
    echo "✓ OK"
else
    echo "✗ NOT FOUND (optional)"
fi

# Check Python3
echo -n "Python3:            "
if command -v python3 &> /dev/null; then
    echo "✓ OK"
else
    echo "✗ NOT FOUND"
    READY=false
fi

# Check main.cpp file
echo -n "main.cpp:           "
if [ -f "builder_cpp/agent/cmd/agent/main.cpp" ]; then
    echo "✓ OK"
else
    echo "✗ NOT FOUND"
    READY=false
fi

echo ""
if [ "$READY" = true ]; then
    echo "✓ Environment is ready for cross-compilation!"
    echo ""
    echo "Run: python3 builder_cpp/build_agents.py"
else
    echo "✗ Environment is not ready. Run:"
    echo "  bash builder_cpp/install_crosscompile_tools.sh"
fi
