# ClickHouse Fix Instructions

## Problem
ClickHouse (plausible-events-db) is crash-looping due to Alpine version incompatibility.

## Solution Applied
Changed from `clickhouse/clickhouse-server:23-alpine` to `clickhouse/clickhouse-server:latest`

## Steps to Fix in Coolify

### Option 1: Clean Restart (Recommended)
1. **Stop the service** in Coolify
2. **Delete the ClickHouse volume**:
   - In Coolify, go to your service
   - Find "Volumes" section
   - Delete `plausible_events_data` volume
3. **Update docker-compose.coolify.yml** with the fixed version (already done)
4. **Restart all services**

### Option 2: Quick Fix (If Option 1 doesn't work)
If you want to keep Plausible analytics but ClickHouse keeps failing:

**Make Plausible Optional:**
Remove these services from docker-compose:
- plausible
- plausible-db
- plausible-events-db

You can always add them back later when needed.

### Option 3: Force Recreate
In Coolify terminal, run:
```bash
# Stop the failing container
docker stop upsc-plausible-events

# Remove it
docker rm upsc-plausible-events

# Remove the volume
docker volume rm <project-name>_plausible_events_data

# Redeploy from Coolify UI
```

## Verification
After fix, check ClickHouse is running:
```bash
docker logs upsc-plausible-events

# Should see:
# "Ready for connections"
# No more crash loops
```

## Why This Happened
- Alpine version of ClickHouse has known issues with ulimits and memory
- Standard ClickHouse image is more stable
- Your VPS has enough resources for the full version

## Current Status
✅ All other services working
❌ Only ClickHouse (Plausible analytics) failing
✅ Core app functionality NOT affected (Plausible is optional)

You can use the app normally without Plausible if needed!
