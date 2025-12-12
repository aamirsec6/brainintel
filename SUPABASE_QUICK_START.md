# ⚡ Supabase Quick Start

Get up and running with Supabase in 5 minutes!

## 1. Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (fastest)

## 2. Create Project

1. Click **"New Project"**
2. Fill in:
   - **Name**: `retail-brain`
   - **Database Password**: ⚠️ **SAVE THIS PASSWORD!**
   - **Region**: Choose closest
3. Click **"Create new project"**
4. Wait 2-3 minutes

## 3. Get Connection String

1. Go to **Settings** → **Database**
2. Find **"Connection string"** → **"URI"**
3. Copy the string (looks like):
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

## 4. Update .env File

Create `.env` in project root:

```bash
# Supabase Connection (replace with your actual string)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Or use individual variables:
# POSTGRES_HOST=db.xxxxx.supabase.co
# POSTGRES_PORT=5432
# POSTGRES_DB=postgres
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=YOUR_PASSWORD
```

## 5. Enable pgvector Extension

1. Go to **Database** → **Extensions**
2. Search **"vector"**
3. Click **"Enable"**

Or run in **SQL Editor**:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 6. Run Migrations

**Option A: Using Supabase SQL Editor (Easiest)**
1. Go to **SQL Editor** in Supabase Dashboard
2. Open `migrations/init.sql` from your project
3. Copy all SQL
4. Paste in SQL Editor
5. Click **"Run"**

**Option B: Using psql**
```bash
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" -f migrations/init.sql
```

## 7. Test Connection

```bash
# Start your services
cd apps/dashboard
PORT=3100 pnpm dev
```

Visit `http://localhost:3100` - it should work!

## 8. View Your Data

Go to Supabase Dashboard → **Table Editor** to see:
- ✅ All customer profiles
- ✅ All events
- ✅ All merges
- ✅ Everything!

## Done! 🎉

You now have:
- ✅ Supabase database running
- ✅ Beautiful dashboard to view data
- ✅ All your tables migrated
- ✅ Ready to use!

## Next: Add User Authentication

See `SUPABASE_AUTH_SETUP.md` to add signup/login with Supabase Auth.

