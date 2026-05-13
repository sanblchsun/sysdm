# DEPLOYMENT GUIDE - Multi-Worker Bug Fix

## QUICK SUMMARY
Fixed critical race condition in multi-worker FastAPI that caused dashboard to cyclically show "Select agents" message. The fix ensures video frame timestamps are synchronized across all worker processes.

**Files modified:** `app/api/relay.py` (5 functions, ~150 lines of logging added)
**Time to deploy:** ~5 minutes
**Downtime needed:** ~30 seconds (restart containers)

---

## STEP 1: Verify Changes

Check that all code modifications are in place:

```bash
cd /home/syadmin/project/sysdm

# Verify critical fix in _dispatch()
grep -A 3 "CRITICAL FIX: MUST update a.updated" app/api/relay.py

# Verify logging in list_agents()
grep "marked DEAD on worker" app/api/relay.py

# Check if syntax is valid
python3 -m py_compile app/api/relay.py && echo "✓ Syntax OK"
```

---

## STEP 2: Rebuild Docker Image

```bash
# Build new image with fixed code
docker build -t sysdm:multiworker-fix -f Dockerfile.prod .

# Or use existing tag
docker build -t sysdm:latest -f Dockerfile.prod .
```

**Expected:** Docker build should complete without errors

---

## STEP 3: Restart Containers

```bash
# Stop current containers
docker-compose -f docker-compose.prod.yml down

# Start with new image
docker-compose -f docker-compose.prod.yml up -d

# Verify containers are running
docker-compose -f docker-compose.prod.yml ps
```

**Expected:** All containers (api, redis, nginx, etc.) should be in "Up" state

---

## STEP 4: Verify Fix is Working

### 4.1 Check logs for proper startup

```bash
# Wait 5 seconds for app to start
sleep 5

# Check for errors
docker logs sysdm_api 2>&1 | grep -i "error\|traceback" | head -5

# Check if workers started
docker logs sysdm_api 2>&1 | grep "Application startup complete"
```

**Expected:** Should see "Application startup complete" without errors

### 4.2 Test agent connection and status

```bash
# In browser or curl: navigate to dashboard and select an agent
curl -s http://dev.local/relay/agents | jq '.agents[] | {id: .uuid, alive: .alive}' | head -20
```

**Expected:** All selected agents should show `"alive": true`

### 4.3 Monitor logs while dashboard is open

```bash
# In one terminal: watch logs
docker logs -f sysdm_api 2>&1 | grep -E "list_agents|ingest|agent connected"

# In another terminal: refresh dashboard (or use script)
# while true; do curl -s http://dev.local/relay/agents > /dev/null; sleep 2; done
```

**Expected (BEFORE FIX):**
```
[relay:list_agents] agent b1a12034-... marked DEAD: elapsed=59.2s > 30.0s
[relay:list_agents] agent b1a12034-... marked DEAD: elapsed=65.1s > 30.0s
```

**Expected (AFTER FIX):**
```
[relay:list_agents] agent b1a12034-... ALIVE: elapsed=2.1s
[relay:list_agents] agent b1a12034-... ALIVE: elapsed=4.0s
```

### 4.4 Full dashboard test

1. Open `https://dev.local/rdp/dashboard`
2. Select agent via checkbox in table
3. **Verify:** Agent card displays and DOES NOT cycle to empty message
4. **Verify:** Video stream displays continuously
5. **Wait:** Leave open for at least 2 minutes
6. **Verify:** No "Выберите агентов в таблице для просмотра" message appears

---

## STEP 5: Performance Check

```bash
# Check memory usage per worker
docker stats --no-stream sysdm_api | awk 'NR>1 {print $1, $6, $7}'

# Expected: should be stable, not growing
# Each worker typically: 100-300 MB
```

---

## ROLLBACK PLAN (If Issues Arise)

```bash
# If new version has problems, quickly rollback:
docker-compose -f docker-compose.prod.yml down
git checkout app/api/relay.py  # or restore from backup
docker build -t sysdm:latest -f Dockerfile.prod .
docker-compose -f docker-compose.prod.yml up -d
```

---

## MONITORING LOGS (Long-term)

The fix adds detailed logging. To spot issues:

```bash
# Watch for any "marked DEAD" warnings
docker logs sysdm_api 2>&1 | grep "marked DEAD"

# If agents are marked dead too often, increase timeout:
# Change line in relay.py list_agents():
#   alive = a.updated > 0 and (now - a.updated) < 60.0  # was 30.0
```

---

## SUCCESS CRITERIA

✅ **Deployment successful if:**
1. Docker build completes without errors
2. All containers start and stay running
3. No error messages in logs
4. Dashboard shows selected agents continuously (no cycling)
5. Video stream displays smoothly
6. `/relay/agents` endpoint returns `alive: true` for selected agents

✅ **Everything else should work as before:**
- `/rdp/viewer` URL still works
- WebSocket communication stable
- No performance regression
- Commands to agents execute normally

---

## ADDITIONAL NOTES

### Files Modified in This Fix
- `app/api/relay.py` — 5 functions enhanced with logging

### New Documentation
- `MULTIWORKER_EXPLAINED.md` — architectural guide
- `MULTIWORKER_FIXES_CHANGELOG.md` — detailed changelog
- `PROGRESS.md` — updated with this fix

### Why This Fix Works
The bug was in `_dispatch()` method in Redis pubsub handler. When worker B receives a video frame published by worker A through Redis, it needs to update the agent's timestamp so it remains "alive". The original code only updated the timestamp when creating a NEW agent, not for existing agents. This fix ensures the timestamp is updated for EVERY video frame, regardless of whether the agent is new or existing.

### If Issues Continue
1. Check Redis is running: `docker exec sysdm_redis redis-cli PING`
2. Verify Redis connection: `docker logs sysdm_api 2>&1 | grep -i redis`
3. Check worker distribution: `docker logs sysdm_api 2>&1 | grep "agent connected"`
4. Monitor network latency: May need to increase 30-second timeout to 60 seconds
