# GameVault Mobile App - Setup and Optimization Guide

## 📱 Overview

The mobile app is now fully optimized to connect with the GameVault backend on port 3000 with support for:
- ✅ Retry logic with exponential backoff
- ✅ Intelligent caching for GET requests
- ✅ Detailed logging for debugging
- ✅ Robust error and timeout handling
- ✅ Multi-environment support (emulator, local device, production)
- ✅ Lazy loading and pagination
- ✅ Token and authentication management

---

## 🔧 Initial Configuration

### 1. **For Android Emulator**

The app is pre-configured for Android emulator which uses `10.0.2.2` as localhost host.

**API URL:** `http://10.0.2.2:3000/api`

```dart
// In lib/config/app_config.dart - already set
AppConfig.setEnvironment(ApiEnvironment.emulator);
```

---

### 2. **For Real Device (Same WiFi)**

If your device is on the same network as the machine with the backend:

#### Step 1: Find your machine's IP
```bash
# Linux/Mac
ifconfig | grep inet

# Windows (PowerShell)
ipconfig
```

#### Step 2: Configure in app
```dart
// In lib/main.dart or settings screen
AppConfig.setLocalDeviceUrl('192.168.1.100'); // Your real IP
```

Or use direct constant:
```dart
AppConfig.setCustomApiUrl('http://192.168.1.100:3000/api');
```

---

### 3. **For Production**

```dart
AppConfig.setEnvironment(ApiEnvironment.production);
// Default URL will be: https://api.gamevault.com/api
```

Or configure custom URL:
```dart
AppConfig.setCustomApiUrl('https://your-domain.com/api');
```

---

## 🚀 How to Start the App

### Prerequisites
- Flutter SDK >= 3.1.0
- Backend GameVault running on `http://localhost:3000`

### Install Dependencies
```bash
cd mobile-app
flutter pub get
```

### Run on Emulator
```bash
flutter run
```

### Run on Real Device
```bash
flutter run -d <device-id>

# List available devices
flutter devices
```

---

## 📊 File Structure

```
lib/
├── config/
│   ├── app_config.dart          # API and environment configuration
│   ├── api_endpoints.dart       # Endpoint constants
│   ├── theme.dart               # Visual theme
│   └── debug_config.dart        # Debug configuration
├── services/
│   ├── api_service.dart         # HTTP client with retry and cache
│   ├── auth_service.dart        # Authentication
│   ├── game_service.dart        # Games service
│   ├── user_service.dart        # User service
│   └── connection_handler.dart  # Connectivity manager
├── providers/
│   ├── auth_provider.dart       # Authentication state
│   ├── games_provider.dart      # Games state
│   └── user_data_provider.dart  # User data state
├── models/
├── screens/
└── main.dart
```

---

## 🔐 API Service Features

### Retry Logic
The `ApiService` automatically retries requests that fail with network errors:
- **Max Retries:** 3
- **Backoff:** Exponential (500ms, 1s, 2s)
- **No retry:** 401, 403, 422 (client errors)

```dart
// Retry happens automatically - no extra code needed
final games = await gameService.getAllGames();
```

### Intelligent Cache
GET requests are automatically cached for 1 hour:
```dart
// Uses cache if available
final game = await gameService.getGameById(1);

// Force new request
final response = await _api.get(
  '/games/1',
  useCache: false,  // Ignore cache
);
```

### Logging
All requests are logged in debug mode:
```
🎮 [GameVault API] [INFO] GET /games?page=1&limit=20
🎮 [GameVault API] [INFO] Cache hit retrieved: /games?page=1&limit=20
🎮 [GameVault API] [ERROR] API Error 401: Unauthorized
```

---

## 📲 Dependencies Update

New dependencies added for better performance:

```yaml
dependencies:
  shimmer: ^3.0.0                    # Loading components
  connectivity_plus: ^6.0.1          # Check connectivity
  shared_preferences: ^2.2.3         # Local cache
  hive: ^2.2.3                       # Local database
  uuid: ^4.0.0                       # ID generation
  dio: ^5.4.1                        # Alternative HTTP client
  retry: ^3.1.2                      # Retry utilities
```

To install dependencies:
```bash
flutter pub get
flutter pub upgrade
```

---

## 🔍 Debugging and Troubleshooting

### Check Connection
```dart
final connectionHandler = ConnectionHandler();
final isConnected = await connectionHandler.checkConnection();
print('Connected: $isConnected');
```

### See API URL in Use
```dart
final api = ApiService();
print('API URL: ${api.getApiUrl()}');
```

### Clear API Cache
```dart
final api = ApiService();
api.clearCache();
```

### Enable Detailed Logging
Logging is automatically enabled in debug mode. For more details:

```dart
// In main.dart
if (kDebugMode) {
  debugPrintBeginFrame = true;
  debugPrintEndFrame = true;
}
```

---

## ⚡ Performance Optimizations

### 1. **Lazy Loading**
Images are loaded on demand with `CachedNetworkImage`:
```dart
CachedNetworkImage(
  imageUrl: game.coverImageUrl,
  placeholder: (context, url) => ShimmerLoading(),
  errorWidget: (context, url, error) => Icon(Icons.error),
)
```

### 2. **Pagination**
Games are loaded with pagination of 20 per page:
```dart
// Page 1
await gamesProvider.fetchGames();

// Next page
await gamesProvider.loadMore();
```

### 3. **Data Cache**
Providers maintain in-memory data cache:
```dart
// Reutilize data if recently loaded
final games = gamesProvider.games;
```

### 4. **Minification**
Release build automatically minifies Dart:
```bash
flutter build apk --release
flutter build ios --release
```

---

## 🧪 Tests

### Run Tests
```bash
flutter test

# Specific test
flutter test test/services/api_service_test.dart

# With coverage
flutter test --coverage
```

---

## 📋 Supported API Endpoints

All endpoints are mapped in `lib/config/api_endpoints.dart`:

```dart
ApiEndpoints.login           // POST /auth/login
ApiEndpoints.register        // POST /auth/register
ApiEndpoints.games           // GET /games
ApiEndpoints.gameById(id)    // GET /games/{id}
ApiEndpoints.collection      // GET/POST /collection
ApiEndpoints.updateProfile   // PUT /users/me
// ... and many more
```

---

## 🔒 Security

- ✅ Token stored in `FlutterSecureStorage` (integrated with KeyChain/Keystore)
- ✅ `Authorization: Bearer <token>` headers in authenticated requests
- ✅ Automatic token cleanup on 401 Unauthorized
- ✅ User-Agent header for identification
- ✅ SSL/TLS in production

---

## 📝 Complete Usage Example

```dart
// 1. Login
final authProvider = context.watch<AuthProvider>();
final success = await authProvider.login(
  email: 'user@example.com',
  password: 'password123',
);

// 2. Load games
final gamesProvider = context.watch<GamesProvider>();
await gamesProvider.fetchGames();

// 3. Display games
ListView.builder(
  itemCount: gamesProvider.games.length,
  itemBuilder: (context, index) {
    final game = gamesProvider.games[index];
    return GameCard(game: game);
  },
)

// 4. Add to collection
final userProvider = context.watch<UserDataProvider>();
await userProvider.addToCollection(
  gameId: game.id,
  status: 'playing',
  format: 'digital',
);
```

---

## 📞 Support

For more information:
- See [Backend API Docs](../backend/README_API.md)
- Check logs in debug mode
- See migration files in `database/migrations/`

---

**Last updated:** March 2026
**App Version:** 1.0.0
