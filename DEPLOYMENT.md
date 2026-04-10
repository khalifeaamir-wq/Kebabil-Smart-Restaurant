# Kebabil - Deployment Guide

This guide explains how to deploy the Kebabil restaurant ordering system to Vercel with Supabase authentication.

## Prerequisites

1. **GitHub Account** - Push code to GitHub
2. **Vercel Account** - Deploy frontend and backend (free tier available)
3. **Supabase Project** - Already created: `https://ugkmyvjxvdwhbjextdab.supabase.co`

## Supabase Credentials (Already Set Up)

```
URL: https://ugkmyvjxvdwhbjextdab.supabase.co
Anon Key: sb_publishable_H6OPEALfk7eXQVWuaJfb8w_D74_XWxW
```

## Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select project: **Kebabil**
5. Click "Deploy"

### Option B: Using Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts to connect your GitHub account and deploy.

## Step 3: Set Environment Variables in Vercel

After deployment starts, go to **Project Settings → Environment Variables** and add:

### Frontend Variables (Vite - will be included in build)
```
VITE_SUPABASE_URL = https://ugkmyvjxvdwhbjextdab.supabase.co
VITE_SUPABASE_ANON_KEY = sb_publishable_H6OPEALfk7eXQVWuaJfb8w_D74_XWxW
```

### Backend Variables (Runtime Environment)
```
NODE_ENV = production
PORT = 5000
SESSION_SECRET = [GENERATE A LONG RANDOM STRING - use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
SUPABASE_URL = https://ugkmyvjxvdwhbjextdab.supabase.co
SUPABASE_ANON_KEY = sb_publishable_H6OPEALfk7eXQVWuaJfb8w_D74_XWxW
CORS_ORIGIN = https://kebabil.vercel.app,https://www.your-custom-domain.com
FRONTEND_URL = https://kebabil.vercel.app
```

### Generate SESSION_SECRET

Run this locally:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as `SESSION_SECRET` in Vercel.

## Step 4: Verify Deployment

Once deployed, test the following URLs:

```
Frontend:  https://kebabil.vercel.app/
API Health: https://kebabil.vercel.app/api/health
Auth Status: https://kebabil.vercel.app/api/auth/me
```

## Step 5: Set Up First Admin Account

1. Open your deployed frontend: `https://kebabil.vercel.app/`
2. Click "Admin Portal" or navigate to `/admin`
3. If no admin exists yet, you'll see the setup form
4. Create your first admin account:
   - Username: `admin@your-restaurant.com`
   - Password: `your-secure-password`
   - Display Name: `Your Name`

## Step 6: Test Admin Login

1. Log out if logged in
2. Return to Admin Portal
3. Log in with your credentials
4. Verify you can access:
   - Dashboard
   - Menu management
   - Orders
   - Analytics

## Step 7: Set Up Custom Domain (Optional)

In Vercel **Project Settings → Domains**:
1. Add your custom domain (e.g., `kebabil.yourdomain.com`)
2. Update DNS records as instructed
3. Update `CORS_ORIGIN` and `FRONTEND_URL` in environment variables

## Troubleshooting

### "Unauthorized" on API calls
- Check `SESSION_SECRET` is set
- Verify `CORS_ORIGIN` includes your frontend URL
- Check browser console for CORS errors

### Login not working
- Verify Supabase credentials in environment variables
- Check browser DevTools Network tab for API response
- Look at Vercel logs: `vercel logs`

### Database issues
- SQLite database is created automatically on first run
- Check Vercel filesystem (ephemeral - resets on deploys)
- Consider migrating to PostgreSQL for production

### View Server Logs
```bash
vercel logs --follow
```

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] `SESSION_SECRET` is a long random string
- [ ] `CORS_ORIGIN` includes all frontend domains
- [ ] Custom domain configured (if applicable)
- [ ] First admin account created
- [ ] Test login works
- [ ] Test menu operations
- [ ] Test order creation
- [ ] Verify WebSocket connectivity (if using real-time features)

## Vercel Configuration

The `vercel.json` file is already configured:
- Builds with `npm run build`
- Serves from `dist/` directory
- Rewrites SPA routes to `index.html`
- APIs route to backend server

## Build Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/((?!api/|ws$).*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures:
- Frontend loads from `dist/client/`
- API calls go to `/api/*` (backend)
- WebSocket stays at `/ws`

## Database Migration

By default, SQLite is used. For production with persistent data:

**Option 1: Use Vercel KV** (Redis)
- More reliable than ephemeral SQLite
- Free tier available

**Option 2: PostgreSQL** (Neon, Supabase, etc.)
- Update `server/storage.ts` connection
- Set `DATABASE_URL` environment variable

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Project Issues**: Check GitHub issues

---

**Deployment Summary:**
1. Push to GitHub ✅
2. Import in Vercel ✅
3. Set environment variables ✅
4. Deploy ✅
5. Create first admin ✅
6. Test live ✅
