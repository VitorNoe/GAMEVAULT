/// API Endpoints Constants
class ApiEndpoints {
  // ── Authentication ──
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String refreshToken = '/auth/refresh';
  static const String verifyEmail = '/auth/verify-email';
  static const String resendVerification = '/auth/resend-verification';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // ── Games ──
  static const String games = '/games';
  static const String gamesSearch = '/games/search';
  static const String upcomingReleases = '/games/upcoming-releases';
  static const String abandonware = '/games/abandonware';
  static const String goty = '/games/goty';

  /// Get single game endpoint
  static String gameById(int id) => '/games/$id';

  /// Get game reviews
  static String gameReviews(int id) => '/games/$id/reviews';

  // ── User Collection ──
  static const String collection = '/collection';
  static const String collectionStats = '/collection/stats';

  /// Get collection status for a game
  static String collectionStatus(int gameId) => '/collection/status/$gameId';

  /// Update collection item
  static String updateCollection(int gameId) => '/collection/$gameId';

  /// Remove from collection
  static String removeCollection(int gameId) => '/collection/$gameId';

  // ── User Profile & Stats ──
  static const String userMe = '/users/me';
  static const String userStats = '/users/me/stats';

  /// Update user profile
  static const String updateProfile = '/users/me';

  // ── Wishlist ──
  static const String wishlist = '/wishlist';

  /// Add to wishlist
  static const String wishlistAdd = '/wishlist';

  /// Remove from wishlist
  static String removeWishlist(int gameId) => '/wishlist/$gameId';

  // ── Platforms ──
  static const String platforms = '/platforms';

  /// Get single platform
  static String platformById(int id) => '/platforms/$id';

  // ── Media (Images, Videos) ──
  static const String media = '/media';

  /// Upload media
  static const String uploadMedia = '/media/upload';

  // ── Reviews ──
  static const String reviews = '/reviews';

  /// Get user reviews
  static const String userReviews = '/reviews/user';

  /// Create review
  static const String createReview = '/reviews';

  /// Update review
  static String updateReview(int reviewId) => '/reviews/$reviewId';

  /// Delete review
  static String deleteReview(int reviewId) => '/reviews/$reviewId';

  // ── Notifications ──
  static const String notifications = '/notifications';

  /// Mark notification as read
  static String markNotificationRead(int notificationId) =>
      '/notifications/$notificationId/read';

  // ── Admin ──
  static const String adminUsers = '/admin/users';
  static const String adminGames = '/admin/games';
  static const String adminStats = '/admin/stats';
}
