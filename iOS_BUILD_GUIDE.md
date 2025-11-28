# iOS Build Guide - Step by Step

## Prerequisites

Before you begin, ensure you have:

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
   - You need this to distribute apps on the App Store

2. **Expo Account**
   - Create a free account at: https://expo.dev/signup

3. **EAS CLI installed** (we'll verify this below)

---

## Step 1: Login to Expo

Open your terminal in the frontend directory and run:

```bash
cd "d:\Office Work\HashView\frontend"
npx eas login
```

Enter your Expo account credentials when prompted.

---

## Step 2: Verify Project Configuration

Check that your project is properly configured by running:

```bash
npx expo doctor
```

This will check for any dependency or configuration issues.

---

## Step 3: Clean Up EAS Configuration (Optional but Recommended)

The current [eas.json](file:///d:/Office%20Work/HashView/frontend/eas.json) has placeholder Apple credentials in the submit section. Let's update it to avoid confusion:

**Edit eas.json** - Remove or update the `submit` section (lines 48-56):

```diff
-  "submit": {
-    "production": {
-      "ios": {
-        "appleId": "your-apple-id@example.com",
-        "ascAppId": "your-app-store-connect-app-id",
-        "appleTeamId": "your-apple-team-id"
-      }
-    }
-  }
```

You can add real credentials later when you're ready to submit to the App Store.

---

## Step 4: Start the iOS Build

Run the following command to start building your iOS app:

```bash
npx eas build --platform ios --profile production
```

> [!IMPORTANT]
> This build happens in the cloud on Expo's servers, so you can build iOS apps even on Windows!

---

## Step 5: Certificate & Provisioning Profile Setup

During your first build, EAS will ask you about certificates and provisioning profiles:

### Option 1: Let EAS Handle Everything (Recommended for First Time)

When prompted with:
```
? Would you like to create a new Apple Distribution Certificate? (Y/n)
```
**Answer: Y (Yes)**

Then:
```
? Would you like to create a new Apple Provisioning Profile? (Y/n)
```
**Answer: Y (Yes)**

EAS will ask for your **Apple ID email** and **password**. This is secure and handled by Expo's servers.

### Option 2: Use Existing Certificates (Advanced)

If you already have certificates, you can upload them manually.

---

## Step 6: Monitor Build Progress

After setup, you'll see:

```
✔ Build started, it may take a few minutes to complete.

View build details at:
https://expo.dev/accounts/[your-account]/projects/hashview/builds/[build-id]
```

- Click the URL to watch the build progress in your browser
- The build typically takes **10-20 minutes**
- You'll receive an email when it's complete

---

## Step 7: Download Your IPA File

Once the build succeeds:

1. Go to the build URL provided
2. Click **Download** to get your `.ipa` file
3. The IPA can be uploaded to App Store Connect

---

## Step 8: Upload to App Store Connect

### Method 1: Using EAS Submit (Recommended)

First, update the `submit` section in [eas.json](file:///d:/Office%20Work/HashView/frontend/eas.json) with your real Apple credentials:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-real-apple-id@example.com",
      "ascAppId": "your-app-store-connect-app-id",
      "appleTeamId": "your-apple-team-id"
    }
  }
}
```

Then run:

```bash
npx eas submit --platform ios --profile production
```

### Method 2: Manual Upload Using Transporter

1. Download **Transporter** app from the Mac App Store (requires macOS)
2. Open Transporter and sign in with your Apple ID
3. Drag and drop your `.ipa` file
4. Click **Deliver**

> [!NOTE]
> If you don't have a Mac, use Method 1 (EAS Submit) which works from any platform.

---

## Step 9: Create App Store Listing

1. Go to **App Store Connect**: https://appstoreconnect.apple.com/
2. Click **My Apps** → **+ (Plus Icon)** → **New App**
3. Fill in the details:
   - **Platform**: iOS
   - **Name**: HashView
   - **Primary Language**: English
   - **Bundle ID**: `com.hashview.app` (should match your app.config.js)
   - **SKU**: `hashview-app` (your choice, unique identifier)
   - **User Access**: Full Access

4. Click **Create**

---

## Step 10: Complete App Store Metadata

Before you can submit for review, you need to provide:

- **App Description**
- **Keywords**
- **Screenshots** (required sizes for different iPhone models)
- **Privacy Policy URL**
- **App Category**
- **Age Rating**

---

## Step 11: Submit for Review

1. In App Store Connect, select your app
2. Go to **App Store** tab
3. Ensure all required fields are filled
4. Click **Add for Review**
5. Select your build from Step 7
6. Answer the Export Compliance questions
7. Click **Submit to App Review**

---

## Common Issues & Troubleshooting

### Build Failed - Certificate Error
**Solution**: Run with `--clear-credentials` flag:
```bash
npx eas build --platform ios --profile production --clear-credentials
```

### "Bundle identifier is already in use"
**Solution**: The bundle ID `com.hashview.app` is already registered. You'll need to:
- Use a different bundle ID in [app.config.js](file:///d:/Office%20Work/HashView/frontend/app.config.js#L19), or
- Get access to the existing App Store Connect account that owns this bundle ID

### Build Succeeds but App Crashes on Launch
**Solution**: Check the build logs for errors. Common issues:
- Missing native dependencies
- Incorrect environment variables
- API endpoint configuration

---

## Quick Reference Commands

```bash
# Login to Expo
npx eas login

# Check project health
npx expo doctor

# Build for iOS (Production)
npx eas build --platform ios --profile production

# Build for iOS (Preview/Testing)
npx eas build --platform ios --profile preview

# Submit to App Store
npx eas submit --platform ios --profile production

# View build status
npx eas build:list
```

---

## Next Steps After First Build

1. **Test the IPA**: Use TestFlight for internal testing before public release
2. **Update Version**: For subsequent builds, increment `ios.buildNumber` in [app.config.js](file:///d:/Office%20Work/HashView/frontend/app.config.js#L29)
3. **Add Screenshots**: Create compelling App Store screenshots
4. **Enable Push Notifications**: Configure APNs if you're using notifications

---

## Resources

- **EAS Build Documentation**: https://docs.expo.dev/build/introduction/
- **App Store Connect Guide**: https://developer.apple.com/app-store-connect/
- **Expo Forums**: https://forums.expo.dev/
- **TestFlight**: https://developer.apple.com/testflight/
