# 🌐 Admin Dashboard - Production Deployment Guide

## 📋 **Overview**

This guide covers deploying your admin dashboard to production on various platforms.

---

## ⚠️ **Important: Development vs Production**

### **Development (Current Setup):**
```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://192.168.108.239:5000', // Local IP
    changeOrigin: true
  }
}
```
- ✅ Works on your local network
- ❌ Won't work in production
- ❌ Other people can't access

### **Production:**
- ✅ Works anywhere on internet
- ✅ Accessible to all admins
- ✅ Uses your production backend URL

---

## 🎯 **Production Deployment Options**

### **Option 1: Netlify** (Recommended - Easiest)
### **Option 2: Vercel** (Fast & Free)
### **Option 3: Traditional Server** (VPS/Apache/Nginx)

---

## 🚀 **Option 1: Netlify (Recommended)**

### **Why Netlify?**
- ✅ Free tier available
- ✅ Automatic SSL (HTTPS)
- ✅ CDN (fast worldwide)
- ✅ Easy deployment
- ✅ Environment variables support

### **Step 1: Prepare for Production**

Update `admin-dashboard/vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        // Use environment variable for flexibility
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production for security
  }
});
```

### **Step 2: Update API Configuration**

Create `admin-dashboard/.env.production`:

```env
# Production backend URL
VITE_API_URL=https://your-backend-api.com
```

Update `admin-dashboard/src/api/axios.js`:

```javascript
import axios from 'axios';

// Create axios instance
const api = axios.create({
  // In production, use full backend URL (not proxy)
  baseURL: import.meta.env.PROD 
    ? 'https://your-backend-api.com/api'  // Production
    : '/api',                              // Development (uses proxy)
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### **Step 3: Build for Production**

```bash
cd admin-dashboard
npm run build
```

This creates a `dist/` folder with optimized files.

### **Step 4: Deploy to Netlify**

#### **Method A: Netlify CLI (Command Line)**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
cd admin-dashboard
netlify deploy --prod --dir=dist
```

#### **Method B: Netlify Web UI (Drag & Drop)**

1. Go to [https://app.netlify.com/](https://app.netlify.com/)
2. Sign up/login
3. Click **"Add new site"** → **"Deploy manually"**
4. Drag the `dist/` folder to the upload area
5. Done! Your site is live!

#### **Method C: GitHub Auto-Deploy**

1. Push code to GitHub
2. Go to Netlify → **"Add new site"** → **"Import from Git"**
3. Select your repository
4. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Add environment variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend-api.com`
6. Deploy!

### **Step 5: Configure Custom Domain (Optional)**

1. In Netlify dashboard, go to **"Domain settings"**
2. Click **"Add custom domain"**
3. Follow DNS configuration instructions
4. Example: `admin.hashview.com`

---

## 🚀 **Option 2: Vercel**

### **Step 1: Prepare (Same as Netlify)**

Follow Netlify Step 1-2 above.

### **Step 2: Build**

```bash
cd admin-dashboard
npm run build
```

### **Step 3: Deploy to Vercel**

#### **Method A: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd admin-dashboard
vercel --prod
```

#### **Method B: Vercel Web UI**

1. Go to [https://vercel.com/](https://vercel.com/)
2. Sign up/login
3. Click **"Add New"** → **"Project"**
4. Import from GitHub
5. Build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Add environment variable:
   - `VITE_API_URL=https://your-backend-api.com`
7. Deploy!

---

## 🚀 **Option 3: Traditional Server (VPS)**

### **Requirements:**
- VPS (DigitalOcean, Linode, AWS EC2, etc.)
- Nginx or Apache
- SSL certificate (Let's Encrypt)

### **Step 1: Build**

```bash
cd admin-dashboard
npm run build
```

### **Step 2: Upload to Server**

```bash
# Using SCP
scp -r dist/* user@your-server.com:/var/www/admin-dashboard/

# Or using FTP/SFTP
```

### **Step 3: Nginx Configuration**

Create `/etc/nginx/sites-available/admin-dashboard`:

```nginx
server {
    listen 80;
    server_name admin.hashview.com;

    root /var/www/admin-dashboard;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass https://your-backend-api.com/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/admin-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **Step 4: SSL Certificate (Let's Encrypt)**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d admin.hashview.com
```

---

## 🔒 **Backend CORS Configuration**

Your backend needs to allow the production admin dashboard URL.

Update `backend/server.js`:

```javascript
const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:3000',              // Development
    'https://admin.hashview.com',         // Production (custom domain)
    'https://your-netlify-app.netlify.app', // Netlify
    'https://your-vercel-app.vercel.app' // Vercel
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## 📋 **Production Checklist**

### **Before Deployment:**
- [ ] Update `axios.js` to use production backend URL
- [ ] Create `.env.production` with backend URL
- [ ] Remove console.logs from code
- [ ] Disable sourcemaps (`sourcemap: false`)
- [ ] Test build locally: `npm run build && npm run preview`

### **Backend Configuration:**
- [ ] Update CORS to allow admin dashboard URL
- [ ] Ensure backend is deployed and accessible
- [ ] SSL certificate on backend (HTTPS)
- [ ] Environment variables configured

### **After Deployment:**
- [ ] Test login functionality
- [ ] Test all CRUD operations
- [ ] Verify API calls work
- [ ] Check browser console for errors
- [ ] Test on different devices/browsers

---

## 🎯 **Environment Variables Summary**

### **Development (Local):**
```javascript
// vite.config.js - Uses proxy
proxy: { '/api': { target: 'http://192.168.108.239:5000' } }

// axios.js - Uses relative path
baseURL: '/api'
```

### **Production:**
```javascript
// .env.production
VITE_API_URL=https://your-backend-api.com

// axios.js - Uses full URL
baseURL: import.meta.env.PROD 
  ? 'https://your-backend-api.com/api'
  : '/api'
```

---

## 🔧 **Quick Production Update**

Here's what you need to change for production:

### **File 1: `admin-dashboard/src/api/axios.js`**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? 'https://your-backend-api.com/api'  // ← Change this!
    : '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// ... rest stays the same
```

### **File 2: `admin-dashboard/.env.production` (Create this)**

```env
VITE_API_URL=https://your-backend-api.com
```

### **Build & Deploy:**

```bash
cd admin-dashboard
npm run build
# Upload 'dist' folder to hosting
```

---

## 🚀 **Recommended Stack**

```
Frontend (Admin Dashboard)
├── Hosting: Netlify or Vercel
├── Domain: admin.hashview.com
└── SSL: Automatic (Let's Encrypt)

Backend (API)
├── Hosting: DigitalOcean/AWS/Heroku
├── Domain: api.hashview.com
└── SSL: Let's Encrypt

Database (MongoDB)
└── MongoDB Atlas (Cloud)
```

---

## 💰 **Cost Estimate**

| Service | Free Tier | Paid |
|---------|-----------|------|
| **Netlify/Vercel** | ✅ Yes (100GB bandwidth) | $19/mo for more |
| **Backend (DigitalOcean)** | ❌ No | $5-12/mo |
| **MongoDB Atlas** | ✅ Yes (512MB) | $9/mo for more |
| **Domain** | ❌ No | $10-15/year |
| **SSL Certificate** | ✅ Free (Let's Encrypt) | - |

**Total: ~$5-12/month** (backend only, rest is free!)

---

## 🐛 **Common Production Issues**

### **Issue 1: CORS Error**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Fix:** Add admin dashboard URL to backend CORS configuration

### **Issue 2: 404 on Refresh**
**Fix:** Configure server to serve `index.html` for all routes
- Netlify: Create `_redirects` file: `/* /index.html 200`
- Nginx: Use `try_files $uri /index.html`

### **Issue 3: API Calls Fail**
**Fix:** Check `axios.js` is using correct production backend URL

### **Issue 4: Mixed Content (HTTP/HTTPS)**
**Fix:** Ensure both frontend and backend use HTTPS

---

## ✅ **Quick Deploy Commands**

### **Netlify:**
```bash
cd admin-dashboard
npm run build
netlify deploy --prod --dir=dist
```

### **Vercel:**
```bash
cd admin-dashboard
npm run build
vercel --prod
```

### **Manual (SCP):**
```bash
cd admin-dashboard
npm run build
scp -r dist/* user@server:/var/www/admin-dashboard/
```

---

## 📝 **Next Steps After Deployment**

1. ✅ Access your production URL
2. ✅ Login with admin credentials
3. ✅ Test all features
4. ✅ Monitor error logs
5. ✅ Set up uptime monitoring (UptimeRobot, Pingdom)

---

**Your admin dashboard is ready for production!** 🚀🌐

Choose your deployment method and go live! 🎉

