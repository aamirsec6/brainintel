# 📊 Supabase Tables Setup

Complete guide to set up all Retail Brain tables in Supabase.

## Quick Setup

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project: https://opemkjouudqqqvpchltl.supabase.co
   - Navigate to **SQL Editor**

2. **Run the Setup Script**
   - Open `supabase-setup.sql` from your project
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **"Run"** (or press Cmd/Ctrl + Enter)

3. **Verify Tables Created**
   - Go to **Table Editor** in Supabase Dashboard
   - You should see all tables:
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

### Option 2: Using psql Command Line

```bash
# Connect to Supabase
psql "postgresql://postgres:YOUR_PASSWORD@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres" -f supabase-setup.sql
```

## What Gets Created

### Core Tables
- **customer_profile** - Unified customer profiles
- **profile_identifier** - Phone, email, device IDs linked to profiles
- **customer_raw_event** - Raw events from all sources
- **events** - Normalized, processed events

### Identity & Merging
- **identity_merge_log** - Log of all profile merges with rollback support

### Features
- **intent_message_log** - Intent detection from WhatsApp/email/chat
- **nudge_log** - Nudge execution tracking
- **ab_experiment** - A/B testing experiments
- **ab_assignment** - Customer variant assignments
- **ab_conversion** - A/B test conversions

### ML & Monitoring
- **ml_prediction_log** - ML model predictions
- **ml_drift_check** - Model drift detection
- **ml_alert** - ML alerts and notifications

## Extensions Enabled

- ✅ **uuid-ossp** - UUID generation
- ✅ **pgcrypto** - Cryptographic functions
- ✅ **vector** - pgvector for embeddings

## Custom Types Created

- `identifier_type` - Phone, email, device, etc.
- `event_status` - Accepted, quarantined, processed
- `merge_status` - Auto, manual, pending_review, rolled_back

## View Your Data

After running the script, you can:

1. **View Tables**: Supabase Dashboard → Table Editor
2. **Run Queries**: Supabase Dashboard → SQL Editor
3. **View Schema**: Supabase Dashboard → Database → Tables
4. **See Indexes**: All performance indexes are created automatically

## Next Steps

1. ✅ Tables created
2. ✅ Test connection from your app
3. ✅ Start ingesting data
4. ✅ View data in Supabase Dashboard

## Troubleshooting

### Error: "Extension vector does not exist"
- Go to **Database** → **Extensions**
- Enable **"vector"** extension
- Re-run the script

### Error: "Type already exists"
- This is fine - the script uses `IF NOT EXISTS`
- Continue running the script

### Error: "Table already exists"
- Tables might already be created
- Check **Table Editor** to see what exists
- Drop tables if you want a fresh start

---

**All tables are now ready in Supabase!** 🎉

View them at: https://supabase.com/dashboard/project/opemkjouudqqqvpchltl/editor

