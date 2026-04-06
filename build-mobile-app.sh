#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# UPSC PrepX AI - Mobile App Build Script
# ═══════════════════════════════════════════════════════════════
# This script builds production APK and AAB files
# Run on a machine with Android Studio installed
# ═══════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   UPSC PrepX AI - Mobile App Builder                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}[1/8] Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"

# Check Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}✗ Java not found. Install JDK 17.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Java: $(java -version 2>&1 | head -1)${NC}"

# Check Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}! ANDROID_HOME not set. Set it to Android SDK path.${NC}"
    echo "  export ANDROID_HOME=\$HOME/Android/Sdk"
fi

echo ""

# Navigate to mobile app directory
echo -e "${YELLOW}[2/8] Navigating to mobile app directory...${NC}"
cd "$(dirname "$0")/mobile-app" || exit 1
echo -e "${GREEN}✓ Directory: $(pwd)${NC}"
echo ""

# Copy production environment
echo -e "${YELLOW}[3/8] Configuring production environment...${NC}"
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo -e "${GREEN}✓ Environment configured${NC}"
else
    echo -e "${RED}✗ .env.production not found!${NC}"
    exit 1
fi
echo ""

# Install dependencies
echo -e "${YELLOW}[4/8] Installing dependencies...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Create Android directory structure
echo -e "${YELLOW}[5/8] Setting up Android project...${NC}"
if [ ! -d "android" ]; then
    echo "Creating React Native Android project structure..."
    npx @react-native-community/cli init UPSCPrepxAI --directory . --skip-install
fi
echo -e "${GREEN}✓ Android project ready${NC}"
echo ""

# Generate keystore for signing
echo -e "${YELLOW}[6/8] Generating release keystore...${NC}"
if [ ! -f "android/app/upsc-prepx.keystore" ]; then
    keytool -genkey -v \
        -keystore android/app/upsc-prepx.keystore \
        -alias upsc-prepx \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass upsc2026release \
        -keypass upsc2026release \
        -dname "CN=UPSC PrepX, OU=Development, O=UPSC PrepX AI, L=City, ST=State, C=IN"
    echo -e "${GREEN}✓ Keystore generated${NC}"
    echo -e "${YELLOW}  IMPORTANT: Backup this keystore file securely!${NC}"
    echo -e "${YELLOW}  Location: android/app/upsc-prepx.keystore${NC}"
    echo -e "${YELLOW}  Password: upsc2026release${NC}"
else
    echo -e "${GREEN}✓ Keystore already exists${NC}"
fi
echo ""

# Configure Gradle properties
echo -e "${YELLOW}[7/8] Configuring Gradle...${NC}"
cat > android/gradle.properties << 'GRADLEOF'
UPSCPREPX_RELEASE_STORE_FILE=upsc-prepx.keystore
UPSCPREPX_RELEASE_KEY_ALIAS=upsc-prepx
UPSCPREPX_RELEASE_STORE_PASSWORD=upsc2026release
UPSCPREPX_RELEASE_KEY_PASSWORD=upsc2026release

android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx4096m
org.gradle.parallel=true
org.gradle.daemon=true
GRADLEOF
echo -e "${GREEN}✓ Gradle configured${NC}"
echo ""

# Build APK and AAB
echo -e "${YELLOW}[8/8] Building production APK and AAB...${NC}"
echo "This may take 5-10 minutes..."

cd android

# Clean previous builds
./gradlew clean

# Build Debug APK
echo "Building debug APK..."
./gradlew assembleDebug
echo -e "${GREEN}✓ Debug APK built${NC}"

# Build Release APK
echo "Building release APK..."
./gradlew assembleRelease
echo -e "${GREEN}✓ Release APK built${NC}"

# Build AAB (Android App Bundle for Google Play)
echo "Building AAB bundle..."
./gradlew bundleRelease
echo -e "${GREEN}✓ AAB bundle built${NC}"

cd ..

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           BUILD COMPLETE!                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Output Files:${NC}"
echo ""
echo -e "${YELLOW}Debug APK:${NC}"
echo "  android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo -e "${YELLOW}Release APK (for direct distribution):${NC}"
echo "  android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo -e "${YELLOW}AAB Bundle (for Google Play):${NC}"
echo "  android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo -e "${BLUE}File Sizes:${NC}"
ls -lh android/app/build/outputs/apk/release/app-release.apk 2>/dev/null || echo "  APK not found"
ls -lh android/app/build/outputs/bundle/release/app-release.aab 2>/dev/null || echo "  AAB not found"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Test the debug APK on your device first"
echo "2. Test release APK on multiple devices"
echo "3. Upload AAB to Google Play Console"
echo "4. Or distribute APK directly to users"
echo ""
echo -e "${YELLOW}Keystore Backup:${NC}"
echo "  Copy android/app/upsc-prepx.keystore to a secure location!"
echo "  You'll need it for all future app updates."
echo ""
