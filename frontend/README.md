# HashView Mobile App

Complete React Native mobile application for HashView - Review, Reward, Repeat platform built with Expo Dev Client.

## 📱 Features

### User Features
- ✅ JWT-based authentication (Email, Phone/OTP, Social)
- ✅ Nearby business discovery with geolocation
- ✅ Search and filter businesses
- ✅ **Geofenced reviews** - Only post reviews within business radius
- ✅ Earn discount coupons (valid 2 hours) after each review
- ✅ QR code coupon redemption
- ✅ Review history and reward tracking
- ✅ Push notifications

### Business Features
- ✅ 4-step business registration
- ✅ Document upload (ID Proof, Certificates)
- ✅ Business dashboard with analytics
- ✅ QR code generation
- ✅ Review management
- ✅ KYC verification workflow

### Admin Features
- ✅ Admin dashboard with analytics
- ✅ User management
- ✅ Business KYC approval/rejection
- ✅ Review moderation
- ✅ Push notification center
- ✅ Platform analytics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- iOS Simulator (Mac) or Android Studio with emulator

### Installation

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Configure API**
Edit `src/config/api.config.js` and update `BASE_URL` with your backend URL:
```javascript
BASE_URL: 'https://your-backend-api.com/api'
```

3. **Start Expo Dev Client**
```bash
npx expo start --dev-client
```

4. **Run on Device/Emulator**
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## 📦 Build for Production

### Android APK (16KB Page Size Compliant)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build APK
eas build --platform android --profile production
```

The build is optimized for:
- ✅ Android 15+ (16 KB memory page size)
- ✅ Minimal APK size
- ✅ Hermes engine for faster performance
- ✅ Tree-shaking and code splitting

### iOS Build

```bash
eas build --platform ios --profile production
```

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── config/          # API configuration
│   ├── navigation/      # React Navigation setup
│   ├── screens/         # All app screens
│   │   ├── auth/        # Authentication screens
│   │   ├── user/        # Customer screens
│   │   ├── business/    # Business owner screens
│   │   └── admin/       # Admin screens
│   ├── store/           # Redux Toolkit store
│   │   └── slices/      # Redux slices
│   └── services/        # API services
├── assets/              # Images, fonts, icons
├── App.js               # Root component
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── README.md            # This file
```

## 📱 Screens

### Authentication
- Splash Screen
- Role Selection
- Login (Email/Password)
- Sign Up
- Forgot Password
- Reset Password
- Login with Phone (OTP)

### User Module
- Home (Nearby Businesses)
- Search
- Business Details
- Add Review (with Geofencing)
- My Coupons (QR Code)
- History
- Profile

### Business Module
- Business Dashboard
- Business Registration (4-step)
- QR Code Generation
- Review Management

### Admin Module
- Admin Dashboard
- User Management
- Business Management (KYC Approval)
- Review Management
- Analytics

## 🔧 Technologies

- **Framework**: React Native with Expo SDK 51
- **Navigation**: React Navigation 6
- **State Management**: Redux Toolkit
- **Styling**: NativeWind (Tailwind CSS)
- **API Client**: Axios
- **Location**: Expo Location
- **Notifications**: Expo Notifications
- **QR Codes**: React Native QR Code SVG
- **Maps**: React Native Maps
- **Real-time**: Socket.io Client

## 🎨 Styling

This app uses **NativeWind** (Tailwind CSS for React Native):

```jsx
<View className="flex-1 bg-gray-50">
  <Text className="text-xl font-bold text-gray-900">Hello</Text>
</View>
```

## 🔐 Authentication Flow

1. User selects role (Customer/Business)
2. Login or Sign Up
3. JWT token stored in AsyncStorage
4. Token automatically added to API requests
5. Token validated on app launch

## 📍 Geofencing

Reviews can only be posted when user is within business radius:
- Default radius: 50 meters
- Uses Haversine formula for distance calculation
- Location verification before review submission
- Backend double-verification

## 🎁 Coupon System

- Automatic coupon generation after review
- 2-hour validity period
- QR code for redemption
- Real-time status updates

## 🔔 Push Notifications

Setup push notifications:

1. Get Expo push token
2. Store token via `/api/auth/push-token`
3. Receive notifications for:
   - New coupons
   - Business approvals
   - Review responses

## 📊 Performance Optimization

### APK Size Reduction
- Hermes engine enabled
- ProGuard/R8 optimization
- Image compression
- Tree-shaking
- No unused dependencies

### Runtime Performance
- Redux Toolkit for efficient state management
- React.memo for component optimization
- FlatList virtualization
- Image lazy loading

## 🐛 Debugging

```bash
# Start with dev client
npx expo start --dev-client

# Clear cache
npx expo start --dev-client --clear

# Check for issues
npx expo-doctor
```

## 📦 Building Custom Dev Client

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## 🌐 Environment Variables

Create `.env` file (not tracked in git):

```env
API_BASE_URL=https://your-api.com/api
SOCKET_URL=https://your-api.com
GOOGLE_MAPS_API_KEY=your_key_here
```

## 🚢 Deployment

### Google Play Store
1. Build release APK/AAB with EAS
2. Generate signing key
3. Upload to Google Play Console
4. Fill store listing
5. Submit for review

### Apple App Store
1. Build with EAS
2. Upload to App Store Connect
3. Fill app information
4. Submit for review

## 📝 Scripts

```bash
# Development
npm start              # Start Expo Dev Server
npm run android        # Run on Android
npm run ios            # Run on iOS

# Building
npm run build:android  # Build Android APK
npm run build:ios      # Build iOS app
```

## 🔒 Security

- JWT tokens in secure storage
- HTTPS-only API communication
- No sensitive data in logs
- Input validation
- Rate limiting on backend

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

MIT License

## 🆘 Troubleshooting

### Android Build Issues
```bash
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
```

### iOS Build Issues
```bash
cd ios
pod install
cd ..
npx expo prebuild --clean
```

### Metro Bundler Issues
```bash
npx expo start --clear
```

## 📞 Support

For issues and questions:
- GitHub Issues
- Email: support@hashview.com

---

Built with ❤️ using React Native & Expo

