# PayAid CRM - Flutter Mobile App

Flutter mobile application for PayAid CRM, supporting both iOS and Android from a single codebase.

## 🚀 Features

- ✅ **Core CRM** - Contacts, deals, tasks management
- ✅ **Offline-First** - Works without internet, syncs when online
- ✅ **Authentication** - JWT + OAuth (Google, Apple)
- ✅ **iOS-Specific** - Siri Shortcuts, WidgetKit, iCloud sync
- ✅ **Voice Interface** - Hindi + English voice commands
- ✅ **Push Notifications** - Real-time alerts
- ✅ **Quick Capture** - Business card OCR, voice notes

## 📱 Platform Support

- **iOS**: 13.0+
- **Android**: API 21+ (Android 5.0+)

## 🛠️ Setup

### Prerequisites

- Flutter SDK 3.0+
- Dart 3.0+
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

```bash
cd mobile_flutter
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Development

```bash
# Run on iOS
flutter run -d ios

# Run on Android
flutter run -d android

# Build iOS release
flutter build ios --release

# Build Android release
flutter build apk --release
```

## 📁 Project Structure

```
lib/
├── main.dart                    # App entry point
├── core/
│   ├── auth/                   # Authentication
│   ├── di/                      # Dependency injection
│   ├── network/                 # API client
│   ├── router/                  # Navigation
│   ├── storage/                 # Local storage (Hive)
│   └── theme/                   # App theme
├── data/
│   ├── models/                  # Data models
│   └── repositories/            # Data repositories
└── presentation/
    ├── screens/                 # UI screens
    └── widgets/                 # Reusable widgets
```

## 🔌 API Integration

The mobile app connects to the same backend API:
- **Base URL**: `https://api.payaid.com` (production)
- **Authentication**: JWT Bearer tokens
- **Storage**: Hive for offline data
- **All API endpoints are tenant-aware**

## 📦 Key Dependencies

- `flutter_riverpod` - State management
- `go_router` - Navigation
- `dio` - HTTP client
- `hive` - Local database
- `firebase_messaging` - Push notifications
- `speech_to_text` - Voice commands
- `image_picker` - Camera/photo capture

## 🎯 iOS-Specific Features

- **Siri Shortcuts**: "Hey Siri, show my top 3 deals"
- **WidgetKit**: Home screen widgets
- **iCloud Sync**: Automatic contact backup
- **Handoff**: Continue on iPad/Mac

## 📱 Android-Specific Features

- **Material Design 3**: Modern UI
- **Offline Mode**: Full functionality without internet
- **Background Sync**: Automatic when online

## 🚀 Deployment

### iOS (App Store)

1. Build iOS release: `flutter build ios --release`
2. Open Xcode: `open ios/Runner.xcworkspace`
3. Archive and upload to App Store Connect
4. Submit for review

### Android (Google Play)

1. Build Android release: `flutter build appbundle --release`
2. Upload to Google Play Console
3. Submit for review

## 📝 License

Proprietary - PayAid V3
