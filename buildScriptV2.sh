#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD_YELLOW='\033[1;33m'
NC='\033[0m' # No Color
ROOT_DIR=$(pwd)
BUILD_GRADLE_FILE="./android/app/build.gradle"
APK_OUTPUT_DIR="${ROOT_DIR}/apks"
BUNDLETOOL_JAR="${ROOT_DIR}/bundletool.jar"

# Show banner in green
echo -e "${GREEN}"
cat << "EOF"
███╗   ███╗ █████╗ ██████╗ ███████╗    ██████╗ ██╗   ██╗               
████╗ ████║██╔══██╗██╔══██╗██╔════╝    ██╔══██╗╚██╗ ██╔╝               
██╔████╔██║███████║██║  ██║█████╗      ██████╔╝ ╚████╔╝                
██║╚██╔╝██║██╔══██║██║  ██║██╔══╝      ██╔══██╗  ╚██╔╝                 
██║ ╚═╝ ██║██║  ██║██████╔╝███████╗    ██████╔╝   ██║                  
╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝    ╚═════╝    ╚═╝                  

███╗   ███╗       ██████╗  ██████╗ ██╗   ██╗███████╗ █████╗ ██╗██████╗ 
████╗ ████║       ██╔══██╗██╔═══██╗██║   ██║╚══███╔╝██╔══██╗██║██╔══██╗
██╔████╔██║       ██████╔╝██║   ██║██║   ██║  ███╔╝ ███████║██║██║  ██║
██║╚██╔╝██║       ██╔══██╗██║   ██║██║   ██║ ███╔╝  ██╔══██║██║██║  ██║
██║ ╚═╝ ██║██╗    ██████╔╝╚██████╔╝╚██████╔╝███████╗██║  ██║██║██████╔╝
╚═╝     ╚═╝╚═╝    ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝╚═════╝ 

Made By -
M. BOUZAID
EOF
echo -e "${NC}"

# === Extract Keystore Info from build.gradle ===
extract_keystore_info() {
  STORE_FILE=$(grep storeFile "$BUILD_GRADLE_FILE" | sed -E 's/.*file\("?([^"]+)"?\).*/\1/' | tr -d "'")
  STORE_PASSWORD=$(grep storePassword "$BUILD_GRADLE_FILE" | awk '{print $2}' | tr -d "'")
  KEY_ALIAS=$(grep keyAlias "$BUILD_GRADLE_FILE" | awk '{print $2}' | tr -d "'")
  KEY_PASSWORD=$(grep keyPassword "$BUILD_GRADLE_FILE" | awk '{print $2}' | tr -d "'")

  STORE_FILE="./android/app/$STORE_FILE"

  if [[ -z "$STORE_FILE" || -z "$STORE_PASSWORD" || -z "$KEY_ALIAS" || -z "$KEY_PASSWORD" ]]; then
    echo -e "${RED}Failed to extract keystore config from build.gradle.${NC}"
    exit 1
  fi

  echo -e "${GREEN}Keystore info extracted:${NC}"
  echo "  Store file:    $STORE_FILE"
  echo "  Key alias:     $KEY_ALIAS"
  echo "  Store pass:    $STORE_PASSWORD"
  echo "  Key pass:      $KEY_PASSWORD"
}

# === Extract package name from build.gradle ===
extract_package_name() {
  PACKAGE_NAME=$(grep applicationId "$BUILD_GRADLE_FILE" | awk '{print $2}' | tr -d "'\"")
  if [ -z "$PACKAGE_NAME" ]; then
    echo -e "${RED}Failed to extract package name from build.gradle.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Package name extracted:${NC} $PACKAGE_NAME"
}

# === Check for connected adb devices ===
check_devices() {
  DEVICES=$(adb devices | grep -w "device" | awk '{print $1}')
  if [ -z "$DEVICES" ]; then
    echo -e "${BOLD_YELLOW}No connected adb devices found."
    return 1
  else
    echo "Connected devices:"
    echo "$DEVICES"
    return 0
  fi
}

# === Prompt user to install APK on device(s) ===
prompt_install() {
  read -p "Do you want to install the built app on connected device(s)? (y/n): " INSTALL_CHOICE
  if [[ "$INSTALL_CHOICE" =~ ^[Yy]$ ]]; then
    for device in $DEVICES; do
      echo "Installing on device: $device"
      adb -s "$device" install -r "$1"
      if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install APK on device $device.${NC}"
        exit 1
      fi
      echo "Launching app on $device..."
      adb -s "$device" shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1
    done
  else
    echo "Skipping installation."
  fi
}

# === Clean APK output directory ===
clean_apks_dir() {
  if [ -d "$APK_OUTPUT_DIR" ]; then
    echo "Cleaning $APK_OUTPUT_DIR folder..."
    rm -rf "$APK_OUTPUT_DIR"/*
  else
    mkdir -p "$APK_OUTPUT_DIR"
  fi
}

# === Build APK ===
build_apk() {
  echo "Building APK..."
  pushd ./android > /dev/null || { echo -e "${RED}Failed to enter android directory.${NC}"; exit 1; }

  ./gradlew assembleRelease
  if [ $? -ne 0 ]; then
    echo -e "${RED}APK build failed.${NC}"
    popd > /dev/null
    exit 1
  fi

  APK_PATH=$(find ./app/build/outputs/apk/release -name "*.apk" | head -n 1)
  if [ -z "$APK_PATH" ]; then
    echo -e "${RED}APK not found after build.${NC}"
    popd > /dev/null
    exit 1
  fi

  echo "Copying APK to $APK_OUTPUT_DIR"
  cp "$APK_PATH" "$APK_OUTPUT_DIR/"

  popd > /dev/null
}

# === Build AAB, then generate APKs bundle and install ===
build_aab_and_install() {
  echo "Building AAB..."
  pushd ./android > /dev/null || { echo -e "${RED}Failed to enter android directory.${NC}"; exit 1; }

  ./gradlew bundleRelease
  if [ $? -ne 0 ]; then
    echo -e "${RED}AAB build failed.${NC}"
    popd > /dev/null
    exit 1
  fi

  AAB_PATH=$(find ./app/build/outputs/bundle/release -name "*.aab" | head -n 1)
  if [ -z "$AAB_PATH" ]; then
    echo -e "${RED}AAB not found after build.${NC}"
    popd > /dev/null
    exit 1
  fi

  echo "Generating APKs from AAB with bundletool..."
 
  
  if [ ! -f "$BUNDLETOOL_JAR" ]; then
    echo -e "${YELLOW}Downloading bundletool.jar...${NC}"
    wget -O "$BUNDLETOOL_JAR" https://github.com/google/bundletool/releases/download/1.18.1/bundletool-all-1.18.1.jar
  fi

  APK_SET_PATH="$APK_OUTPUT_DIR/app.apks"
  popd > /dev/null

  clean_apks_dir
  
  java -jar "$BUNDLETOOL_JAR" build-apks --bundle="android/$AAB_PATH" --output="$APK_SET_PATH" --ks="$STORE_FILE" --ks-key-alias="$KEY_ALIAS" --ks-pass=pass:"$STORE_PASSWORD" --key-pass=pass:"$KEY_PASSWORD" --mode=universal
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to generate APK set from AAB.${NC}"
    exit 1
  fi

  echo "Extracting APK from APK set..."
  unzip -o "$APK_SET_PATH" -d "$APK_OUTPUT_DIR"
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to unzip APK set.${NC}"
    exit 1
  fi

  UNIVERSAL_APK=$(find "$APK_OUTPUT_DIR" -name "universal.apk" | head -n 1)
  if [ -z "$UNIVERSAL_APK" ]; then
    echo -e "${RED}Universal APK not found after extracting apks.${NC}"
    exit 1
  fi

  echo "Universal APK ready at: $UNIVERSAL_APK"

  check_devices
  if [ $? -eq 0 ]; then
    extract_package_name
    prompt_install "$UNIVERSAL_APK"
  fi
}

# === Prompt user to start logcat for the installed app ===
prompt_logcat() {
  read -p "Do you want to start logcat for the app ($PACKAGE_NAME)? (y/n): " LOGCAT_CHOICE
  if [[ "$LOGCAT_CHOICE" =~ ^[Yy]$ ]]; then
    # Clear previous logs
    adb logcat -c

    # Get PID of the app
    APP_PID=$(adb shell pidof "$PACKAGE_NAME")
    if [ -z "$APP_PID" ]; then
      echo -e "${RED}Failed to get PID for $PACKAGE_NAME. Is the app running?${NC}"
      echo -e "${BOLD_YELLOW}Try launching the app manually, then rerun logcat."
      return
    fi

    echo -e "${GREEN}Starting logcat for $PACKAGE_NAME (PID: $APP_PID)... Press Ctrl+C to stop.${NC}"
    trap 'echo -e "${BOLD_YELLOW}Logcat exited.${NC}"' EXIT
    adb logcat --pid="$APP_PID"
    trap - EXIT
  else
    echo -e "${BOLD_YELLOW}Skipping logcat."
  fi
}


# === Main ===
echo -e "${BOLD_YELLOW}Choose build type:${NC}"
echo "1) APK"
echo "2) AAB (bundle)"
read -p "Enter choice (1 or 2): " BUILD_CHOICE

extract_keystore_info
clean_apks_dir

if [[ "$BUILD_CHOICE" == "1" ]]; then
  build_apk
  check_devices
  if [ $? -eq 0 ]; then
    extract_package_name
    APK_FILE=$(find "$APK_OUTPUT_DIR" -name "*.apk" | head -n 1)
    prompt_install "$APK_FILE"
  fi
elif [[ "$BUILD_CHOICE" == "2" ]]; then
  build_aab_and_install
else
  echo -e "${RED}Invalid choice.${NC}"
  exit 1
fi

echo -e "${GREEN}Build script completed successfully.${NC}"

prompt_logcat

echo 