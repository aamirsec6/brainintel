# 🔧 Fix: Dashboard Not Updating After CSV Import

## Problem
After importing CSV data, the dashboard is not showing the updated customer data.

## Root Cause
The services (API Gateway, Profile Service, Onboarding Service) were started **before** the Supabase `DATABASE_URL` was added to `.env`. They're still connected to the old local PostgreSQL database instead of Supabase.

## Solution: Restart Services

### Option 1: Quick Restart (Recommended)

Run the restart script:

```bash
cd /Users/aamirhabibsaudagar/braintel
./scripts/restart-services-supabase.sh
```

This will:
1. Stop all running services
2. Start them fresh with the Supabase `DATABASE_URL`
3. Show you the logs location

### Option 2: Manual Restart

1. **Stop all services:**
   ```bash
   pkill -f "api-gateway"
   pkill -f "profile-service"
   pkill -f "onboarding-service"
   pkill -f "dashboard"
   ```

2. **Start services one by one:**
   ```bash
   # Terminal 1: API Gateway
   cd services/api-gateway
   pnpm dev

   # Terminal 2: Profile Service
   cd services/profile-service
   pnpm dev

   # Terminal 3: Onboarding Service
   cd services/onboarding-service
   pnpm dev

   # Terminal 4: Dashboard
   cd apps/dashboard
   PORT=3100 pnpm dev
   ```

## Verify Connection

After restarting, check the logs to confirm services are connecting to Supabase:

```bash
# Check API Gateway logs
tail -f /tmp/api-gateway.log | grep -i "database\|supabase\|connected"

# Check Profile Service logs
tail -f /tmp/profile-service.log | grep -i "database\|supabase\|connected"

# Check Onboarding Service logs
tail -f /tmp/onboarding-service.log | grep -i "database\|supabase\|connected"
```

You should see messages like:
- `Database connected successfully`
- Connection to `db.opemkjouudqqqvpchltl.supabase.co`

## Test the Fix

1. **Check dashboard stats:**
   - Visit: `http://localhost:3100`
   - Should show updated customer count

2. **Verify in Supabase:**
   - Go to Supabase Dashboard → Table Editor
   - Check `customer_profile` table
   - You should see your imported customers

3. **Re-import CSV (if needed):**
   - Go to: `http://localhost:3100/import`
   - Upload your CSV again
   - Data will now go to Supabase

## Why This Happened

The `shared/config` package reads `DATABASE_URL` from `.env` when the service starts. If a service was already running when you added `DATABASE_URL`, it won't pick it up until restarted.

## Prevention

Always restart services after changing `.env` file, especially database connections.

---

**After restarting, your dashboard should show the imported data!** ✅

