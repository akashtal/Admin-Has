# HashView NEW App - Build Credentials & Details (com.hashview.apps)

> [!CAUTION]
> **This file contains sensitive information. Store it securely and do not commit it to version control.**
> **BACKUP THIS FOLDER TO CLOUD STORAGE IMMEDIATELY!**

## App Details

- **App Name:** HashView
- **Package Name:** `com.hashview.apps` (NEW - Different from old app)
- **Version:** 1.0.0
- **Version Code:** 1
- **Created Date:** November 29, 2025

## IMPORTANT NOTE

This is a **NEW APP** with a different package name than the original. The original app (`com.hashview.app`) cannot be updated because the keystore was lost.

---

## Keystore Information

### Keystore File Locations

**PRIMARY (In Project):**
```
d:\Office Work\HashView\frontend\android\app\hashview-apps-release.keystore
```

**BACKUP (CRITICAL - KEEP SAFE):**
```
d:\Office Work\HashView\KEYSTORE_BACKUP_APPS\hashview-apps-release.keystore
```

### Keystore Credentials

| Property | Value |
|----------|-------|
| **Keystore Password** | `HashViewApps@2025!Secure` |
| **Key Alias** | `hashview-apps-key` |
| **Key Password** | `HashViewApps@2025!Secure` |
| **Keystore Type** | PKCS12 |

### Certificate Fingerprints

| Algorithm | Fingerprint |
|-----------|------------|
| **SHA-1** | `C8:C8:59:60:1D:99:E9:9D:01:CF:BE:33:CE:1A:5C:2F:BC:84:A1:5D` |
| **SHA-256** | `D4:9E:4C:FA:ED:C4:D3:21:73:BF:74:98:CE:A8:99:66:A9:5C:22:13:37:9E:3E:63:16:B0:AA:20:2D:CA:A3:7B` |

### Certificate Details
- **Owner:** CN=HashView, OU=Mobile Apps, O=HashView, L=London, ST=England, C=GB
- **Validity:** November 29, 2025 - April 16, 2053 (27.4 years)
- **Key Size:** 2048-bit RSA

---

## Build Files

### AAB File (for Play Store Upload)
```
d:\Office Work\HashView\frontend\android\app\build\outputs\bundle\release\app-release.aab
```

---

## Configuration Files

### credentials.json
Location: `d:\Office Work\HashView\frontend\credentials.json`
```json
{
    "android": {
        "keystore": {
            "keystorePath": "android/app/hashview-apps-release.keystore",
            "keystorePassword": "HashViewApps@2025!Secure",
            "keyAlias": "hashview-apps-key",
            "keyPassword": "HashViewApps@2025!Secure"
        }
    }
}
```

---

## Rebuilding AAB (Future Updates)

To rebuild the AAB for future updates:

1. **Update version in app.config.js:**
   ```javascript
   android: {
     package: "com.hashview.apps",
     versionCode: 2,  // Increment this for each release
   }
   ```
   And update the version string:
   ```javascript
   version: "1.0.1",  // Increment as needed
   ```

2. **Build using EAS (Cloud):**
   ```bash
   npx eas-cli build --platform android --profile production
   ```

---

## CRITICAL BACKUP INSTRUCTIONS

### IMMEDIATE ACTION REQUIRED:

1. **Copy the entire folder to cloud storage:**
   - Upload `d:\Office Work\HashView\KEYSTORE_BACKUP_APPS\` to Google Drive, Dropbox, or OneDrive
   
2. **Additional Backups:**
   - Email the keystore file to yourself
   - Copy to an external hard drive
   - Copy to a USB drive

3. **Verify Backups:**
   - After copying, verify the file opens and the password works

### What to Backup:
- ✅ `hashview-apps-release.keystore` file
- ✅ This credentials document
- ✅ The passwords (write them down in a safe place)

---

## Quick Reference Commands

### View certificate information:
```bash
keytool -list -v -keystore android/app/hashview-apps-release.keystore -storepass "HashViewApps@2025!Secure"
```

### Extract upload certificate (for Play Console):
```bash
keytool -export -rfc -keystore android/app/hashview-apps-release.keystore -alias hashview-apps-key -file upload-cert-apps.pem -storepass "HashViewApps@2025!Secure"
```

### Build release AAB using EAS:
```bash
npx eas-cli build --platform android --profile production
```

---

## WARNINGS

⚠️ **NEVER LOSE THIS KEYSTORE!** If you lose it:
- You CANNOT update this app on Play Store
- You'll need to publish another new app with a different package name
- All users will need to uninstall and reinstall

⚠️ **NEVER COMMIT TO GIT:**
- The keystore file is in `.gitignore` 
- The credentials.json file is in `.gitignore`
- This document should NOT be committed

⚠️ **KEEP PASSWORDS SECURE:**
- Don't share them publicly
- Store in a password manager
- Write down in a safe physical location
