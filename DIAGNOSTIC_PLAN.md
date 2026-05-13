# Critical Diagnostic Plan

## Problem Evidence
- Agent sends 1000+ MJPEG frames at ~87000 kbit/s
- Server endpoint receives only 2 frames
- Timestamp cycles: ALIVE(0.0s) → DEAD(30.7s) → ALIVE(0.0s)
- Redis pubsub EMPTY (no video:mjpeg:* channels)
- Worker ID always 7a2f4bfd32ac

## Root Cause Hypothesis
The timestamp is being stored in Redis with stale values. Each worker request loads it back from Redis with outdated time, making agent appear DEAD.

## Diagnostic Steps

### Step 1: Verify Fixes Are Deployed
```bash
# Check if code has line 115 fix
docker exec sysdm_api grep -n "a.updated = time.time()" /app/api/relay.py | head -10

# Verify it's OUTSIDE the if a is None block
docker exec sysdm_api sed -n '110,120p' /app/api/relay.py
```

### Step 2: Check If Ingest Is Being Called
```bash
# Add this to ingest() to log every call:
# logger.debug(f"[ingest] received frame, setting a.updated to NOW")

docker logs sysdm_api 2>&1 | grep "ingest.*received" | wc -l
```

### Step 3: Trace Timestamp In Redis
```bash
# Check if agent state is stored in Redis
docker exec sysdm-redis redis-cli KEYS "agent:*" | grep b1a12034

# Get the stored timestamp
docker exec sysdm-redis redis-cli GET "agent:b1a12034-afa0-47f1-9505-a56e4e3dfc7e:updated"

# Get current timestamp
python3 -c "import time; print(time.time())"

# Calculate difference
```

### Step 4: Check Redis Pubsub
```bash
# Should have video:mjpeg:*, video:h264:*, ctrl:* channels
docker exec sysdm-redis redis-cli PUBSUB CHANNELS

# Check for any subscriptions
docker exec sysdm-redis redis-cli PUBSUB NUMSUB video:mjpeg:*
```

### Step 5: Verify Ingest Method
```bash
# Check if push_mjpeg is being called
docker logs sysdm_api 2>&1 | grep -i "push_mjpeg\|ingest.*frame" | tail -20
```

## Expected Fixes Needed

1. **Timestamp not synced with Redis**: Need to update Redis when `a.updated` changes
2. **Frames lost in ingest()**: Check `push_mjpeg()` implementation
3. **Pubsub empty**: PSManager thread not running or Redis connection broken
4. **Multiple instances loading old state**: Each worker loads agent from Redis cache

## Critical Files to Check
- `app/api/relay.py`: _dispatch, ingest, push_mjpeg methods
- `app/redis_client.py`: How agent state is stored/loaded
- Look for where agent objects are persisted to Redis
