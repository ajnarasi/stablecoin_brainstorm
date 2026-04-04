// API base URLs -- configured via environment variables for deployment
// In development: defaults to localhost
// In production: set VITE_P1_URL, VITE_P2_URL, etc. in Vercel env vars

export const API = {
  p1: import.meta.env.VITE_P1_URL || 'http://localhost:8001/api',
  p2: import.meta.env.VITE_P2_URL || 'http://localhost:8002/api',
  p3: import.meta.env.VITE_P3_URL || 'http://localhost:8003/api',
  p4: import.meta.env.VITE_P4_URL || 'http://localhost:8004/api',
};
