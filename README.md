# HashView - Complete Full-Stack Mobile App

**HashView** is a complete, production-ready mobile application for iOS and Android that allows users to discover nearby businesses, write reviews, and earn rewards. Business owners can manage their presence, and admins can oversee the entire platform.

## 🎯 Project Overview

- **Frontend**: React Native (Expo Dev Client)
- **Backend**: Node.js + Express.js + MongoDB
- **Authentication**: JWT-based
- **Real-time**: Socket.io for chat
- **Geofencing**: Location-based review validation
- **Rewards**: Auto-generated discount coupons
- **Push Notifications**: Expo Notifications API
- **Android Support**: Android 15+ (16 KB page size compliant)

## 📱 Features

### 👤 User Features
- Discover nearby businesses with geolocation
- Search and filter businesses by category
- **Geofenced reviews** - Only post within business radius
- Earn discount coupons after each review
- QR code coupon redemption
- Review and reward history
- Push notifications

### 🏢 Business Features
- 4-step business registration
- Document upload (ID, certificates)
- KYC verification workflow
- Business dashboard with analytics
- QR code generation for customer reviews
- Review management
- Coupon distribution

### 👨‍💼 Admin Features
- Comprehensive admin dashboard
- User management (CRUD operations)
- Business KYC approval/rejection
- Review moderation
- Push notification center
- Platform analytics and logs
- System management

## 🏗️ Project Structure

```
HashView/
├── backend/                 # Node.js Express API
│   ├── controllers/         # Request handlers
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Auth, validation, error handling
│   ├── utils/              # Helper functions
│   ├── sockets/            # Socket.io chat
│   ├── server.js           # Entry point
│   ├── package.json        # Dependencies
│   └── README.md           # Backend documentation
│
└── frontend/               # React Native Expo
    ├── src/
    │   ├── config/         # API configuration
    │   ├── navigation/     # React Navigation
    │   ├── screens/        # All app screens
    │   ├── store/          # Redux Toolkit
    │   └── services/       # API client
    ├── App.js              # Root component
    ├── package.json        # Dependencies
    └── README.md           # Frontend documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Expo CLI
- Android Studio or Xcode
- SendGrid API key (for emails)

### Backend Setup

1. **Navigate to backend folder**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file**
```bash
cp .env.example .env
```

4. **Configure environment variables**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@hashview.com
```

5. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

Server will run at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend folder**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Update API configuration**
Edit `src/config/api.config.js`:
```javascript
BASE_URL: 'http://localhost:5000/api'  // For development
// or
BASE_URL: 'https://your-backend-url.com/api'  // For production
```

4. **Start Expo Dev Client**
```bash
npx expo start --dev-client
```

5. **Run on device/emulator**
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## 📦 Building for Production

### Backend Deployment

Deploy to Render, Railway, Heroku, or AWS:

```bash
# Example: Deploy to Render
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set environment variables
4. Deploy
```

### Frontend Build

#### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build
eas build --platform android --profile production
```

**Features**:
- ✅ Android 15+ compatible (16 KB page size)
- ✅ Optimized APK size
- ✅ Hermes engine enabled
- ✅ ProGuard optimization

#### iOS Build

```bash
eas build --platform ios --profile production
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/login-phone` - Phone login
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Business
- `GET /api/business/nearby` - Get nearby businesses
- `GET /api/business/search` - Search businesses
- `POST /api/business/register` - Register business
- `GET /api/business/:id/dashboard` - Business dashboard

### Reviews
- `POST /api/reviews` - Create review (with geofencing)
- `GET /api/reviews/business/:id` - Get business reviews

### Coupons
- `GET /api/coupons` - Get user coupons
- `POST /api/coupons/verify` - Verify coupon
- `POST /api/coupons/:id/redeem` - Redeem coupon

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/businesses` - Get all businesses
- `PUT /api/admin/businesses/:id/kyc` - Approve/reject KYC

[Full API documentation in backend/README.md]

## 🗄️ Database Schema

### User
- name, email, phone, passwordHash
- role (customer, business, admin)
- location (geospatial)
- status, pushToken

### Business
- name, owner, email, phone
- category, description
- location (geospatial), radius
- documents (ID proof, certificates)
- kycStatus, rating

### Review
- user, business, rating, comment
- geolocation (verified)
- images, verified status
- couponAwarded

### Coupon
- business, user, code
- rewardType, rewardValue
- validFrom, validUntil (2 hours)
- status (active, redeemed, expired)

## 🔐 Security Features

- JWT authentication with expiry
- Password hashing with bcrypt
- Input validation (Joi)
- Rate limiting
- CORS configuration
- Helmet security headers
- Secure AsyncStorage
- HTTPS-only API communication

## 📍 Geofencing Implementation

1. User requests location permission
2. App gets current GPS coordinates
3. Calculates distance to business using Haversine formula
4. Validates user is within business radius (default 50m)
5. Backend double-verifies location
6. Review posted only if within geofence

## 🎁 Coupon Reward System

1. User posts valid review within geofence
2. Backend automatically generates unique coupon code
3. Coupon valid for 2 hours
4. User receives push notification
5. QR code generated for easy redemption
6. Business scans QR to redeem

## 🔔 Push Notifications

- User registration confirmation
- Coupon earned notification
- Business approval/rejection
- Review responses
- System announcements

## 🎨 UI/UX Features

- Modern, clean design
- Intuitive navigation
- Loading states
- Error handling
- Pull-to-refresh
- Empty states
- Success/error messages
- Responsive layouts

## 📊 Performance Optimization

### Backend
- MongoDB indexing for fast queries
- Geospatial indexes for location queries
- Compression middleware
- Request logging with Winston
- Error handling

### Frontend
- Redux Toolkit for state management
- React.memo optimization
- FlatList virtualization
- Image lazy loading
- Code splitting
- Tree-shaking
- Hermes engine

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error**:
```bash
# Check MongoDB URI in .env
# Ensure IP whitelist in MongoDB Atlas
```

**Port Already in Use**:
```bash
# Change PORT in .env file
PORT=5001
```

### Frontend Issues

**Metro Bundler Error**:
```bash
npx expo start --clear
```

**Android Build Error**:
```bash
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
```

**iOS Build Error**:
```bash
cd ios
pod install
cd ..
npx expo prebuild --clean
```

## 📱 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
- Test on iOS Simulator
- Test on Android Emulator
- Test on physical devices
- Test all user flows
- Test geofencing
- Test push notifications

## 🚀 Deployment Checklist

### Backend
- [ ] MongoDB Atlas configured
- [ ] Environment variables set
- [ ] SendGrid API key added
- [ ] Server deployed (Render/Railway/Heroku)
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled

### Frontend
- [ ] API_BASE_URL updated
- [ ] Google Maps API key added
- [ ] Push notification configured
- [ ] Icons and splash screen created
- [ ] App permissions configured
- [ ] Build tested on devices
- [ ] APK optimized for size
- [ ] Android 15+ compatibility verified

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

For issues, questions, or contributions:
- Open GitHub Issue
- Email: support@hashview.com

## 🙏 Acknowledgments

- Expo team for amazing tools
- MongoDB Atlas for database
- SendGrid for email service
- React Native community

---

**HashView** - Review. Reward. Repeat. 🎉

Built with ❤️ using React Native, Node.js, and MongoDB

