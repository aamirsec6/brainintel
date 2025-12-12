# 🔐 Supabase Authentication Setup

Add real user authentication to your Retail Brain dashboard using Supabase Auth.

## Quick Setup

### 1. Get Supabase API Keys

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Update Environment Variables

Add to your `.env` file (or `.env.local` for Next.js):

```bash
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Enable Email Auth Provider

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Enable **Email** provider
3. (Optional) Configure email templates

### 4. Restart Dashboard

```bash
cd apps/dashboard
PORT=3100 pnpm dev
```

## What You Get

✅ **Real User Signup** - Users can create accounts  
✅ **Secure Login** - Password-based authentication  
✅ **User Management** - View all users in Supabase Dashboard  
✅ **Session Management** - Automatic session handling  
✅ **Email Verification** - Optional email confirmation  

## View Users in Supabase

1. Go to **Authentication** → **Users**
2. See all registered users
3. View user details, email, signup date
4. Manage user accounts

## Features

### Automatic Features
- ✅ Password hashing (bcrypt)
- ✅ Session tokens (JWT)
- ✅ Secure password reset
- ✅ Email verification (optional)

### Dashboard Access
- View all users in Supabase Dashboard
- See signup dates and activity
- Manage user roles (if you add them)

## Next Steps

1. ✅ Add Supabase Auth keys to `.env`
2. ✅ Enable Email provider
3. ✅ Test signup/login
4. ✅ View users in Supabase Dashboard

## Optional: Add User Profiles Table

Create a `user_profiles` table to store additional user data:

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  company TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Then use Supabase RLS (Row Level Security) to secure it.

---

**Done!** Your login page now uses Supabase Auth. View all users in the Supabase Dashboard! 🎉

