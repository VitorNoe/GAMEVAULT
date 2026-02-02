# GameVault Mobile App

A Flutter-based mobile application for the GameVault game preservation platform. This app connects to the same backend API as the web version, providing a native mobile experience for Android devices.

## Features

- 🎮 Browse and search games catalog
- 👤 User authentication (login/register)
- 📚 Personal game collection management
- ❤️ Wishlist functionality
- 🔍 Advanced search and filters
- 📱 Native Android experience
- 🌙 Dark gaming aesthetic theme

## Requirements

- Flutter SDK 3.0.0 or higher
- Dart SDK 3.0.0 or higher
- Android Studio / VS Code with Flutter extension
- Android SDK (API level 21+)

## Setup Instructions

### 1. Install Flutter

Follow the official Flutter installation guide:
https://docs.flutter.dev/get-started/install

### 2. Clone and Navigate

```bash
cd mobile-app
```

### 3. Install Dependencies

```bash
flutter pub get
```

### 4. Add Fonts (Optional)

Download Poppins fonts from Google Fonts and place them in `assets/fonts/`:
- Poppins-Regular.ttf
- Poppins-Medium.ttf
- Poppins-SemiBold.ttf
- Poppins-Bold.ttf

Or remove the fonts section from `pubspec.yaml` to use Google Fonts CDN.

### 5. Configure API URL

Edit `lib/config/app_config.dart` and update the `apiBaseUrl`:

```dart
// For Android Emulator:
static const String apiBaseUrl = 'http://10.0.2.2:3001/api';

// For Physical Device (use your computer's local IP):
static const String apiBaseUrl = 'http://192.168.1.XXX:3001/api';
```

### 6. Run the App

```bash
# Run in debug mode
flutter run

# Run on specific device
flutter devices
flutter run -d <device_id>
```

## Project Structure

```
lib/
├── config/
│   ├── app_config.dart      # App configuration
│   └── theme.dart           # Theme & colors
├── models/
│   ├── user.dart            # User model
│   ├── game.dart            # Game model
│   └── platform.dart        # Platform model
├── providers/
│   ├── auth_provider.dart   # Authentication state
│   ├── games_provider.dart  # Games state
│   └── user_data_provider.dart # User data state
├── services/
│   ├── api_service.dart     # HTTP client
│   ├── auth_service.dart    # Auth API calls
│   ├── game_service.dart    # Games API calls
│   └── user_service.dart    # User API calls
├── screens/
│   ├── home/                # Home screen
│   ├── games/               # Games list & detail
│   ├── auth/                # Login & Register
│   ├── profile/             # User profile
│   ├── collection/          # User collection
│   └── wishlist/            # User wishlist
├── widgets/
│   ├── common/              # Reusable widgets
│   └── games/               # Game-specific widgets
├── routes/
│   └── app_routes.dart      # Navigation config
└── main.dart                # App entry point
```

## Building for Release

### Generate APK

```bash
flutter build apk --release
```

The APK will be at: `build/app/outputs/flutter-apk/app-release.apk`

### Generate App Bundle (for Play Store)

```bash
flutter build appbundle --release
```

The bundle will be at: `build/app/outputs/bundle/release/app-release.aab`

## API Integration

This app connects to the GameVault backend API. Make sure the backend is running before using the app.

### API Endpoints Used

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/games` - List games
- `GET /api/games/:id` - Get game details
- `GET /api/games/search` - Search games
- `GET /api/users/collection` - Get user collection
- `POST /api/users/collection` - Add to collection
- `DELETE /api/users/collection/:id` - Remove from collection
- `GET /api/users/wishlist` - Get wishlist
- `POST /api/users/wishlist` - Add to wishlist
- `DELETE /api/users/wishlist/:id` - Remove from wishlist

## Troubleshooting

### Connection Issues

1. **Android Emulator**: Use `10.0.2.2` instead of `localhost`
2. **Physical Device**: Use your computer's local IP address
3. **Firewall**: Ensure port 3001 is accessible
4. **Backend**: Verify the backend is running with `npm run dev`

### Build Issues

```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

## License

MIT License - see LICENSE file for details.
