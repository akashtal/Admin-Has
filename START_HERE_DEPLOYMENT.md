# 🚀 START HERE - Deploy HashView in 30 Minutes

## **✅ WHAT YOU HAVE NOW:**

1. ✅ **APK Built:** `app-release.apk` (at `frontend/android/app/build/outputs/apk/release/`)
2. ⚠️ **Problem:** APK connects to `http://10.44.239.239:5000` (your local computer)
3. ⚠️ **Issue:** Won't work on tester's phones (they're not on your network!)

## **🎯 WHAT YOU NEED TO DO:**

```
Deploy Backend → Update API URL → Rebuild APK → Share!
     (5 min)        (1 min)         (15 min)     (Done!)
```

---

## **STEP 1: Deploy Backend to Railway (5 minutes)**

### **1a. Create MongoDB Database (Free)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up → Create FREE cluster
3. **Database Access** → Add User (`hashview` / create password)
4. **Network Access** → Add IP: `0.0.0.0/0`
5. **Connect** → Copy connection string:
   ```
   mongodb+srv://hashview:PASSWORD@cluster0.xxxxx.mongodb.net/hashview
   ```
   (Replace `PASSWORD` with your actual password)

### **1b. Deploy to Railway (Free)**
1. Go to https://railway.app/
2. Sign up with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Select: HashView repository
5. Railway detects Node.js → Click "Deploy"
6. **Variables** tab → Click "RAW Editor" → Paste:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://hashview:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/hashview?retryWrites=true&w=majority
JWT_SECRET=super-secret-jwt-key-change-this-please-abc123xyz789
JWT_EXPIRE=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=hashview@gmail.com
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
FRONTEND_URL=*
```

7. **Save** → Wait 2 minutes
8. **Settings** → Copy your URL: `https://hashview-production-xxxx.up.railway.app`

### **1c. Test Backend is Live**

Open in browser:
```
https://hashview-production-xxxx.up.railway.app/health
```

Should see: `{"status":"ok","timestamp":"..."}`

✅ If you see this, backend is deployed!

---

## **STEP 2: Update Frontend API URL (1 minute)**

**File:** `frontend/src/config/api.config.js`

**Find these lines (around line 6-12):**
```javascript
BASE_URL: __DEV__ 
  ? 'http://10.44.239.239:5000/api'
  : 'https://your-backend-api.com/api',

SOCKET_URL: __DEV__
  ? 'http://10.44.239.239:5000'
  : 'https://your-backend-api.com',
```

**Replace with your Railway URL:**
```javascript
BASE_URL: 'https://hashview-production-xxxx.up.railway.app/api',

SOCKET_URL: 'https://hashview-production-xxxx.up.railway.app',
```

**Save the file!**

---

## **STEP 3: Rebuild APK with Cloud Backend (15 minutes)**

Run in PowerShell:

```powershell
cd "D:\Office Work\HashView\frontend\android"
.\gradlew clean
.\gradlew assembleRelease
```

Wait 10-15 minutes → APK rebuilt!

---

## **STEP 4: Share Your APK**

### **Upload to Google Drive:**
1. Open Google Drive
2. Upload `app-release.apk`
3. Right-click → Share → "Anyone with the link"
4. Copy link → Send to testers!

### **Installation for Testers:**
```
1. Download APK on Android phone
2. Settings → Security → Enable "Install unknown apps" for Chrome
3. Tap APK file → Install
4. Open HashView!
```

---

## **🧪 TEST BEFORE SHARING:**

1. Install APK on YOUR phone
2. Open app
3. Register new account (should work without backend running on PC!)
4. Login
5. Browse businesses
6. If all works → Share with others!

---

## **💰 COSTS:**

```
Railway:     FREE (500 hours/month)
MongoDB:     FREE (512 MB storage)
Gmail SMTP:  FREE
Cloudinary:  FREE (25 credits/month)
───────────────────────────────────
TOTAL:       $0/month
```

Perfect for testing! Upgrade later if needed.

---

## **⚡ QUICK SUMMARY:**

| Step | Action | Time | Status |
|------|--------|------|--------|
| 1 | Build APK (first time) | 45 min | ✅ DONE |
| 2 | Deploy backend to Railway | 5 min | ⏳ DO THIS |
| 3 | Set up MongoDB Atlas | 5 min | ⏳ DO THIS |
| 4 | Update API URL in app | 1 min | ⏳ THEN THIS |
| 5 | Rebuild APK | 15 min | ⏳ THEN THIS |
| 6 | Share APK with testers | 2 min | ⏳ FINAL STEP |

**Total Time:** ~30 minutes (after initial build)

---

## **🎯 NEXT ACTIONS:**

1. **Deploy Backend** → Follow STEP 1 above
2. **Update API URL** → Follow STEP 2 above
3. **Rebuild APK** → Follow STEP 3 above
4. **Share & Test!** → Follow STEP 4 above

---

## **📚 DETAILED GUIDES:**

- `BACKEND_DEPLOYMENT_GUIDE.md` - Detailed backend deployment
- `COMPLETE_DEPLOYMENT_GUIDE.md` - This file
- Your APK: `frontend/android/app/build/outputs/apk/release/app-release.apk`

---

**Start with deploying the backend, then rebuild the APK!** 🚀

