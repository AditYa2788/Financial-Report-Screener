# Deployment Guide

Stack: React (Vercel) + Express/MongoDB (Render + MongoDB Atlas)

---

## 1. MongoDB Atlas (free)

1. Go to https://cloud.mongodb.com → create a free M0 cluster
2. Under **Database Access** → create a user with read/write permissions
3. Under **Network Access** → add `0.0.0.0/0` (allow all IPs, required for Render)
4. Click **Connect** → **Drivers** → copy the URI:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/financial-screener?retryWrites=true&w=majority
   ```

---

## 2. Backend → Render (free)

1. Push your code to GitHub if not already there
2. Go to https://render.com → **New Web Service**
3. Connect your GitHub repo
4. Set **Root Directory** = `financial-screener/backend`
5. Set these values:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. Add environment variables:
   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | your Atlas URI from step 1 |
   | `NODE_ENV` | `production` |
   | `SEC_USER_AGENT` | `FinancialScreener your@email.com` |
   | `FRONTEND_URL` | *(set after Vercel deploy — come back here)* |
7. Click **Deploy** — note your backend URL, e.g. `https://financial-screener-backend.onrender.com`

---

## 3. Frontend → Vercel (free)

1. Go to https://vercel.com → **New Project** → import your GitHub repo
2. Set **Root Directory** = `financial-screener/frontend`
3. Framework should auto-detect as **Vite**
4. Add environment variable:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://financial-screener-backend.onrender.com/api` |
5. Click **Deploy** — note your frontend URL, e.g. `https://financial-screener.vercel.app`

---

## 4. Wire up CORS

Go back to your Render service → **Environment** → set:
```
FRONTEND_URL = https://financial-screener.vercel.app
```
Trigger a redeploy.

---

## 5. Seed initial data

Once both services are running, hit the seed script once to populate the database:

```bash
cd financial-screener/backend
MONGODB_URI="your-atlas-uri" npm run seed
```

Or run it locally with your `.env` configured — it writes to the Atlas cluster directly.

---

## Free tier notes

- **Render free tier** spins down after 15 min of inactivity — first request after sleep takes ~30s. Upgrade to a paid instance ($7/mo) to avoid this.
- **MongoDB Atlas M0** has 512MB storage — more than enough for this project.
- **Vercel** free tier is unlimited for static sites.
