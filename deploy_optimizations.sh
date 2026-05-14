#!/bin/bash
# DEPLOYMENT GUIDE - SysDM Optimizations
# Quick reference for deploying all changes
# Last updated: 2026-05-14

set -e

echo "=========================================="
echo "SysDM Optimization Deployment"
echo "=========================================="
echo ""

WORKDIR="/home/syadmin/project/sysdm"
cd "$WORKDIR"

echo "📋 Pre-Deployment Checklist:"
echo "  ✓ All changes documented in OPTIMIZATION_REPORT.md"
echo "  ✓ Rollback instructions available"
echo "  ✓ Database migration script prepared"
echo ""

echo "🔧 Step 1: Backup Current State"
echo "  Saving current configuration..."
git status > /tmp/git_status_backup.txt 2>&1 || true
echo "  ✓ Backup saved to /tmp/git_status_backup.txt"
echo ""

echo "🛑 Step 2: Stop Services"
docker-compose down
echo "  ✓ All containers stopped"
echo ""

echo "📦 Step 3: Install New Dependencies"
if [ -f venv/bin/activate ]; then
    source venv/bin/activate
    echo "  ✓ Virtual environment activated"
fi
pip install --upgrade -r requirements.txt > /tmp/pip_install.log 2>&1
echo "  ✓ Dependencies installed"
echo ""

echo "🗄️  Step 4: Run Database Migrations"
echo "  Running schema upgrades (this is safe to re-run)..."
python scripts/migrate_schema_upgrades.py
echo "  ✓ Database migrations completed"
echo ""

echo "🐳 Step 5: Rebuild Docker Images"
echo "  Building optimized multi-stage Dockerfile..."
docker-compose build --no-cache
echo "  ✓ Docker images built"
echo ""

echo "▶️  Step 6: Start Services"
docker-compose up -d
echo "  Waiting for services to stabilize..."
sleep 10
echo "  ✓ Services started"
echo ""

echo "🏥 Step 7: Health Verification"
echo "  Checking application health..."

HEALTH_CHECK_ATTEMPTS=0
MAX_ATTEMPTS=5

while [ $HEALTH_CHECK_ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    if curl -sf http://localhost:8000/healthz > /dev/null 2>&1; then
        echo "  ✓ Application health check: OK"
        break
    else
        echo "  ⏳ Waiting for application to be ready... (attempt $((HEALTH_CHECK_ATTEMPTS + 1))/$MAX_ATTEMPTS)"
        HEALTH_CHECK_ATTEMPTS=$((HEALTH_CHECK_ATTEMPTS + 1))
        sleep 5
    fi
done

if [ $HEALTH_CHECK_ATTEMPTS -eq $MAX_ATTEMPTS ]; then
    echo "  ⚠️  Health check timeout - checking logs..."
    docker-compose logs sysdm_api | tail -20
fi

echo ""
echo "📊 Step 8: Verification"
echo ""
echo "Container Status:"
docker-compose ps --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}"

echo ""
echo "Recent Logs (Last 20 lines):"
docker-compose logs --tail=20 sysdm_api | head -20

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "  1. Verify dashboard loads: https://dev.local"
echo "  2. Test agent registration"
echo "  3. Monitor logs for errors: docker-compose logs -f sysdm_api"
echo ""
echo "To check health status:"
echo "  curl https://dev.local/healthz"
echo ""
echo "If issues occur, run rollback:"
echo "  docker-compose down"
echo "  git checkout ."
echo "  docker-compose up -d"
echo ""
echo "For detailed information, see: OPTIMIZATION_REPORT.md"
echo ""
