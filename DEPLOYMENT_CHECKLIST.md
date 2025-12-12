# ✅ Deployment Checklist

Use this checklist to ensure everything is deployed correctly.

## Pre-Deployment

- [ ] All code committed and pushed to GitHub
- [ ] `.env` file has production values (don't commit it!)
- [ ] Supabase database tables created
- [ ] Supabase Auth enabled

## Railway Backend Services

- [ ] API Gateway deployed and accessible
- [ ] Profile Service deployed
- [ ] Onboarding Service deployed
- [ ] AI Assistant Service deployed
- [ ] Intent Service (Python) deployed
- [ ] Embedding Service (Python) deployed
- [ ] All services have correct `DATABASE_URL`
- [ ] API Gateway has all service URLs configured
- [ ] API Gateway has public URL generated

## Vercel Dashboard

- [ ] Dashboard deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` set to Railway API Gateway URL
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured
- [ ] Dashboard accessible at Vercel URL

## Testing

- [ ] API Gateway health check works: `curl https://your-api.railway.app/health`
- [ ] Dashboard loads at Vercel URL
- [ ] Can sign up new user
- [ ] Can sign in
- [ ] Dashboard shows customer stats
- [ ] CSV import works
- [ ] Customer search works
- [ ] Analytics dashboard loads

## Security

- [ ] Strong API keys set in production
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] Environment variables not committed to git
- [ ] Supabase RLS enabled (if needed)

## Monitoring

- [ ] Railway logs accessible
- [ ] Vercel logs accessible
- [ ] Error tracking set up (optional)

---

**Once all checked, your platform is live!** 🚀

