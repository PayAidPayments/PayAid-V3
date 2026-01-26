# Build and Submit Guide - PayAid CRM Mobile App

## 📱 Building for iOS (TestFlight Beta)

### Prerequisites
- Mac with Xcode 14.0+
- Apple Developer Account ($99/year)
- Flutter SDK 3.0+

### Step 1: Configure iOS App
```bash
cd mobile_flutter
flutter build ios --release
```

### Step 2: Open in Xcode
```bash
open ios/Runner.xcworkspace
```

### Step 3: Configure App Settings
1. Select `Runner` in project navigator
2. Go to `Signing & Capabilities`
3. Select your Team
4. Set Bundle Identifier: `com.payaid.crm`
5. Enable capabilities:
   - Push Notifications
   - Background Modes
   - Siri Shortcuts
   - WidgetKit Extension

### Step 4: Update Version
- Version: `1.0.0`
- Build: `1`

### Step 5: Archive
1. Product → Archive
2. Wait for archive to complete
3. Click "Distribute App"
4. Select "App Store Connect"
5. Upload

### Step 6: Submit to TestFlight
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to TestFlight tab
4. Add internal testers
5. Submit for Beta App Review

**Expected Timeline:** 12-24 hours for review

---

## 🤖 Building for Android (Google Play Beta)

### Prerequisites
- Android Studio
- Google Play Developer Account ($25 one-time)
- Flutter SDK 3.0+

### Step 1: Configure Android App
```bash
cd mobile_flutter
flutter build appbundle --release
```

### Step 2: Update Version
Edit `android/app/build.gradle`:
```gradle
versionCode 1
versionName "1.0.0"
```

### Step 3: Generate Signed Bundle
1. Open Android Studio
2. Build → Generate Signed Bundle / APK
3. Select "Android App Bundle"
4. Use your keystore (create if needed)
5. Build release bundle

### Step 4: Upload to Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app (if first time)
3. Go to Production → Create new release
4. Upload the `.aab` file
5. Fill in release notes
6. Submit for review

**Expected Timeline:** 12-48 hours for review

---

## 🧪 Testing Checklist

### iOS Testing
- [ ] Test on iPhone (iOS 15+)
- [ ] Test on iPad (if applicable)
- [ ] Test Siri Shortcuts
- [ ] Test WidgetKit widgets
- [ ] Test iCloud sync
- [ ] Test push notifications
- [ ] Test offline mode
- [ ] Test voice commands (Hindi + English)

### Android Testing
- [ ] Test on Android 8.0+ devices
- [ ] Test on different screen sizes
- [ ] Test push notifications
- [ ] Test offline mode
- [ ] Test voice commands (Hindi + English)
- [ ] Test on budget devices (Redmi, Realme)

### Common Testing
- [ ] Login/Logout flow
- [ ] Contact CRUD operations
- [ ] Deal pipeline management
- [ ] Task creation and completion
- [ ] Email/WhatsApp integration
- [ ] Quick capture features
- [ ] Performance (app startup <2 seconds)

---

## 📋 Pre-Submission Checklist

### iOS
- [ ] App icon (1024x1024)
- [ ] Screenshots (all required sizes)
- [ ] App preview video (optional but recommended)
- [ ] Privacy policy URL
- [ ] App description
- [ ] Keywords
- [ ] Support URL
- [ ] Marketing URL (optional)

### Android
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone, tablet if applicable)
- [ ] Privacy policy URL
- [ ] App description
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)

---

## 🚀 Submission Commands

### iOS (TestFlight)
```bash
# Build
flutter build ios --release

# Archive and upload (via Xcode)
# Or use fastlane (if configured)
fastlane ios beta
```

### Android (Play Store)
```bash
# Build App Bundle
flutter build appbundle --release

# Or build APK for testing
flutter build apk --release
```

---

## 📝 Release Notes Template

### Version 1.0.0 (Beta)
```
🎉 PayAid CRM Mobile App - Beta Release

Features:
✅ Complete CRM functionality (Contacts, Deals, Tasks)
✅ Offline mode - work without internet
✅ Voice commands in Hindi & English
✅ iOS: Siri Shortcuts, WidgetKit, iCloud sync
✅ Push notifications for important updates
✅ Quick capture (business cards, voice notes)
✅ Beautiful Material Design 3 UI

Known Issues:
- Some features may have minor bugs
- Performance optimization in progress

We'd love your feedback! Report issues at support@payaid.com
```

---

## 🔄 Update Process

### For Future Updates
1. Increment version number
2. Update CHANGELOG.md
3. Build and test
4. Submit to TestFlight/Play Store
5. Wait for approval
6. Release to beta testers
7. Monitor crash reports and feedback

---

## 📞 Support

- **Email:** support@payaid.com
- **Documentation:** https://docs.payaid.com
- **Status Page:** https://status.payaid.com
