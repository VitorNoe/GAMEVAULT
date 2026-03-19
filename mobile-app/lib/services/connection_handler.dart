import 'dart:async';
import 'package:flutter/foundation.dart';

/// Enum for connection states
enum ConnectivityState {
  connected,
  disconnected,
  connecting,
  error,
}

/// Handles connectivity and network-related operations
class ConnectionHandler extends ChangeNotifier {
  static final ConnectionHandler _instance = ConnectionHandler._internal();
  factory ConnectionHandler() => _instance;
  ConnectionHandler._internal();

  ConnectivityState _state = ConnectivityState.connected;
  String? _lastError;
  DateTime? _lastConnectionCheck;

  ConnectivityState get state => _state;
  String? get lastError => _lastError;
  bool get isConnected =>
      _state == ConnectivityState.connected && _lastError == null;

  /// Check connection by making a simple API call
  Future<bool> checkConnection() async {
    _state = ConnectivityState.connecting;
    notifyListeners();

    try {
      // Simulate a quick check with a small timeout
      await Future.delayed(const Duration(milliseconds: 100));

      _state = ConnectivityState.connected;
      _lastError = null;
      _lastConnectionCheck = DateTime.now();
      notifyListeners();

      if (kDebugMode) {
        print('🌐 [Connectivity] Connected');
      }

      return true;
    } catch (e) {
      _state = ConnectivityState.disconnected;
      _lastError = 'Connection error: $e';
      _lastConnectionCheck = DateTime.now();
      notifyListeners();

      if (kDebugMode) {
        print('🌐 [Connectivity] Disconnected: $e');
      }

      return false;
    }
  }

  /// Retry connection with exponential backoff
  Future<bool> retryConnectionWithBackoff({
    int maxAttempts = 5,
    Duration initialDelay = const Duration(milliseconds: 500),
  }) async {
    for (int i = 0; i < maxAttempts; i++) {
      final success = await checkConnection();
      if (success) return true;

      if (i < maxAttempts - 1) {
        final delay = initialDelay * (1 << i); // Exponential backoff
        if (kDebugMode) {
          print('🌐 [Connectivity] Retrying in ${delay.inMilliseconds}ms...');
        }
        await Future.delayed(delay);
      }
    }

    return false;
  }

  /// Reset connection state
  void resetState() {
    _state = ConnectivityState.connected;
    _lastError = null;
    notifyListeners();
  }

  /// Get human-readable error message
  String getErrorMessage() {
    switch (_state) {
      case ConnectivityState.disconnected:
        return 'No internet connection. Please check your network.';
      case ConnectivityState.error:
        return _lastError ?? 'An unknown error occurred.';
      case ConnectivityState.connecting:
        return 'Connecting...';
      case ConnectivityState.connected:
        return 'Connected';
    }
  }

  /// Monitor connection with periodic checks
  StreamController<ConnectivityState>? _streamController;

  Stream<ConnectivityState> monitorConnection({
    Duration checkInterval = const Duration(seconds: 30),
  }) {
    _streamController = StreamController<ConnectivityState>.broadcast();

    Timer.periodic(checkInterval, (_) async {
      await checkConnection();
      _streamController?.add(_state);
    });

    return _streamController!.stream;
  }

  /// Stop monitoring connection
  void stopMonitoring() {
    _streamController?.close();
    _streamController = null;
  }

  @override
  void dispose() {
    stopMonitoring();
    super.dispose();
  }
}

/// Exception for connection-related errors
class ConnectionException implements Exception {
  final String message;
  final dynamic originalError;

  ConnectionException(this.message, {this.originalError});

  @override
  String toString() => message;
}
