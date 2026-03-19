# 💡 Usage Examples - Optimized Mobile App

## 🎯 Example 1: Basic Authentication

```dart
// On a Login screen
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gamevault/providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late TextEditingController emailController;
  late TextEditingController passwordController;

  @override
  void initState() {
    super.initState();
    emailController = TextEditingController();
    passwordController = TextEditingController();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return SingleChildScrollView(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  controller: emailController,
                  decoration: InputDecoration(labelText: 'Email'),
                ),
                SizedBox(height: 16),
                TextField(
                  controller: passwordController,
                  obscureText: true,
                  decoration: InputDecoration(labelText: 'Password'),
                ),
                SizedBox(height: 24),
                
                // Show error if any
                if (authProvider.error != null)
                  Container(
                    padding: EdgeInsets.all(12),
                    color: Colors.red[100],
                    child: Text(
                      authProvider.error!,
                      style: TextStyle(color: Colors.red),
                    ),
                  ),
                
                SizedBox(height: 24),
                
                // Login Button
                ElevatedButton(
                  onPressed: authProvider.isLoading
                    ? null
                    : () async {
                        final success = await authProvider.login(
                          email: emailController.text,
                          password: passwordController.text,
                        );
                        
                        if (success) {
                          Navigator.of(context).pushReplacementNamed('/home');
                        }
                      },
                  child: authProvider.isLoading
                    ? CircularProgressIndicator()
                    : Text('Login'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }
}
```

---

## 🎮 Example 2: List Games with Pagination

```dart
// On a Games screen
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gamevault/providers/games_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

class GamesScreen extends StatefulWidget {
  @override
  State<GamesScreen> createState() => _GamesScreenState();
}

class _GamesScreenState extends State<GamesScreen> {
  final scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Load games when screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GamesProvider>().fetchGames();
    });

    // Detect when reached end of list to load more
    scrollController.addListener(() {
      if (scrollController.position.pixels >=
          scrollController.position.maxScrollExtent - 500) {
        context.read<GamesProvider>().loadMore();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Games'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () {
              context.read<GamesProvider>().fetchGames(refresh: true);
            },
          ),
        ],
      ),
      body: Consumer<GamesProvider>(
        builder: (context, provider, _) {
          // Show initial loading
          if (provider.isLoading && provider.games.isEmpty) {
            return Center(child: CircularProgressIndicator());
          }

          // Show error
          if (provider.error != null && provider.games.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error, size: 48, color: Colors.red),
                  SizedBox(height: 16),
                  Text(provider.error!),
                  SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      provider.clearError();
                      provider.fetchGames();
                    },
                    child: Text('Try Again'),
                  ),
                ],
              ),
            );
          }

          // Show games list
          return ListView.builder(
            controller: scrollController,
            itemCount: provider.games.length +
                (provider.isLoadingMore ? 1 : 0),
            itemBuilder: (context, index) {
              // Show loader at end if loading more
              if (index == provider.games.length) {
                return Center(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: CircularProgressIndicator(),
                  ),
                );
              }

              final game = provider.games[index];
              return GameCard(game: game);
            },
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    scrollController.dispose();
    super.dispose();
  }
}

// Game Card Widget
class GameCard extends StatelessWidget {
  final Game game;

  const GameCard({required this.game});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.all(8),
      child: ListTile(
        leading: CachedNetworkImage(
          imageUrl: game.coverImageUrl ?? '',
          width: 50,
          height: 75,
          fit: BoxFit.cover,
          placeholder: (context, url) => ShimmerLoading(),
          errorWidget: (context, url, error) => Icon(Icons.error),
        ),
        title: Text(game.title),
        subtitle: Text(game.releaseYear?.toString() ?? 'N/A'),
        onTap: () {
          context.read<GamesProvider>().getGameById(game.id);
          Navigator.of(context).pushNamed('/game-detail', arguments: game.id);
        },
      ),
    );
  }
}
```

---

## 📚 Example 3: Manage Collection

```dart
// On a Game Details screen
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gamevault/providers/user_data_provider.dart';

class AddToCollectionButton extends StatelessWidget {
  final int gameId;

  const AddToCollectionButton({required this.gameId});

  @override
  Widget build(BuildContext context) {
    return Consumer<UserDataProvider>(
      builder: (context, userProvider, _) {
        final inCollection = userProvider.isInCollection(gameId);
        final status = userProvider.getGameStatus(gameId);

        return PopupMenuButton(
          itemBuilder: (context) => [
            // Option: Add to collection
            PopupMenuItem(
              child: Text('Playing Now'),
              onTap: () async {
                final success = await userProvider.setAsPlaying(gameId);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Added to collection!')),
                  );
                }
              },
            ),
            // Option: Mark as Completed
            PopupMenuItem(
              child: Text('Completed'),
              onTap: () async {
                final success = await userProvider.setAsCompleted(gameId);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Marked as completed!')),
                  );
                }
              },
            ),
            // Option: Add to Wishlist
            PopupMenuItem(
              child: Text('Wishlist'),
              onTap: () async {
                final success = await userProvider.toggleWishlist(gameId);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Added to wishlist!')),
                  );
                }
              },
            ),
            // Option: Remove
            if (inCollection)
              PopupMenuItem(
                child: Text('Remove from Collection'),
                onTap: () async {
                  final success = await userProvider.removeFromCollection(gameId);
                  if (success) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Removed from collection!')),
                    );
                  }
                },
              ),
          ],
          child: ElevatedButton(
            onPressed: null,
            child: Text(
              inCollection ? 'Edit ($status)' : 'Add to Collection',
            ),
          ),
        );
      },
    );
  }
}
```

---

## 🔍 Example 4: Search Games

```dart
// On a Search screen
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gamevault/providers/games_provider.dart';

class SearchGamesScreen extends StatefulWidget {
  @override
  State<SearchGamesScreen> createState() => _SearchGamesScreenState();
}

class _SearchGamesScreenState extends State<SearchGamesScreen> {
  late TextEditingController searchController;

  @override
  void initState() {
    super.initState();
    searchController = TextEditingController();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Search Games')),
      body: Column(
        children: [
          // Search field
          Padding(
            padding: EdgeInsets.all(16),
            child: TextField(
              controller: searchController,
              decoration: InputDecoration(
                hintText: 'Type game name...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onChanged: (query) {
                if (query.isNotEmpty) {
                  context.read<GamesProvider>().searchGames(query);
                } else {
                  context.read<GamesProvider>().clearSearch();
                }
              },
            ),
          ),

          // Search results
          Expanded(
            child: Consumer<GamesProvider>(
              builder: (context, provider, _) {
                // If no query
                if (searchController.text.isEmpty) {
                  return Center(
                    child: Text('Type to search...'),
                  );
                }

                // Searching
                if (provider.isSearching) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text('Searching...'),
                      ],
                    ),
                  );
                }

                // No results
                if (provider.searchResults.isEmpty) {
                  return Center(
                    child: Text('No games found'),
                  );
                }

                // Show results
                return ListView.builder(
                  itemCount: provider.searchResults.length,
                  itemBuilder: (context, index) {
                    final game = provider.searchResults[index];
                    return ListTile(
                      title: Text(game.title),
                      subtitle: Text(game.releaseYear?.toString() ?? ''),
                      onTap: () {
                        context.read<GamesProvider>().getGameById(game.id);
                        Navigator.pop(context);
                      },
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }
}
```

---

## 🔐 Example 5: Set API URL at Runtime

```dart
// On a Settings screen
import 'package:flutter/material.dart';
import 'package:gamevault/config/app_config.dart';
import 'package:gamevault/services/api_service.dart';

class SettingsScreen extends StatefulWidget {
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController ipController;

  @override
  void initState() {
    super.initState();
    final api = ApiService();
    ipController = TextEditingController(text: api.getApiUrl());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Settings')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'API Configuration',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            SizedBox(height: 24),

            // Environment options
            Text('Environment:'),
            SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                ElevatedButton(
                  onPressed: () {
                    AppConfig.setEnvironment(ApiEnvironment.emulator);
                    _showSnackbar('Set to Emulator');
                  },
                  child: Text('Emulator'),
                ),
                ElevatedButton(
                  onPressed: () {
                    AppConfig.setEnvironment(ApiEnvironment.localDevice);
                    _showSnackbar('Set to Local Device');
                  },
                  child: Text('Local Device'),
                ),
                ElevatedButton(
                  onPressed: () {
                    AppConfig.setEnvironment(ApiEnvironment.production);
                    _showSnackbar('Set to Production');
                  },
                  child: Text('Production'),
                ),
              ],
            ),

            SizedBox(height: 32),

            // Custom URL
            Text('Custom URL:'),
            SizedBox(height: 8),
            TextField(
              controller: ipController,
              decoration: InputDecoration(
                hintText: 'Ex: http://192.168.1.100:3000/api',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                AppConfig.setCustomApiUrl(ipController.text);
                ApiService().setApiUrl(ipController.text);
                _showSnackbar('URL updated!');
              },
              child: Text('Apply Custom URL'),
            ),

            SizedBox(height: 32),

            // API Status
            Text('API Status:'),
            SizedBox(height: 8),
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Connecting to:\\n${ApiService().getApiUrl()}',
                style: TextStyle(fontFamily: 'monospace'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  void dispose() {
    ipController.dispose();
    super.dispose();
  }
}
```

---

## 📊 Example 6: Check Cache

```dart
// Check and clear cache
import 'package:gamevault/services/api_service.dart';

void demonstrateCache() async {
  final api = ApiService();

  // First call - Will fetch from API
  print('First call (no cache):');
  final games1 = await api.get('/games');
  print('Result: ${games1.length} games');

  // Second call - Will use cache
  print('\\nSecond call (with cache):');
  final games2 = await api.get('/games');
  print('Result: ${games2.length} games (from cache!)');

  // Clear cache
  print('\\nClearing cache...');
  api.clearCache();

  // Third call - Cache cleared, will fetch again
  print('Third call (cache cleared):');
  final games3 = await api.get('/games');
  print('Result: ${games3.length} games (new request)');
}
```

---

## 🔄 Example 7: Handle Errors

```dart
// Complete error handling
import 'package:gamevault/services/api_service.dart';

void handleErrors() async {
  final api = ApiService();

  try {
    final games = await api.get('/games');
  } on ApiException catch (e) {
    if (e.isNetworkError) {
      print('❌ Network error: ${e.message}');
    } else if (e.isTimeout) {
      print('⏱️ Timeout: ${e.message}');
    } else if (e.statusCode == 401) {
      print('🔐 Not authenticated: ${e.message}');
    } else if (e.statusCode == 403) {
      print('🚫 Access denied: ${e.message}');
    } else {
      print('❌ Error: ${e.message} (${e.statusCode})');
    }
  } catch (e) {
    print('❌ Unknown error: $e');
  }
}
```

---

## 🎯 Pattern Summary

| Pattern | When to Use |
|---------|------------|
| `fetchGames()` | Load games list |
| `getGameById(id)` | Get game details |
| `searchGames(query)` | Search by name |
| `loadMore()` | Load next page |
| `addToCollection()` | Add to collection |
| `toggleWishlist()` | Add/remove wishlist |
| `updateCollectionItem()` | Update status |

---

**Ready to use! 🚀**

For more examples, see:
- `lib/providers/` - State management
- `lib/services/` - API integration
- `lib/screens/` - Screen implementations
