# 🌐 Backend Deployment Guide - Railway (Recommended)

## **🚀 DEPLOY YOUR BACKEND IN 10 MINUTES**

---

## **STEP 1: Prepare Your Backend**

### **1.1 Create .env.production (in backend folder)**

Create `backend/.env.production` with these variables:

```env
NODE_ENV=production
PORT=5000

# MongoDB (use MongoDB Atlas - free tier)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hashview?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
JWT_EXPIRE=30d

# Email Service (use Gmail SMTP for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=hashview@yourdomain.com

# Cloudinary (your existing credentials)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL (will update this later)
FRONTEND_URL=*

# Sentry (optional - for error tracking)
SENTRY_DSN=your-sentry-dsn-if-you-have-one
```

---

## **STEP 2: Set Up MongoDB Atlas (Free)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create new cluster (FREE tier)
4. Database Access → Add user (username & password)
5. Network Access → Add IP: `0.0.0.0/0` (allow all)
6. Connect → Get connection string
7. Copy the connection string to `.env.production` as `MONGODB_URI`

---

## **STEP 3: Set Up Gmail for Emails (Free)**

1. Use your Gmail account
2. Enable 2-Step Verification
3. Create App Password: Google Account → Security → App Passwords
4. Copy the 16-character password to `.env.production` as `SMTP_PASS`

---

## **STEP 4: Deploy to Railway**

### **4.1 Sign Up**
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub

### **4.2 Create New Project**
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select your HashView repository
5. Railway will detect your backend folder

### **4.3 Configure Environment Variables**
1. In Railway dashboard → Select your backend service
2. Go to "Variables" tab
3. Click "RAW Editor"
4. Paste all contents from `.env.production`
5. Click "Update Variables"

### **4.4 Deploy**
1. Railway auto-deploys when you push to GitHub
2. Or click "Deploy" in Railway dashboard
3. Wait 2-5 minutes for deployment
4. Get your backend URL (looks like: `https://hashview-backend-production.up.railway.app`)

---

## **STEP 5: Update Frontend API URL**

### **In `frontend/src/config/api.config.js`:**

Find this line:
```javascript
BASE_URL: 'http://localhost:5000'
```

Replace with your Railway URL:
```javascript
BASE_URL: 'https://hashview-backend-production.up.railway.app'
```

---

## **STEP 6: Rebuild APK with Production Backend**

```bash
cd frontend/android
.\gradlew clean
.\gradlew assembleRelease
```

New APK will be at: `frontend/android/app/build/outputs/apk/release/app-release.apk`

---

## **STEP 7: Test Everything**

1. Install new APK on your phone
2. Open the app
3. Test registration/login
4. Test all features
5. Verify data saves correctly

---

## **✅ ALTERNATIVE HOSTING OPTIONS:**

### **Render.com** (Also Free Tier)
- Similar to Railway
- Free tier includes database
- Easy setup

### **Heroku** (Paid)
- $7/month for basic dyno
- Very reliable
- Good documentation

### **DigitalOcean App Platform**
- $5/month
- Good performance
- Easy scaling

---

## **🔧 TROUBLESHOOTING:**

### **Can't connect to backend:**
- Check Railway logs for errors
- Verify environment variables are set
- Check MongoDB Atlas allows connections (IP whitelist)
- Test backend URL in browser: `https://your-url.railway.app/health`

### **Database connection failed:**
- Verify MongoDB connection string
- Check username/password
- Ensure IP whitelist includes 0.0.0.0/0

### **Emails not sending:**
- Check Gmail App Password is correct
- Verify SMTP settings
- Check Railway logs for email errors

---

## **📝 QUICK REFERENCE:**

```bash
# Rebuild APK after changing API URL
cd frontend/android
.\gradlew clean assembleRelease

# APK location
frontend/android/app/build/outputs/apk/release/app-release.apk

# Test backend health
curl https://your-backend-url.railway.app/health
```

---

**Your backend will be live 24/7 and accessible from any device!** 🚀

