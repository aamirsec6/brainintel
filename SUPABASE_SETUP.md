# 🚀 Supabase Setup Guide

Switch from local PostgreSQL to Supabase for a better database dashboard and easier management.

## Why Supabase?

✅ **Beautiful Dashboard** - View all your data, users, and tables in a web UI  
✅ **Built-in Auth** - User authentication out of the box  
✅ **Real-time** - Built-in real-time subscriptions  
✅ **Free Tier** - Generous free tier for development  
✅ **Same PostgreSQL** - 100% compatible with your existing code  

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"New Project"**
3. Sign up/login with GitHub (recommended)
4. Create a new organization (if needed)
5. Click **"New Project"**
6. Fill in:
   - **Name**: `retail-brain` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine for development
7. Click **"Create new project"**
8. Wait 2-3 minutes for project to be ready

## Step 2: Get Connection Details

Once your project is ready:

1. Go to **Settings** → **Database**
2. Scroll down to **"Connection string"**
3. Copy the **"URI"** connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

4. Also note:
   - **Host**: `db.xxxxx.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: (the one you created)

## Step 3: Update Environment Variables

Create or update your `.env` file in the project root:

```bash
# Supabase Database Connection
POSTGRES_HOST=db.xxxxx.supabase.co
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-supabase-password

# OR use the connection string directly (recommended)
DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres

# Supabase API Keys (for auth later)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**To get Supabase API keys:**
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 4: Update Database Config

The code already supports connection strings. Just make sure your `.env` has:

```bash
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

Or use individual variables (already supported).

## Step 5: Run Migrations

Run your existing migrations on Supabase:

```bash
# Option 1: Using psql (if installed)
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" -f migrations/init.sql

# Option 2: Using Docker (if you have postgres client)
docker run -it --rm postgres:15 psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" -f /path/to/migrations/init.sql

# Option 3: Using Supabase SQL Editor
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy contents of migrations/init.sql
# 3. Paste and run
```

## Step 6: Enable pgvector Extension

Supabase supports pgvector! Enable it:

1. Go to **Database** → **Extensions**
2. Search for **"vector"**
3. Click **"Enable"**

Or run in SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Step 7: Update Docker Compose (Optional)

If you want to keep using Docker for other services but use Supabase for database:

```yaml
# Comment out or remove the postgres service
# postgres:
#   image: pgvector/pgvector:pg15
#   ...

# Keep other services (redis, etc.)
```

## Step 8: Test Connection

Test that everything works:

```bash
# Test from your app
cd apps/dashboard
PORT=3100 pnpm dev

# Or test directly
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" -c "SELECT NOW();"
```

## Step 9: View Your Data

Now you can view everything in Supabase Dashboard:

1. **Table Editor** - See all your tables and data
2. **SQL Editor** - Run queries
3. **Database** → **Tables** - View schema
4. **Authentication** - Manage users (if using Supabase Auth)

## What You Can See in Supabase Dashboard

✅ **All Tables**: `customer_profile`, `customer_raw_event`, `profile_identifier`, etc.  
✅ **All Data**: Customer records, events, merges  
✅ **User Signups**: If you add Supabase Auth  
✅ **Real-time**: Watch data change in real-time  
✅ **SQL Queries**: Run any SQL query  
✅ **API Docs**: Auto-generated REST API docs  

## Adding Supabase Auth (Optional)

For user authentication:

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Update your login page to use Supabase Auth

See `SUPABASE_AUTH_SETUP.md` for details.

## Troubleshooting

### Connection Issues

**Error: "Connection refused"**
- Check your Supabase project is active
- Verify the connection string is correct
- Check firewall/network settings

**Error: "Password authentication failed"**
- Double-check your password
- Reset password in Supabase Dashboard → Settings → Database

**Error: "Extension vector does not exist"**
- Enable pgvector extension (see Step 6)

### Migration Issues

**Tables already exist**
- Drop existing tables or use `IF NOT EXISTS` in migrations
- Or use Supabase SQL Editor to run migrations manually

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Update `.env` with connection details
3. ✅ Run migrations
4. ✅ Test connection
5. ✅ View data in Supabase Dashboard
6. (Optional) Add Supabase Auth for user management

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)

---

**You're all set!** Your Retail Brain platform now uses Supabase with a beautiful dashboard to view all your data! 🎉

