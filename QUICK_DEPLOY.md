# 🚀 Quick Deploy to Render.com (Free Tier)

## One-Click Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### 2. Deploy on Render

1. Go to https://render.com and sign up/login
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account
4. Select your repository
5. Render will auto-detect `render.yaml`
6. Click **"Apply"** - This deploys:
   - ✅ PostgreSQL (free for 90 days)
   - ✅ Redis (free tier)
   - ✅ API Gateway
   - ✅ Event Collector  
   - ✅ MLflow Server

### 3. Set API Keys (Required)

After deployment:

1. Go to **API Gateway** service → **Environment** tab
2. Add this variable:
   ```
   API_GATEWAY_API_KEYS=your-secret-key-here
   ```
   Generate a secure key:
   ```bash
   openssl rand -hex 32
   ```
3. Click **"Save Changes"** - service will auto-restart

### 4. Run Database Migrations

1. Go to **API Gateway** → **Shell** tab
2. Run:
   ```bash
   pnpm install
   pnpm db:migrate
   ```

### 5. Get Your URLs

After ~5 minutes, you'll have:

- **API Gateway**: `https://retail-brain-api-gateway.onrender.com`
- **Event Collector**: `https://retail-brain-event-collector.onrender.com`
- **MLflow**: `https://retail-brain-mlflow.onrender.com`

### 6. Test It!

```bash
curl https://retail-brain-api-gateway.onrender.com/health
```

Should return:
```json
{"status":"ok","service":"api-gateway"}
```

## ⚠️ Important Notes

### Free Tier Limitations:

1. **Services spin down after 15min inactivity**
   - First request takes 30-60 seconds to wake up
   - This is normal for free tier

2. **PostgreSQL is free for 90 days only**
   - After that: $7/month minimum
   - Your data is safe, just need to upgrade

3. **Update Service URLs** (if you add more services):
   - Go to API Gateway → Environment
   - Update URLs like:
     ```
     EVENT_COLLECTOR_URL=https://retail-brain-event-collector.onrender.com
     ```

## 🎯 What's Deployed

✅ **Core Infrastructure:**
- PostgreSQL with pgvector extension
- Redis cache
- MLflow tracking server

✅ **Services:**
- API Gateway (main entry point)
- Event Collector (ingests customer events)

## 📝 Next Steps

1. **Add More Services** (if needed):
   - Profile Service
   - Identity Engine
   - ML Services
   - etc.

2. **Custom Domain** (optional):
   - Settings → Custom Domains
   - Point your domain to Render

3. **Upgrade for Production**:
   - Paid plans = always-on services
   - No spin-down delays
   - More resources

## 🆘 Troubleshooting

**Service won't start?**
- Check Logs tab for errors
- Verify environment variables are set
- Wait for PostgreSQL to be "Ready" (green)

**Database connection errors?**
- Wait 2-3 minutes after first deploy
- Check that PostgreSQL shows "Ready" status
- Verify env vars are auto-populated

**Slow first request?**
- Normal for free tier (spin-down)
- Consider paid plan for always-on

## ✅ Success Checklist

- [ ] All services show "Live" status
- [ ] API Gateway health check works
- [ ] Database migrations completed
- [ ] API keys configured
- [ ] Can access dashboard (if deployed)

---

**That's it! Your Retail Brain platform is now live on the internet! 🎉**

