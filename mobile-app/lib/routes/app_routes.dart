import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/collection/collection_screen.dart';
import '../screens/games/game_detail_screen.dart';
import '../screens/games/games_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/wishlist/wishlist_screen.dart';

class AppRoutes {
  AppRoutes._();

  static const String home = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String main = '/main';
  static const String games = '/games';
  static const String gameDetail = '/game-detail';
  static const String collection = '/collection';
  static const String wishlist = '/wishlist';
  static const String profile = '/profile';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case '/':
      case '/main':
        return MaterialPageRoute(
          builder: (_) => const MainNavigation(),
          settings: settings,
        );

      case '/login':
        return _fadeRoute(const LoginScreen(), settings);

      case '/register':
        return _fadeRoute(const RegisterScreen(), settings);

      case '/games':
        return _slideRoute(const GamesScreen(), settings);

      case '/game-detail':
        final gameId = settings.arguments as int;
        return _slideRoute(
          GameDetailScreen(gameId: gameId),
          settings,
        );

      case '/collection':
        return _slideRoute(const CollectionScreen(), settings);

      case '/wishlist':
        return _slideRoute(const WishlistScreen(), settings);

      case '/profile':
        return _slideRoute(const ProfileScreen(), settings);

      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline,
                      size: 48, color: AppTheme.textMuted),
                  const SizedBox(height: 16),
                  Text(
                    'Page not found: ${settings.name}',
                    style: const TextStyle(color: AppTheme.textSecondary),
                  ),
                  const SizedBox(height: 20),
                  TextButton(
                    onPressed: () {},
                    child: const Text('Go Home'),
                  ),
                ],
              ),
            ),
          ),
        );
    }
  }

  static PageRouteBuilder _fadeRoute(Widget page, RouteSettings settings) {
    return PageRouteBuilder(
      settings: settings,
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, __, child) {
        return FadeTransition(opacity: animation, child: child);
      },
      transitionDuration: const Duration(milliseconds: 250),
    );
  }

  static PageRouteBuilder _slideRoute(Widget page, RouteSettings settings) {
    return PageRouteBuilder(
      settings: settings,
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, __, child) {
        final tween = Tween<Offset>(
          begin: const Offset(1.0, 0.0),
          end: Offset.zero,
        ).chain(CurveTween(curve: Curves.easeOutCubic));
        return SlideTransition(
          position: animation.drive(tween),
          child: child,
        );
      },
      transitionDuration: const Duration(milliseconds: 300),
    );
  }
}

/// Main navigation with bottom tab bar.
class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  final _screens = const [
    HomeScreen(),
    GamesScreen(),
    CollectionScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: AppTheme.borderColor, width: 0.5),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.gamepad_outlined),
              activeIcon: Icon(Icons.gamepad),
              label: 'Games',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.library_books_outlined),
              activeIcon: Icon(Icons.library_books),
              label: 'Collection',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
