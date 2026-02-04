import 'dart:io' show Platform;

/// Debug configuration helper
class DebugConfig {
  DebugConfig._();

  /// Get the appropriate API URL based on the platform
  /// - Android Emulator: 10.0.2.2 (maps to host's localhost)
  /// - iOS Simulator: localhost
  /// - Physical device: use your computer's local IP
  static String getApiUrl({
    String? customIp,
    int port = 3001,
  }) {
    if (customIp != null) {
      return 'http://$customIp:$port/api';
    }

    try {
      if (Platform.isAndroid) {
        // Android emulator uses 10.0.2.2 to access host's localhost
        return 'http://10.0.2.2:$port/api';
      } else if (Platform.isIOS) {
        // iOS simulator can use localhost
        return 'http://localhost:$port/api';
      }
    } catch (_) {
      // Platform detection failed (probably running on web)
    }

    // Default for web or unknown platform
    return 'http://localhost:$port/api';
  }

  /// Print debug information about the current configuration
  static void printDebugInfo() {
    try {
      print('=== Debug Configuration ===');
      print('Platform: ${Platform.operatingSystem}');
      print('API URL: ${getApiUrl()}');
      print('============================');
    } catch (e) {
      print('Debug info not available: $e');
    }
  }
}
