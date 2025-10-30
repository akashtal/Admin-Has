# HashView Admin Dashboard

A modern, responsive web-based admin dashboard for managing the HashView platform.

## 🚀 Features

- **Dashboard Overview** - Real-time statistics and insights
- **User Management** - View, manage, and moderate users
- **Business Management** - Approve/reject business registrations and KYC
- **Reviews Moderation** - Monitor and moderate user reviews
- **Push Notifications** - Send notifications to users
- **Responsive Design** - Works on desktop and tablet devices

## 📋 Prerequisites

- Node.js 18+ installed
- HashView backend running on `http://localhost:5000`

## 🛠️ Installation

```bash
cd admin-dashboard
npm install
```

## 🚀 Running the Dashboard

### Development Mode

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

## 🔑 Login

Use your admin credentials from the backend:

- **Email**: Your admin email
- **Password**: Your admin password

> Note: Only users with `role: 'admin'` can access the dashboard.

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── api/              # API integration
│   │   ├── axios.js      # Axios configuration
│   │   └── adminApi.js   # Admin API endpoints
│   ├── components/       # Reusable components
│   │   └── Layout.jsx    # Dashboard layout
│   ├── pages/            # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── Businesses.jsx
│   │   ├── BusinessDetails.jsx
│   │   ├── Reviews.jsx
│   │   └── Notifications.jsx
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── package.json
├── vite.config.js        # Vite configuration
└── tailwind.config.js    # Tailwind CSS config
```

## 🎨 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Recharts** - Charts (for future analytics)
- **date-fns** - Date formatting

## 🔧 Configuration

### Backend URL

The dashboard is configured to proxy API requests to `http://localhost:5000`. 

To change the backend URL, update `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://your-backend-url:5000',
        changeOrigin: true
      }
    }
  }
});
```

## 📱 Features by Page

### Dashboard
- Total users, businesses, reviews stats
- Monthly growth indicators
- Recent users and businesses
- Review distribution

### Users
- View all registered users
- Search by name, email, phone
- Filter by status (active, suspended, banned)
- Suspend/activate users
- Delete users

### Businesses
- View all businesses
- Filter by status and KYC status
- Search businesses
- View detailed business information
- Approve/reject KYC verification
- View verification documents
- Delete businesses

### Reviews
- View all reviews
- Filter by status
- Approve or remove reviews
- View review images

### Notifications
- Send push notifications
- Send to all users or specific users
- Preview before sending

## 🔒 Security

- JWT token authentication
- Auto-logout on 401 responses
- Admin-only access
- Secure API communication

## 🌐 Deployment

### Option 1: Netlify

```bash
npm run build
# Upload 'dist' folder to Netlify
```

### Option 2: Vercel

```bash
npm run build
# Deploy 'dist' folder to Vercel
```

### Option 3: Traditional Server

```bash
npm run build
# Copy 'dist' folder to your web server
```

## 📝 Environment Variables

No environment variables needed! The dashboard uses proxy configuration.

## 🐛 Troubleshooting

### Cannot connect to backend

1. Ensure backend is running on `http://localhost:5000`
2. Check `vite.config.js` proxy configuration
3. Verify CORS is enabled on backend

### Login fails

1. Ensure you're using admin credentials
2. Check user role is `'admin'` in database
3. Verify JWT token is valid

### Build errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

Part of the HashView project.

## 👥 Support

For issues or questions, contact the development team.

