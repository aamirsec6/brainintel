# 🔧 Update .env for Supabase

## Quick Update

Your `.env` file has been updated with Supabase connection strings. **You need to replace `[YOUR_PASSWORD]` with your actual Supabase database password.**

## Steps

1. **Get Your Supabase Password**
   - This is the password you created when setting up the Supabase project
   - If you forgot it, go to Supabase Dashboard → Settings → Database → Reset database password

2. **Update .env File**
   - Open `.env` in your project root
   - Find the line:
     ```
     DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
     ```
   - Replace `[YOUR_PASSWORD]` with your actual password
   - Example:
     ```
     DATABASE_URL=postgresql://postgres:MySecurePassword123@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
     ```

3. **Verify Connection**
   - Restart your services
   - Check that they connect to Supabase successfully

## What's Configured

✅ **Database Connection** - `DATABASE_URL` points to Supabase  
✅ **Supabase Auth** - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
✅ **All Tables** - Created in Supabase  

## Test Connection

After updating the password, test the connection:

```bash
# Test from command line (if you have psql)
psql "postgresql://postgres:YOUR_PASSWORD@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres" -c "SELECT NOW();"

# Or start your services
cd services/api-gateway && pnpm dev
```

## Security Note

⚠️ **Never commit `.env` to git!** It contains sensitive passwords.

---

**After updating the password, your app will use Supabase!** 🎉

