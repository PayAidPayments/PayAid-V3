# Quick Start - Testing on iPhone

## 📱 Prerequisites

1. **Mac with Xcode** (required for iOS development)
2. **iPhone** (iOS 13.0 or later)
3. **Apple ID** (free - for development)
4. **Flutter SDK** installed

## 🚀 Step-by-Step Setup

### Step 1: Install Flutter (if not already installed)

```bash
# Check if Flutter is installed
flutter --version

# If not installed, download from:
# https://docs.flutter.dev/get-started/install/macos
```

### Step 2: Install Xcode

1. Open **App Store** on your Mac
2. Search for "Xcode"
3. Install Xcode (this may take 30-60 minutes)
4. After installation, open Xcode and accept the license agreement
5. Install additional components when prompted

### Step 3: Install CocoaPods (iOS dependency manager)

```bash
sudo gem install cocoapods
```

### Step 4: Configure Your iPhone

1. **Enable Developer Mode on iPhone:**
   - Go to Settings → Privacy & Security → Developer Mode
   - Toggle ON (if available on iOS 16+)
   - Restart your iPhone

2. **Trust Your Computer:**
   - Connect iPhone to Mac via USB
   - On iPhone, tap "Trust This Computer" when prompted
   - Enter your iPhone passcode

### Step 5: Set Up Code Signing

1. **Open Xcode:**
   ```bash
   cd mobile_flutter
   open ios/Runner.xcworkspace
   ```

2. **In Xcode:**
   - Select `Runner` in the left sidebar
   - Go to "Signing & Capabilities" tab
   - Check "Automatically manage signing"
   - Select your **Team** (your Apple ID)
   - Xcode will automatically create a provisioning profile

3. **Note:** If you see errors, you may need to:
   - Add your Apple ID in Xcode → Preferences → Accounts
   - Create a free Apple Developer account (no $99 needed for development)

### Step 6: Update API Base URL (if needed)

Edit `mobile_flutter/lib/core/network/api_client.dart`:

```dart
baseUrl: 'http://YOUR_LOCAL_IP:3000', // For local testing
// OR
baseUrl: 'https://api.payaid.com', // For production
```

**To find your local IP:**
```bash
# On Mac
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Step 7: Install Dependencies

```bash
cd mobile_flutter
flutter pub get
cd ios
pod install
cd ..
```

### Step 8: Connect iPhone and Run

1. **Connect iPhone to Mac via USB**

2. **Check if iPhone is detected:**
   ```bash
   flutter devices
   ```
   You should see your iPhone listed.

3. **Run the app:**
   ```bash
   flutter run -d <device-id>
   ```
   
   Or simply:
   ```bash
   flutter run
   ```
   (Flutter will auto-select your iPhone if it's the only device)

4. **First time setup:**
   - On your iPhone, go to Settings → General → VPN & Device Management
   - Tap on your developer certificate
   - Tap "Trust [Your Name]"
   - Tap "Trust" in the popup

5. **The app should launch on your iPhone!** 🎉

## 🔧 Troubleshooting

### Issue: "No devices found"
- **Solution:** Make sure iPhone is unlocked and you tapped "Trust This Computer"
- Try unplugging and replugging the USB cable
- Check USB cable (use original Apple cable if possible)

### Issue: "Signing for Runner requires a development team"
- **Solution:** 
  1. Open `ios/Runner.xcworkspace` in Xcode
  2. Select Runner → Signing & Capabilities
  3. Select your Team from the dropdown
  4. If no team, add your Apple ID in Xcode → Preferences → Accounts

### Issue: "Could not find CocoaPods"
- **Solution:**
  ```bash
  sudo gem install cocoapods
  cd ios
  pod install
  ```

### Issue: "Failed to launch app"
- **Solution:**
  1. On iPhone: Settings → General → VPN & Device Management
  2. Trust your developer certificate
  3. Try running again: `flutter run`

### Issue: "Network error" or "API not connecting"
- **Solution:**
  1. Make sure your backend is running
  2. Update `api_client.dart` with correct base URL
  3. For local testing, use your Mac's IP address (not localhost)
  4. Make sure iPhone and Mac are on the same WiFi network

### Issue: "Build failed" or "Pod install failed"
- **Solution:**
  ```bash
  cd ios
  rm -rf Pods Podfile.lock
  pod install
  cd ..
  flutter clean
  flutter pub get
  flutter run
  ```

## 📱 Testing Features

Once the app is running on your iPhone, test:

- ✅ **Login/Logout** - Authentication flow
- ✅ **Dashboard** - Daily standup, forecast, pipeline
- ✅ **Contacts** - View and search contacts
- ✅ **Deals** - View deals, swipe to change stage
- ✅ **Tasks** - View and manage tasks
- ✅ **Offline Mode** - Turn off WiFi, app should still work
- ✅ **Pull to Refresh** - Swipe down on dashboard
- ✅ **Voice Commands** - Test voice input (if implemented)

## 🎯 Hot Reload

While the app is running:
- Press `r` in terminal to **hot reload** (fast refresh)
- Press `R` to **hot restart** (full restart)
- Press `q` to **quit**

## 📝 Next Steps

After testing:
1. Fix any bugs you find
2. Test on different iPhone models if available
3. Prepare for TestFlight beta submission (see `BUILD_AND_SUBMIT.md`)

## 💡 Pro Tips

- **Wireless Debugging (iOS 15+):**
  - Connect iPhone once via USB
  - In Xcode: Window → Devices and Simulators
  - Check "Connect via network"
  - Now you can disconnect USB and debug wirelessly!

- **Fast Refresh:**
  - Keep the terminal open while developing
  - Save files in your editor
  - App auto-reloads on iPhone (if hot reload enabled)

- **Debug Console:**
  - Check terminal for logs
  - Use `print()` statements in Dart code
  - Logs appear in real-time

---

**Need Help?** Check Flutter docs: https://docs.flutter.dev/get-started/install/macos
