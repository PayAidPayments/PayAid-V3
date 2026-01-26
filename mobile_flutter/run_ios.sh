#!/bin/bash

# Quick script to run Flutter app on iPhone
# Usage: ./run_ios.sh

echo "🚀 Starting PayAid CRM on iPhone..."
echo ""

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter is not installed. Please install Flutter first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "pubspec.yaml" ]; then
    echo "❌ Please run this script from the mobile_flutter directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
flutter pub get

# Install iOS pods
echo "📦 Installing iOS pods..."
cd ios
pod install
cd ..

# Check for connected devices
echo ""
echo "📱 Checking for connected devices..."
flutter devices

echo ""
echo "🎯 Starting app on iPhone..."
echo "   (Make sure your iPhone is connected and unlocked)"
echo ""

# Run the app
flutter run -d ios
