# Deployment Guide: Fiserv Digital Pay Demo

## Architecture

```
Vercel (Frontend)              Render (Backends)
demo-app/ ─────────────────>  P1: Yield Sweep    (Python/FastAPI)
  React + Vite                P3: Supplier Pay   (Python/FastAPI)
  Port 3000                   P4: Cross-Border   (Python/FastAPI)
```

---

## Step 1: Deploy Backends on Render

### Option A: Render Blueprint (recommended)

1. Push this repo to GitHub
2. Go to [render.com/dashboard](https://render.com/dashboard)
3. Click **New** > **Blueprint**
4. Connect your GitHub repo
5. Render reads `render.yaml` and creates all 3 services automatically
6. Note the URLs it assigns (e.g., `https://fiserv-yield-sweep.onrender.com`)

### Option B: Manual Setup (per service)

For each backend (P1, P3, P4):

1. Go to Render > **New** > **Web Service**
2. Connect your GitHub repo
3. Configure:

| Setting | P1: Yield Sweep | P3: Supplier Pay | P4: Cross-Border |
|---------|----------------|------------------|------------------|
| **Name** | fiserv-yield-sweep | fiserv-supplier-pay | fiserv-cross-border |
| **Root Directory** | `prototype-1-yield-sweep/backend` | `prototype-3-supplier-pay/backend` | `prototype-4-cross-border/backend` |
| **Runtime** | Python 3 | Python 3 | Python 3 |
| **Build Command** | `pip install -r requirements.txt` | `pip install -r requirements.txt` | `pip install -r requirements.txt` |
| **Start Command** | `python run.py` | `python run.py` | `python run.py` |

4. Add environment variable: `DEMO_MODE` = `true`
5. Click **Create Web Service**
6. Wait for deploy to complete (~2-3 minutes)
7. Note the URL (e.g., `https://fiserv-yield-sweep.onrender.com`)

---

## Step 2: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project** > Import your GitHub repo
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `demo-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add **Environment Variables** (use the Render URLs from Step 1):

| Variable | Value |
|----------|-------|
| `VITE_P1_URL` | `https://fiserv-yield-sweep.onrender.com/api` |
| `VITE_P2_URL` | `https://fiserv-agent-pay.onrender.com/api` |
| `VITE_P3_URL` | `https://fiserv-supplier-pay.onrender.com/api` |
| `VITE_P4_URL` | `https://fiserv-cross-border.onrender.com/api` |

5. Click **Deploy**
6. Your demo is live at `https://your-project.vercel.app`

---

## Step 3: Verify

1. Open the Vercel URL
2. Check that all health indicators in the navbar turn green
3. Navigate to each prototype and test the live demo:
   - Yield Sweep: Seed > Trigger Sweep > Check trace panel
   - Supplier Pay: Seed > AI Auto-Order > Check savings
   - Cross-Border: Seed > Process Payment (MXN) > Check comparison

---

## Render Free Tier Notes

- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30-60 seconds (cold start)
- The health indicators in the navbar will show offline during cold start
- After the first request, services stay warm for 15 minutes
- For Investor Day: hit each backend URL once 5 minutes before the demo to warm them up

---

## Local Development

```bash
# Start backends
cd prototype-1-yield-sweep/backend && python3 run.py &
cd prototype-3-supplier-pay/backend && python3 run.py &
cd prototype-4-cross-border/backend && python3 run.py &

# Start frontend
cd demo-app && npx vite --port 3000

# Open http://localhost:3000
```

No environment variables needed for local -- defaults to localhost.
