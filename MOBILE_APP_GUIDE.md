# 📱 UPSC PrepX AI - Mobile App Complete Guide

## 🎯 Overview

**Production-ready React Native Android app** for UPSC CSE preparation with:
- 🎬 AI Video Lectures (Manim + Remotion)
- 📝 Smart Notes Generation
- ❓ Practice Quizzes
- 📊 Progress Tracking
- 💾 Offline Mode
- 🔐 Subscription Management

**Backend:** VPS at `89.117.60.144`
**API:** `http://89.117.60.144:3000/api`

---

## 📁 Project Structure

```
mobile-app/
├── src/
│   ├── screens/          # App screens
│   ├── components/       # Reusable components
│   ├── services/         # API services
│   ├── store/           # Zustand state management
│   ├── navigation/       # Navigation config
│   ├── utils/           # Helper functions
│   └── assets/          # Images, fonts, icons
├── android/             # Android native code
├── ios/                 # iOS native code (optional)
├── App.js              # Main entry point
├── package.json        # Dependencies
└── .env.production     # Production config
```

---

## 🚀 PART 1: PREREQUISITES

### Install Node.js & npm

```bash
# Check Node.js version (requires >= 18)
node --version

# Install if needed (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install Java Development Kit (JDK)

```bash
# Install JDK 17 (required for React Native)
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk

# Verify installation
java -version
```

### Install Android Studio

```bash
# Download Android Studio
wget https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2023.2.1.12/android-studio-2023.2.1.12-linux.tar.gz

# Extract
tar -xzf android-studio-*.tar.gz -C /opt/

# Launch Android Studio
/opt/android-studio/bin/studio.sh
```

### Configure Android SDK

```bash
# Add Android SDK to PATH (add to ~/.bashrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools

# Install required SDK components
sdkmanager "platform-tools"
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
```

### Install Watchman (Optional but recommended)

```bash
sudo apt-get install -y watchman
```

---

## 🚀 PART 2: INSTALL DEPENDENCIES

### Navigate to Mobile App Directory

```bash
cd /a0/usr/projects/upsc_ai/mobile-app
```

### Install npm Dependencies

```bash
# Install all dependencies
npm install

# Or use yarn
yarn install
```

### Install iOS Dependencies (if building for iOS)

```bash
cd ios
pod install
cd ..
```

---

## 🚀 PART 3: CONFIGURE ENVIRONMENT

### Copy Production Environment

```bash
# Copy production env to .env
cp .env.production .env

# Verify configuration
cat .env
```

### Key Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `API_BASE_URL` | `http://89.117.60.144:3000/api` | Backend API endpoint |
| `MANIM_SERVICE_URL` | `http://89.117.60.144:8085` | Manim animation service |
| `REMOTION_SERVICE_URL` | `http://89.117.60.144:3002` | Remotion video service |
| `ENVIRONMENT` | `production` | App environment |

---

## 🚀 PART 4: DEVELOPMENT MODE

### Start Metro Bundler

```bash
# Start React Native Metro bundler
npm start

# Or
npx react-native start
```

### Run on Android Device/Emulator

```bash
# Run on connected device or emulator
npm run android

# Or
npx react-native run-android
```

### Run on Specific Device

```bash
# List available devices
adb devices

# Run on specific device
npx react-native run-android --deviceId <device_id>
```

### Debug App

```bash
# Open Chrome debugger
# Press Cmd+M (Mac) or Ctrl+M (Windows/Linux) in emulator
# Select "Debug"

# Open React DevTools
npx react-devtools
```

---

## 🚀 PART 5: BUILD PRODUCTION APK

### Generate Debug APK

```bash
cd android
./gradlew assembleDebug
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

### Generate Release APK (Signed)

#### Step 1: Generate Keystore

```bash
keytool -genkey -v -keystore upsc-prepx.keystore \
  -alias upsc-prepx \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Store the keystore securely!** You'll need it for all future updates.

#### Step 2: Configure Gradle Properties

Create `android/gradle.properties`:

```properties
UPSCPREPX_RELEASE_STORE_FILE=upsc-prepx.keystore
UPSCPREPX_RELEASE_KEY_ALIAS=upsc-prepx
UPSCPREPX_RELEASE_STORE_PASSWORD=your_store_password
UPSCPREPX_RELEASE_KEY_PASSWORD=your_key_password
```

#### Step 3: Update build.gradle

Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('UPSCPREPX_RELEASE_STORE_FILE')) {
                storeFile file(UPSCPREPX_RELEASE_STORE_FILE)
                storePassword UPSCPREPX_RELEASE_STORE_PASSWORD
                keyAlias UPSCPREPX_RELEASE_KEY_ALIAS
                keyPassword UPSCPREPX_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Step 4: Build Release APK

```bash
cd android
./gradlew assembleRelease
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

### Build Android App Bundle (for Google Play)

```bash
cd android
./gradlew bundleRelease
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🚀 PART 6: INSTALL & TEST

### Install APK on Device

```bash
# Via USB (enable USB debugging on device)
adb install android/app/build/outputs/apk/release/app-release.apk

# Install and replace existing
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### Test App Features

1. **Login/Register** - Test authentication flow
2. **Video Lectures** - Play AI-generated videos
3. **Notes** - Generate and view AI notes
4. **Quizzes** - Take practice quizzes
5. **Offline Mode** - Test downloaded content
6. **Subscription** - Verify access control

---

## 🚀 PART 7: DISTRIBUTE APP

### Option 1: Google Play Store

#### Requirements:
- Google Play Developer account ($25 one-time)
- App icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- Screenshots (phone + tablet)
- Privacy policy URL

#### Steps:

1. **Create Google Play Console Account**
   - Go to https://play.google.com/console
   - Pay $25 registration fee

2. **Create New App**
   - Click "Create App"
   - Enter app name: "UPSC PrepX AI"
   - Select language, app type, etc.

3. **Upload App Bundle**
   - Go to "Production" → "Create new release"
   - Upload `app-release.aab`
   - Fill in release notes

4. **Complete Store Listing**
   - App description
   - Graphics & screenshots
   - Content rating
   - Pricing & distribution

5. **Submit for Review**
   - Review typically takes 2-7 days

### Option 2: Direct APK Distribution

#### Upload to Website:

```bash
# Upload APK to your server
scp android/app/build/outputs/apk/release/app-release.apk \
  root@89.11760.144:/var/www/html/downloads/upsc-prepx-v1.0.apk
```

#### Create Download Page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Download UPSC PrepX AI</title>
</head>
<body>
    <h1>UPSC PrepX AI - Android App</h1>
    <p>Version: 1.0.0</p>
    <a href="/downloads/upsc-prepx-v1.0.apk" download>
        Download APK (50 MB)
    </a>
    <p><strong>Installation Instructions:</strong></p>
    <ol>
        <li>Enable "Install from Unknown Sources" in Settings</li>
        <li>Download the APK file</li>
        <li>Open the downloaded file</li>
        <li>Tap "Install"</li>
    </ol>
</body>
</html>
```

### Option 3: Firebase App Distribution

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init appdistribution

# Distribute
firebase appdistribution:distribute android/app/build/outputs/apk/release/app-release.apk \
  --app "your-app-id" \
  --groups "testers"
```

---

## 🚀 PART 8: APP SCREENS OVERVIEW

### Authentication Flow

| Screen | Purpose |
|--------|---------|
| `SplashScreen` | App loading & initialization |
| `LoginScreen` | User login |
| `RegisterScreen` | New user registration |

### Main Tabs

| Tab | Screen | Features |
|-----|--------|----------|
| **Home** | `HomeScreen` | Dashboard, recent activity, quick access |
| **Videos** | `VideoLecturesScreen` | Browse & generate AI videos |
| **Notes** | `NotesScreen` | AI-generated study notes |
| **Quiz** | `QuizScreen` | Practice quizzes |
| **Profile** | `ProfileScreen` | User settings, subscription, progress |

### Additional Screens

| Screen | Purpose |
|--------|---------|
| `VideoPlayerScreen` | Video playback with controls |
| `NotesDetailScreen` | Detailed note view |
| `QuizResultScreen` | Quiz results & analytics |
| `SettingsScreen` | App settings |
| `SubscriptionScreen` | Subscription management |
| `DownloadsScreen` | Offline content |
| `BookmarksScreen` | Saved content |

---

## 🚀 PART 9: KEY FEATURES IMPLEMENTATION

### 1. Video Player with Local Rendering

```javascript
// src/screens/VideoPlayerScreen.js
import React, {useRef} from 'react';
import {View, StyleSheet} from 'react-native';
import Video from 'react-native-video';

const VideoPlayerScreen = ({route}) => {
  const {videoUrl, title} = route.params;
  const videoRef = useRef(null);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{uri: videoUrl}}
        style={styles.video}
        controls={true}
        resizeMode="contain"
        paused={false}
      />
    </View>
  );
};
```

### 2. AI Notes Generation

```javascript
// Generate notes via API
const generateNotes = async (topic, subject) => {
  const response = await apiService.notes.generate(topic, subject);
  return response.data;
};
```

### 3. Quiz System

```javascript
// Submit quiz answers
const submitQuiz = async (quizId, answers) => {
  const response = await apiService.quizzes.submit(quizId, answers);
  return response.data;
};
```

### 4. Offline Mode

```javascript
// Download video for offline viewing
const downloadVideo = async (videoId, videoUrl) => {
  await apiService.downloads.add('video', videoId);
  // Implement local file storage
};
```

---

## 🚀 PART 10: TROUBLESHOOTING

### Issue: Metro Bundler Won't Start

```bash
# Clear cache
npx react-native start --reset-cache

# Kill all node processes
killall node
```

### Issue: Android Build Fails

```bash
# Clean build
cd android
./gradlew clean
./gradlew assembleDebug

# Check Java version
java -version  # Should be JDK 17
```

### Issue: API Connection Fails

```bash
# Test API from device/emulator
adb shell
curl http://89.117.60.144:3000/api/health

# For emulator, use 10.0.2.2 for localhost
curl http://10.0.2.2:3000/api/health
```

### Issue: App Crashes on Launch

```bash
# Check logs
adb logcat | grep ReactNative

# Uninstall and reinstall
adb uninstall com.upscprepx.ai
npm run android
```

### Issue: Gradle Build Too Slow

```bash
# Increase Gradle heap size
# Edit android/gradle.properties:
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

---

## 🚀 PART 11: PERFORMANCE OPTIMIZATION

### Enable ProGuard (Release Builds)

Edit `android/app/build.gradle`:

```gradle
def enableProguardInReleaseBuilds = true
```

### Optimize Images

```bash
# Compress images before adding to app
npm install -g imagemin-cli
imagemin src/assets/images/* --out-dir=src/assets/images-optimized
```

### Enable Hermes Engine

Edit `android/app/build.gradle`:

```gradle
project.ext.react = [
    enableHermes: true
]
```

---

## 🚀 PART 12: SECURITY BEST PRACTICES

### 1. Secure Storage

```javascript
// Use encrypted storage for sensitive data
import EncryptedStorage from 'react-native-encrypted-storage';

await EncryptedStorage.setItem('auth_token', token);
```

### 2. SSL Pinning (Production)

```javascript
// Configure in android/app/src/main/AndroidManifest.xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...
>
```

### 3. Obfuscate Code

```gradle
// android/app/build.gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
    }
}
```

---

## 📞 Support & Resources

- **React Native Docs:** https://reactnative.dev
- **Android Studio:** https://developer.android.com/studio
- **VPS Backend:** `http://89.117.60.144:3000`
- **Coolify:** `http://89.117.60.144:8000`

---

**🎉 Mobile App Ready for Production!**

**Next Steps:**
1. ✅ Build release APK
2. ✅ Test on multiple devices
3. ✅ Create store listing
4. ✅ Submit to Google Play
5. ✅ Monitor crashes & analytics

**APK Location:** `android/app/build/outputs/apk/release/app-release.apk`
