# 🚀 Vercel Deployment Guide - KOPSP Simpan Pinjam

## Problem

The app is deployed on Vercel but the **backend API is not running**, so API calls return 404.

---

## ✅ Solution

You need to deploy the backend to a separate service (Railway, Render, Heroku, etc.) and configure the frontend to point to it.

### **Option 1: Deploy Backend to Railway (Recommended)**

#### Step 1: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub or create account
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your `KateroSoy/KOPSP` repository
5. Railway automatically detects `package.json` and `server.index.ts`
6. Configure environment variables in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=3001 (Railway assigns this automatically)
   JWT_SECRET=your-long-random-secret
   JWT_EXPIRES_IN=7d
   ADMIN_CODE=ADM-001
   ALLOW_DEMO_FALLBACK=false
   FORCE_DEMO_FALLBACK=false
   DATABASE_URL=your-supabase-postgres-url
   DIRECT_URL=your-supabase-direct-url
   ```
7. Deploy → Get your backend URL like `https://kopsp-production.up.railway.app`

#### Step 2: Update Vercel Environment Variables

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `KOPSP` project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   ```
   Name: VITE_API_BASE_URL
   Value: https://kopsp-production.up.railway.app
   Environments: Production, Preview, Development
   ```
5. Redeploy on Vercel (it will auto-redeploy when env changes)

#### Step 3: Update CORS on Backend

Make sure `server.app.ts` has CORS enabled:

Check if you have this in your Express setup:
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.APP_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
```

---

### **Option 2: Deploy Backend to Render**

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository
4. Fill in:
   - **Name:** kopsp-api
   - **Environment:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
5. Add same environment variables as Railway
6. Deploy → Get your URL like `https://kopsp-api.onrender.com`
7. Add to Vercel `VITE_API_BASE_URL=https://kopsp-api.onrender.com`

---

### **Option 3: Keep Backend on Same Vercel Project (Advanced)**

If you want everything on Vercel, you need to use Vercel Functions:

1. Create `/api/[...].ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../../server.app';

const app = createApp();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
```

2. Update `package.json`:
```json
{
  "scripts": {
    "build": "vite build && tsc -p tsconfig.server.json && npm run prisma:generate"
  }
}
```

⚠️ **Note:** This approach has limitations:
- Vercel Functions have 10-second timeout
- Cold start delays
- Prisma migrations need manual setup
- Not recommended for production with heavy database queries

---

## 📋 Quick Checklist

- [ ] Deploy backend to Railway/Render/Heroku
- [ ] Get backend API URL (e.g., `https://kopsp-api.railway.app`)
- [ ] Add `VITE_API_BASE_URL` to Vercel environment variables
- [ ] Ensure backend has CORS enabled for your Vercel domain
- [ ] Redeploy on Vercel
- [ ] Test login on `https://kopsp.vercel.app`

---

## 🔗 Environment Variables Reference

### **Frontend (Vercel)**
```
VITE_API_BASE_URL=https://your-backend-domain.com
NODE_ENV=production
```

### **Backend (Railway/Render)**
```
NODE_ENV=production
PORT=3001 (Railway assigns)
APP_ORIGIN=https://kopsp.vercel.app
JWT_SECRET=long-random-secret-key
JWT_EXPIRES_IN=7d
ADMIN_CODE=ADM-001
ALLOW_DEMO_FALLBACK=false
FORCE_DEMO_FALLBACK=false
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

---

## 🐛 Troubleshooting

### **Still Getting 404?**
1. Verify `VITE_API_BASE_URL` is set in Vercel
2. Check backend is running: visit `https://your-backend.app/api/auth/login` in browser
3. Redeploy Vercel after changing env variables
4. Check browser console for actual URL being called

### **CORS Error?**
1. Make sure backend has CORS enabled
2. Check `APP_ORIGIN` env variable matches frontend URL

### **Backend Not Starting?**
1. Check logs on Railway/Render dashboard
2. Verify DATABASE_URL and DIRECT_URL are correct
3. Run migrations: `npx prisma migrate deploy`

---

**Questions?** Check your backend logs on Railway/Render dashboard! 🚀
