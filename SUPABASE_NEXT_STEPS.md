# ✅ Supabase Setup Complete - Next Steps

Your database tables are now created in Supabase! Here's what to do next:

## 1. Verify Tables Created

1. Go to **Table Editor** in Supabase Dashboard
2. You should see all 13 tables:
   - ✅ `customer_profile`
   - ✅ `profile_identifier`
   - ✅ `customer_raw_event`
   - ✅ `events`
   - ✅ `identity_merge_log`
   - ✅ `intent_message_log`
   - ✅ `nudge_log`
   - ✅ `ab_experiment`
   - ✅ `ab_assignment`
   - ✅ `ab_conversion`
   - ✅ `ml_prediction_log`
   - ✅ `ml_drift_check`
   - ✅ `ml_alert`

## 2. Get Database Connection String

1. Go to **Settings** → **Database**
2. Find **"Connection string"** section
3. Copy the **"URI"** connection string
4. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
   ```

## 3. Update Your .env File

Create or update `.env` in your project root:

```bash
# Supabase Database Connection
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres

# Supabase Auth (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://opemkjouudqqqvpchltl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZW1ram91dWRxcXF2cGNobHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzAzMTQsImV4cCI6MjA4MTEwNjMxNH0.XF9CdfwvJxSd1jvrT_Ql0u036y2Jf-R0XDOo4QJsJsA
```

## 4. Enable Email Auth Provider (Optional)

If you want real user authentication:

1. Go to **Authentication** → **Providers**
2. Enable **"Email"** provider
3. Users can now sign up/login!

## 5. Test Connection

Start your services:

```bash
# Start API Gateway (uses Supabase database)
cd services/api-gateway
pnpm dev

# Start Dashboard
cd apps/dashboard
PORT=3100 pnpm dev
```

## 6. View Your Data

Now you can:

- **View Tables**: Supabase Dashboard → Table Editor
- **See Users**: Authentication → Users (after signups)
- **Run Queries**: SQL Editor
- **View Schema**: Database → Tables

## What You Can Do Now

✅ **View all customer data** in Supabase Table Editor  
✅ **See who signed up** in Authentication → Users  
✅ **Run SQL queries** directly in Supabase  
✅ **Monitor data** in real-time  
✅ **Export data** easily  

## Troubleshooting

### Can't connect to database?
- Check `DATABASE_URL` in `.env` is correct
- Verify password is correct
- Check Supabase project is active

### Tables not showing?
- Refresh the Table Editor
- Check SQL Editor for any errors
- Verify extensions are enabled

---

**You're all set!** Your Retail Brain platform is now using Supabase with a beautiful dashboard! 🎉

