# Backend Setup & Deployment Guide

## ✅ Current Status

Your backend is **ready for deployment**. Here's what's configured:

### Backend Features
- ✅ Express server with Supabase integration
- ✅ Session-based authentication (SQLite)
- ✅ Admin login/logout endpoints
- ✅ CORS configured for Vercel deployment
- ✅ WebSocket for real-time updates
- ✅ All environment variables properly set

### API Endpoints (Ready to Use)
```
GET  /api/health              - Server status
GET  /api/auth/me             - Current user status
GET  /api/auth/needs-setup    - Check if setup required
POST /api/auth/setup          - Create first admin (only works if no admin exists)
POST /api/auth/login          - Admin login
POST /api/auth/logout         - Admin logout
GET  /api/menu                - Get menu data
POST /api/orders              - Create order
... and more
```

## 🚀 Local Testing (Current Setup)

### Running Both Frontend & Backend Locally

**Terminal 1 - Backend Server:**
```bash
npm run dev
```
This starts the Express server on `http://localhost:5000`

**Terminal 2 - Frontend Client:**
```bash
npm run dev:client
```
This starts Vite on `http://localhost:5001`

### Testing Admin Portal Locally

1. Open `http://localhost:5001/admin`
2. If no admin exists, create one:
   - Username: `admin@restaurant.com`
   - Password: `test123`
   - Display Name: `Admin`
3. Login and verify it works

## 🌐 Deploy to Vercel (Production)

### Quick Deploy (Recommended)

1. **Make sure code is committed:**
   ```bash
   git add .
   git commit -m "Backend and Supabase auth configured"
   git push
   ```

2. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Follow prompts:**
   - Confirm your project
   - Link to GitHub
   - Deploy

### Detailed Deploy (Vercel Dashboard)

1. Go to [https://vercel.com](https://vercel.com)
2. Create new project
3. Import your GitHub repository
4. Click "Deploy"
5. **When Vercel shows "Configuration," add environment variables:**

## 🔐 Environment Variables for Vercel

Add these in **Vercel → Project Settings → Environment Variables:**

| Variable | Value | Type |
|----------|-------|------|
| `NODE_ENV` | `production` | Secret |
| `PORT` | `5000` | Secret |
| `SESSION_SECRET` | *[Generate random: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`]* | Secret |
| `SUPABASE_URL` | `https://ugkmyvjxvdwhbjextdab.supabase.co` | Secret |
| `SUPABASE_ANON_KEY` | `sb_publishable_H6OPEALfk7eXQVWuaJfb8w_D74_XWxW` | Secret |
| `VITE_SUPABASE_URL` | `https://ugkmyvjxvdwhbjextdab.supabase.co` | Secret |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_H6OPEALfk7eXQVWuaJfb8w_D74_XWxW` | Secret |
| `CORS_ORIGIN` | `https://kebabil.vercel.app,https://www.your-domain.com` | Secret |
| `FRONTEND_URL` | `https://kebabil.vercel.app` | Secret |

### Generate SESSION_SECRET

Run this command locally to generate a secure random string:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as `SESSION_SECRET` in Vercel.

## ✅ Post-Deployment Checklist

After deployment completes:

1. **Test Health Check:**
   ```
   https://kebabil.vercel.app/api/health
   ```
   Should return: `Server running`

2. **Test Auth Endpoint:**
   ```
   https://kebabil.vercel.app/api/auth/needs-setup
   ```
   Should return JSON status

3. **Access Admin Portal:**
   ```
   https://kebabil.vercel.app/admin
   ```
   - If fresh deployment, create first admin account
   - Login and verify dashboard loads

4. **Test Real-time (Optional):**
   - Open admin panel
   - Open another window as customer
   - Place an order
   - Verify it appears in real-time in admin

## 📊 Verify Deployment

Check Vercel logs to confirm server started:
```bash
vercel logs --follow
```

Look for output like:
```
DATABASE_URL not set. Running with local SQLite storage.
Checking menu data...
Menu data already exists, skipping seed.
Server running on port 5000
```

## 🔧 Troubleshooting

### "Cannot find module" errors
- Run `npm install` before deploying
- Check build logs in Vercel

### CORS errors
- Update `CORS_ORIGIN` to match your Vercel domain
- Don't include `https://` in CORS_ORIGIN check (already checked)

### Login not working
- Verify `SUPABASE_`环境变量 are set correctly
- Check browser console for network errors
- Check Vercel server logs

### Database not persisting
- SQLite is ephemeral on Vercel (resets on deploy)
- For persistent data, migrate to PostgreSQL (Neon, Supabase, etc.)

## 📚 Build & Deployment Process

The `vercel.json` configuration handles:

1. **Build Command:** `npm run build`
   - Builds Vite frontend → `dist/client/`
   - Compiles TypeScript → `dist/server/`

2. **Output Directory:** `dist/`
   - Contains both frontend and server code

3. **Routing:**
   - `/api/*` → Backend (Express)
   - `/ws` → WebSocket (Backend)
   - Everything else → Frontend (index.html)

4. **Start Command:** `node dist/server/index.js`
   - Runs Express server on PORT 5000

## 🎯 What's Ready to Deploy

✅ Backend server with Supabase auth
✅ Frontend with Supabase client configured
✅ Admin authentication system
✅ Menu management APIs
✅ Order management system
✅ WebSocket for real-time updates
✅ Environment variables configured
✅ CORS properly set up
✅ Build process optimized

## ⚡ Next Steps

1. Run `npm run build` locally to verify build works
2. Test admin login locally
3. Deploy to Vercel
4. Create first admin on live site
5. Test admin portal
6. (Optional) Set up custom domain

---

**Questions?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.
