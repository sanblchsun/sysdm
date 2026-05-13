# VERIFICATION CHECKLIST - Multi-Worker Bug Fix

Use this checklist to verify that all fixes have been correctly applied to `app/api/relay.py`

---

## CRITICAL FIX: _dispatch() Method

### ✓ Check 1: video:mjpeg handler (should be around line 104-120)
```bash
grep -A 15 'elif channel.startswith("video:mjpeg:"):' app/api/relay.py | head -20
```

**Expected output should contain:**
```
a.updated = time.time()        # ← outside if block
a.push_mjpeg(frame)
```

**Verify:** ✅ The `a.updated = time.time()` is NOT inside the `if a is None:` block

---

### ✓ Check 2: video:h264 handler (should be around line 121-137)
```bash
grep -A 15 'elif channel.startswith("video:h264:"):' app/api/relay.py | head -20
```

**Expected output should contain:**
```
a.updated = time.time()        # ← outside if block
a.push_h264(chunk)
```

**Verify:** ✅ The `a.updated = time.time()` is NOT inside the `if a is None:` block

---

## LOGGING ENHANCEMENTS

### ✓ Check 3: list_agents() logging (around line 835-850)
```bash
grep -A 8 "Log detailed agent status for debugging" app/api/relay.py
```

**Expected output:**
```
if not alive:
    logger.warning(
        f"[relay:list_agents] agent {aid} marked DEAD on worker={WORKER_ID}:...
```

**Verify:** ✅ WARNING log contains "marked DEAD" with worker ID

---

### ✓ Check 4: ws_control_agent() logging (around line 523 and 570)
```bash
grep 'agent_ws_count' app/api/relay.py
```

**Expected output:** Should appear in 2 places (connect and disconnect)
```
agent_ws_count={len(HUB.agent_ws)}, agent_worker_ws_count={len(HUB.agent_worker_ws)}
```

**Verify:** ✅ Connection logs show WS counts

---

### ✓ Check 5: send_command_to_agent() logging (around line 408-451)
```bash
grep -c "worker={WORKER_ID}" app/api/relay.py
```

**Expected:** At least 5+ occurrences showing worker ID in logs

**Verify:** ✅ Command sending logs include worker identification

---

## SYNTAX VALIDATION

### ✓ Check 6: Python syntax is valid
```bash
python3 -m py_compile app/api/relay.py
echo "Exit code: $?"
```

**Expected:** No output, exit code 0

**Verify:** ✅ No syntax errors

---

## DOCUMENTATION

### ✓ Check 7: Documentation files created
```bash
ls -lh MULTIWORKER_EXPLAINED.md MULTIWORKER_FIXES_CHANGELOG.md DEPLOYMENT_GUIDE.md FIX_SUMMARY.md
```

**Expected:** All 4 files should exist

**Verify:** ✅ Files present:
- [ ] MULTIWORKER_EXPLAINED.md (architecture guide)
- [ ] MULTIWORKER_FIXES_CHANGELOG.md (detailed changelog)
- [ ] DEPLOYMENT_GUIDE.md (deployment steps)
- [ ] FIX_SUMMARY.md (executive summary)

---

## PROGRESS FILE UPDATE

### ✓ Check 8: PROGRESS.md updated
```bash
grep -i "multi-worker bug fix" PROGRESS.md
```

**Expected:** Should find section about this fix

**Verify:** ✅ PROGRESS.md updated with new fix section

---

## INTEGRATION TESTS (After Deployment)

### ✓ Check 9: Syntax after deployment
```bash
# Inside container
docker exec sysdm_api python3 -m py_compile /app/app/api/relay.py
```

**Expected:** Exit code 0

---

### ✓ Check 10: Logs show proper startup
```bash
docker logs sysdm_api 2>&1 | head -50 | grep -i "startup\|error"
```

**Expected:** Should see "Application startup complete", NO errors

---

### ✓ Check 11: Verify agent status behavior
```bash
# Monitor for 60+ seconds
docker logs -f sysdm_api 2>&1 | grep "list_agents" &
LOG_PID=$!

# Let it run and look for patterns
sleep 60
kill $LOG_PID

# Check results
docker logs sysdm_api 2>&1 | grep "list_agents" | tail -10
```

**Expected (GOOD):**
```
[relay:list_agents] agent ... ALIVE: elapsed=2.1s
[relay:list_agents] agent ... ALIVE: elapsed=4.3s
[relay:list_agents] agent ... ALIVE: elapsed=6.5s
```

**NOT Expected (BAD):**
```
[relay:list_agents] agent ... marked DEAD: elapsed=59.2s
```

---

### ✓ Check 12: Dashboard visual test
1. Open `https://dev.local/rdp/dashboard`
2. Select an agent via checkbox
3. Observe the agent card for 2+ minutes
4. **PASS:** No "Выберите агентов..." message appears
5. **PASS:** Video stream shows continuously
6. **PASS:** No cycling between card and empty state

---

## PERFORMANCE CHECKS

### ✓ Check 13: No memory leaks
```bash
docker stats --no-stream sysdm_api
# Expected: Stable memory, not growing over time
# Typical: 100-300 MB per worker
```

---

### ✓ Check 14: No CPU spike
```bash
docker stats --no-stream sysdm_api | awk 'NR>1 {print $3}'
# Expected: <20% CPU at idle, <50% during streaming
```

---

## REGRESSION TESTS

### ✓ Check 15: /rdp/viewer still works
```bash
# Open in browser: https://dev.local/rdp/viewer?id=<agent-id>
# Should see video stream, controls work
```

**Verify:** ✅ No regressions in viewer

---

### ✓ Check 16: WebSocket commands work
```bash
# Try RDP start/stop from dashboard
# Check logs: should see command sent/received messages
docker logs sysdm_api 2>&1 | grep "Command sent"
```

**Verify:** ✅ Commands are being transmitted

---

## SUMMARY

### All Checks Status

- [ ] Critical fix applied (video:mjpeg timestamp)
- [ ] Critical fix applied (video:h264 timestamp)
- [ ] Logging added to list_agents()
- [ ] Logging added to ws_control_agent()
- [ ] Logging added to send_command_to_agent()
- [ ] Syntax validation passes
- [ ] Documentation created
- [ ] PROGRESS.md updated
- [ ] Deployment successful
- [ ] Agent status logs look correct
- [ ] Dashboard works without cycling
- [ ] No memory leaks
- [ ] /rdp/viewer still works
- [ ] WebSocket commands working

---

## QUICK VERIFICATION COMMAND

Run this one command to check most items:

```bash
echo "=== Syntax Check ===" && \
python3 -m py_compile app/api/relay.py && echo "✓ PASS" || echo "✗ FAIL" && \

echo "=== Critical Fix Check ===" && \
grep -A 5 'elif channel.startswith("video:mjpeg:")' app/api/relay.py | grep -q 'a.updated = time.time()' && \
grep -q 'CRITICAL FIX' app/api/relay.py && echo "✓ PASS" || echo "✗ FAIL" && \

echo "=== Logging Check ===" && \
grep -q 'marked DEAD on worker' app/api/relay.py && \
grep -q 'agent_ws_count' app/api/relay.py && echo "✓ PASS" || echo "✗ FAIL" && \

echo "=== Documentation Check ===" && \
test -f MULTIWORKER_EXPLAINED.md && \
test -f MULTIWORKER_FIXES_CHANGELOG.md && \
test -f DEPLOYMENT_GUIDE.md && \
test -f FIX_SUMMARY.md && echo "✓ PASS" || echo "✗ FAIL" && \

echo -e "\n=== All Checks Complete ===" 
```

---

## If Issues Found

### Issue: Syntax errors in relay.py
**Solution:** 
```bash
# Revert changes and reapply
git checkout app/api/relay.py
# Then manually review MULTIWORKER_FIXES_CHANGELOG.md and apply fixes step-by-step
```

### Issue: Logs show "marked DEAD" still appearing
**Solution:**
1. Verify the fix is applied with Check 1 and 2 above
2. Restart containers: `docker-compose -f docker-compose.prod.yml restart`
3. Monitor logs for 5+ minutes
4. If still broken, increase timeout from 30 to 60 seconds in `list_agents()`

### Issue: Dashboard still cycles
**Solution:**
1. Verify Redis is running: `docker-compose ps | grep redis`
2. Check network connectivity between workers
3. Review logs: `docker logs sysdm_api 2>&1 | grep -i "error\|connection"`

---

## Next Steps After Verification

1. ✅ All checks pass → Fix is complete, monitor in production
2. ❌ Some checks fail → Review the MULTIWORKER_FIXES_CHANGELOG.md and apply manually
3. 🔄 Still having issues → Check `/memories/session/multiworker_fix_summary.md` for debugging tips

