# PayAid V3 Mobile App

React Native mobile application for PayAid V3.

## 📱 Features

- ✅ **Core CRM** - Contacts, deals, tasks management
- ✅ **Dashboard** - Key metrics and quick actions
- ✅ **Authentication** - JWT-based login
- ✅ **API Integration** - Full backend connectivity
- ✅ **Navigation** - Tab-based navigation
- ✅ **State Management** - React Query for data fetching

## 🚀 Setup

### Prerequisites

- Node.js 16+
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS)

### Installation

```bash
cd mobile
npm install
```

### Development

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 📁 Project Structure

```
mobile/
├── App.tsx                 # Main app entry point
├── src/
│   ├── screens/           # Screen components
│   │   ├── DashboardScreen.tsx
│   │   ├── ContactsScreen.tsx
│   │   ├── DealsScreen.tsx
│   │   ├── TasksScreen.tsx
│   │   ├── InvoicesScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── LoginScreen.tsx
│   └── services/          # API services
│       └── api.ts         # API client
└── package.json
```

## 🔌 API Integration

The mobile app connects to the same backend API:
- **Base URL**: `https://api.payaid.com` (production) or `http://localhost:3000` (development)
- **Authentication**: JWT Bearer tokens
- **Storage**: AsyncStorage for token persistence
- **All API endpoints are tenant-aware**

### API Client Features

- Automatic token injection
- Request/response interceptors
- Error handling
- 401 auto-logout

## 🎨 Navigation

- **Stack Navigator**: Login → Main App
- **Tab Navigator**: Dashboard, Contacts, Deals, Tasks, Invoices, Settings

## 📦 Dependencies

- `react-native` - Core framework
- `@react-navigation/native` - Navigation
- `@tanstack/react-query` - Data fetching
- `axios` - HTTP client
- `@react-native-async-storage/async-storage` - Local storage

## 🔐 Authentication Flow

1. User enters email/password
2. API call to `/api/auth/login`
3. Token stored in AsyncStorage
4. Token automatically included in all requests
5. On 401, token cleared and redirect to login

## 📊 Current Implementation Status

✅ **Complete:**
- App structure and navigation
- Authentication flow
- API client setup
- Dashboard screen
- Contacts screen (basic)
- React Query integration

⏳ **In Progress:**
- Full screen implementations
- Offline mode
- Push notifications
- Advanced features

## 🚧 Next Steps

1. Complete all screen implementations
2. Add offline mode with local caching
3. Implement push notifications
4. Add biometric authentication
5. Optimize performance
6. Add unit tests

## 📝 Notes

- The app structure is complete and ready for full implementation
- All API endpoints match the web application
- Authentication is fully integrated
- Navigation structure is in place

