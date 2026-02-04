# GameVault Mobile App - Debug Guide

## Requirements
- Flutter 3.38.x or higher
- Android SDK 36 or higher
- Dart 3.10+

## Initial Setup

### 1. Install Dependencies
```bash
cd mobile-app
flutter pub get
```

### 2. Check Environment
```bash
flutter doctor -v
```

## Running on Android Emulator

### 1. Start the Backend
Before running the app, make sure the backend is running:
```bash
cd backend
npm run dev
```
The backend should be running on port 3001.

### 2. Run the App
```bash
# Debug mode
flutter run

# With detailed logs
flutter run --verbose

# Specify device
flutter run -d <device_id>
```

### 3. List available devices
```bash
flutter devices
```

## Network Configuration (Important!)

### For Android Emulator
The app is already configured to use `10.0.2.2:3001`, which is the host's localhost address from the emulator.

### For Physical Device
If you are using a physical device:

1. Find your local IP:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` or `ip addr`

2. Edit `lib/config/app_config.dart` and change:
```dart
// Set isDebug to false and configure customIp
static const bool isDebug = true;
```

3. Or edit `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<domain includeSubdomains="true">192.168.1.X</domain>
```

## Hot Reload and Hot Restart

During debugging:
- **Hot Reload**: Press `r` in the terminal
- **Hot Restart**: Press `R` in the terminal
- **Quit**: Press `q`

## Debugging with VS Code

### Launch Configuration
Create or edit `.vscode/launch.json`:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "GameVault (debug)",
            "request": "launch",
            "type": "dart",
            "flutterMode": "debug"
        },
        {
            "name": "GameVault (profile)",
            "request": "launch",
            "type": "dart",
            "flutterMode": "profile"
        }
    ]
}
```

## Debugging with Android Studio

1. Open the `mobile-app` folder in Android Studio
2. Select the device in the toolbar
3. Click "Run" or press Shift+F10

## Useful Commands

```bash
# Clean cache and rebuild
flutter clean
flutter pub get
flutter run

# Check code issues
flutter analyze

# Run tests
flutter test

# Build debug APK
flutter build apk --debug

# Build release APK
flutter build apk --release
```

## Troubleshooting

### Error: "No internet connection"
- Make sure the backend is running
- Check if the IP/port is correct in `app_config.dart`
- For emulator: use `10.0.2.2:3001`
- For physical device: use your computer's IP

### Error: "SocketException"
- Check `network_security_config.xml`
- Make sure `cleartextTrafficPermitted="true"` is set

### Error: "Gradle build failed"
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
flutter run
```

### Fonts not loading
The app uses `google_fonts` to fetch fonts automatically. If offline, configure local fonts in `pubspec.yaml`.

## Project Structure

```
lib/
├── main.dart                 # Entry point
├── config/                   # Configurations
│   ├── app_config.dart       # URLs and constants
│   ├── theme.dart            # Visual theme
│   └── debug_config.dart     # Debug helpers
├── models/                   # Data models
├── providers/                # State management
├── routes/                   # Navigation
├── screens/                  # Screens
├── services/                 # API services
└── widgets/                  # UI components
```

## Contact and Support

If you encounter problems, check:
1. Flutter console for errors
2. Backend logs
3. Network tab in Flutter DevTools
