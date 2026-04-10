# ⚡ Quick Deployment Checklist

Complete these steps to deploy your Kebabil restaurant app to live with admin login.

## Pre-Deployment (Local)

- [ ] **Install dependencies**
  ```bash
  npm install
  ```

- [ ] **Test local build**
  ```bash
  npm run build
  ```

- [ ] **Verify no errors**
  - Check console output for any errors
  - Should show "dist" folder created

- [ ] **Commit code**
  ```bash
  git add .
  git commit -m "Ready for deployment with Supabase auth"
  git push origin main
  ```

## Deployment (Vercel)

- [ ] **Go to Vercel Dashboard**
  - URL: https://vercel.com

- [ ] **Import Repository**
  - Click "New Project"
  - Select your Kebabil GitHub repo
  - Click "Import"

- [ ] **Configure Build (Auto-detected)**
  - Build Command: `npm run build` ✓
  - Output Dir: `dist` ✓
  - Install Command: `npm install` ✓

- [ ] **Set Environment Variables**

  Add these in Vercel → Project Settings → Environment Variables:

  **Frontend Variables:**
  ```
  VITE_SUPABASE_URL = https://ugkmyvjxvdwhbjextdab.supabase.co
  VITE_SUPABASE_ANON_KEY = sb_publishable_H6OPEALfk7eXQVWuaJfb8w_D74_XWxW
  ```

  **Backend Variables:**
  ```
  NODE_ENV = production
  PORT = 5000
  SESSION_SECRET = [RUN: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
  SUPABASE_URL = https://ugkmyvjxvdwhbjextdab.supabase.co
  SUPABASE_ANON_KEY = sb_publishable_H6OPEALfk7eXQVWuaJfb8w_D74_XWxW
  CORS_ORIGIN = https://your-vercel-domain.vercel.app
  FRONTEND_URL = https://your-vercel-domain.vercel.app
  ```

  > **How to generate SESSION_SECRET:**
  > ```bash
  > node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  > ```
  > Copy output and paste in Vercel

- [ ] **Deploy**
  - Click "Deploy"
  - Wait for build to complete (5-10 minutes)
  - Watch deployment logs

## Post-Deployment (Testing)

- [ ] **Check Health Endpoint**
  ```
  https://YOUR-VERCEL-URL.vercel.app/api/health
  ```
  Should return: `Server running`

- [ ] **Check Auth Status**
  ```
  https://YOUR-VERCEL-URL.vercel.app/api/auth/needs-setup
  ```
  Should return: `{"needsSetup":true}` or `false`

- [ ] **Visit Admin Portal**
  ```
  https://YOUR-VERCEL-URL.vercel.app/admin
  ```

- [ ] **Create First Admin Account**
  - Username/Email: `admin@your-restaurant.com`
  - Password: Create a strong password (12+ characters)
  - Display Name: Your name
  - Click "Setup"

- [ ] **Login with New Credentials**
  - Use the email and password you just created
  - Should see admin dashboard

- [ ] **Test Admin Features**
  - [ ] View menu items
  - [ ] Manage orders
  - [ ] View analytics
  - [ ] Navigate all pages

- [ ] **View Deployment Logs**
  ```bash
  vercel logs --follow
  ```

## Troubleshooting Quick Fixes

### Build Failed
- [ ] Check for TypeScript errors: `npm run check`
- [ ] Clear node_modules: `rm -rf node_modules && npm install`
- [ ] Check environment variables syntax

### Login Not Working
- [ ] Verify `SUPABASE_URL` is correct
- [ ] Verify `SUPABASE_ANON_KEY` is correct
- [ ] Check browser console (F12) for errors
- [ ] Check Vercel logs: `vercel logs --follow`

### CORS Errors
- [ ] Update `CORS_ORIGIN` environment variable
- [ ] Include your Vercel domain (with https://)
- [ ] Redeploy after updating

### Database Issues
- [ ] SQLite resets on each Vercel deploy (normal)
- [ ] Admin accounts persist in "sessions.db"
- [ ] Data is temporary - consider PostgreSQL for production

## Environment Variables Reference

| Variable | Production Value | Example |
|----------|------------------|---------|
| `NODE_ENV` | `production` | - |
| `PORT` | `5000` | - |
| `SESSION_SECRET` | Random 32-char hex string | `a1b2c3d4e5f6...` |
| `SUPABASE_URL` | Supabase project URL | `https://ugkmyvjxvdwhbjextdab.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase public key | `sb_publishable_...` |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` | - |
| `VITE_SUPABASE_ANON_KEY` | Same as `SUPABASE_ANON_KEY` | - |
| `CORS_ORIGIN` | Your Vercel domain | `https://kebabil.vercel.app` |
| `FRONTEND_URL` | Your Vercel domain | `https://kebabil.vercel.app` |

## After Successful Deployment

- [ ] **Share admin portal URL**
  - Give `https://your-domain.vercel.app/admin` to admin user

- [ ] **Create production admin accounts**
  - Email format: `firstname.lastname@restaurant.com`
  - Strong passwords (12+ characters, mix of types)

- [ ] **Test from different devices**
  - Mobile (customer experience)
  - Tablet/Desktop (admin portal)
  - Different browsers

- [ ] **Monitor performance**
  - Check Vercel Analytics
  - Monitor response times
  - Check error logs daily first week

## Going Further (Optional)

- [ ] **Set Custom Domain**
  - In Vercel: Settings → Domains
  - Point DNS records to Vercel
  - Update `CORS_ORIGIN` and `FRONTEND_URL`

- [ ] **Set Up PostgreSQL** (for persistent data)
  - Upgrade from SQLite to production database
  - Update connection string in environment

- [ ] **Enable Analytics**
  - Vercel Analytics dashboard
  - Track user behavior

- [ ] **Set Up Monitoring**
  - Error tracking (Sentry)
  - Performance monitoring
  - Uptime alerts

## ✅ You're Done!

Your admin portal is now **live at:**
```
https://your-vercel-domain.vercel.app/admin
```

Admins can log in and:
- 📋 Manage restaurant tables
- 🍽️ Manage menu items
- 📦 Process orders
- 📊 View analytics
- 🔔 Get real-time notifications

---

**Need Help?**
- See `DEPLOYMENT.md` for detailed guide
- See `BACKEND_SETUP.md` for technical details
- Check Vercel logs: `vercel logs --follow`
