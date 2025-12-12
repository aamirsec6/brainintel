# ✅ Verify Supabase Connection

## Services Restarted

All services have been restarted and should now be using Supabase!

## Check Connection

### 1. Verify Services Are Running

```bash
# Check if services are listening
lsof -i :3000 -i :3003 -i :3005 -i :3100 | grep LISTEN
```

You should see:
- Port 3000: API Gateway
- Port 3003: Profile Service  
- Port 3005: Onboarding Service
- Port 3100: Dashboard

### 2. Check Service Logs

```bash
# API Gateway
tail -f /tmp/api-gateway.log

# Profile Service
tail -f /tmp/profile-service.log

# Onboarding Service
tail -f /tmp/onboarding-service.log

# Dashboard
tail -f /tmp/dashboard.log
```

Look for:
- ✅ `Database connected successfully`
- ✅ No errors about connection failures

### 3. Test Dashboard

1. **Visit:** `http://localhost:3100`
2. **Check stats:** Should show customer count from Supabase
3. **Go to Customers page:** Should list imported customers

### 4. Verify in Supabase

1. Go to **Supabase Dashboard** → **Table Editor**
2. Check `customer_profile` table
3. You should see your imported customers!

## If Dashboard Still Shows 0

### Option 1: Re-import CSV

The CSV was imported to the old database. Re-import it:

1. Go to: `http://localhost:3100/import`
2. Upload your CSV again
3. Data will now go to Supabase

### Option 2: Check Database Connection

Verify the services are actually using Supabase:

```bash
# Check Profile Service logs for database connection
grep -i "database\|supabase\|host" /tmp/profile-service.log | head -5
```

You should see connection to `db.opemkjouudqqqvpchltl.supabase.co`

## Quick Test

```bash
# Test API Gateway
curl http://localhost:3000/health

# Test Profile Service  
curl http://localhost:3003/health

# Test customer stats
curl http://localhost:3000/v1/customer/stats
```

---

**Your services are now connected to Supabase!** 🎉

