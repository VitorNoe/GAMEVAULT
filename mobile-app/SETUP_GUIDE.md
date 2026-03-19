# GameVault Mobile App - Guia de Configuração e Otimização

## 📱 Visão Geral

O app mobile agora está totalmente otimizado para se conectar com o backend GameVault na porta 3000 com suporte a:
- ✅ Retry logic com backoff exponencial
- ✅ Cache inteligente para GET requests
- ✅ Logging detalhado para debug
- ✅ Tratamento robusto de erros e timeouts
- ✅ Suporte a múltiplos ambientes (emulador, dispositivo local, produção)
- ✅ Lazy loading e paginação
- ✅ Token e gerenciamento de autenticação

---

## 🔧 Configuração Inicial

### 1. **Para Android Emulador**

O app está pré-configurado para o emulador Android que usa `10.0.2.2` como host localhost.

**URL da API:** `http://10.0.2.2:3000/api`

```dart
// Em lib/config/app_config.dart
AppConfig.setEnvironment(ApiEnvironment.emulator);
```

---

### 2. **Para Dispositivo Real (Mesmo WiFi)**

Se seu dispositivo está na mesma rede que a máquina com o backend:

#### Passo 1: Encontre o IP da sua máquina
```bash
# Linux/Mac
ifconfig | grep inet

# Windows (PowerShell)
ipconfig
```

#### Passo 2: Configure no app
```dart
// Em lib/main.dart ou em uma tela de configurações
AppConfig.setLocalDeviceUrl('192.168.1.100'); // Seu IP real
```

Ou use a constante direta:
```dart
AppConfig.setCustomApiUrl('http://192.168.1.100:3000/api');
```

---

### 3. **Para Produção**

```dart
AppConfig.setEnvironment(ApiEnvironment.production);
// URL padrão será: https://api.gamevault.com/api
```

Ou configure uma URL customizada:
```dart
AppConfig.setCustomApiUrl('https://seu-dominio.com/api');
```

---

## 🚀 Como Iniciar o App

### Pré-requisitos
- Flutter SDK >= 3.1.0
- Backend GameVault rodando em `http://localhost:3000`

### Instalar Dependências
```bash
cd mobile-app
flutter pub get
```

### Rodar no Emulador
```bash
flutter run
```

### Rodar em Dispositivo Real
```bash
flutter run -d <device-id>

# Listar dispositivos disponíveis
flutter devices
```

---

## 📊 Estrutura de Arquivos

```
lib/
├── config/
│   ├── app_config.dart          # Configuração da API e ambiente
│   ├── api_endpoints.dart       # Constantes de endpoints
│   ├── theme.dart               # Tema visual
│   └── debug_config.dart        # Config de debug
├── services/
│   ├── api_service.dart         # Cliente HTTP com retry e cache
│   ├── auth_service.dart        # Autenticação
│   ├── game_service.dart        # Serviço de jogos
│   ├── user_service.dart        # Serviço de usuário
│   └── connection_handler.dart  # Gerenciador de conectividade
├── providers/
│   ├── auth_provider.dart       # Estado de autenticação
│   ├── games_provider.dart      # Estado de jogos
│   └── user_data_provider.dart  # Estado de dados do usuário
├── models/
│   ├── game.dart
│   ├── user.dart
│   ├── collection_item.dart
│   └── platform.dart
├── screens/
├── components/
└── main.dart
```

---

## 🔐 API Service Features

### Retry Logic
O `ApiService` automaticamente tenta novamente requisições que falham com erros de rede:
- **Max Retries:** 3
- **Backoff:** Exponencial (500ms, 1s, 2s)
- **Não retenta:** Erros 401, 403, 422 (erro do cliente)

```dart
// O retry é automático - sem código extra necessário
final games = await gameService.getAllGames();
```

### Cache Inteligente
GET requests são automaticamente cacheados por 1 hora:
```dart
// Usa cache se disponível
final game = await gameService.getGameById(1);

// Força novo request
final response = await _api.get(
  '/games/1',
  useCache: false,  // Ignora cache
);
```

### Logging
Todos os requests são logados em modo debug:
```
🎮 [GameVault API] [INFO] GET /games?page=1&limit=20
🎮 [GameVault API] [INFO] Cache hit retrieved: /games?page=1&limit=20
🎮 [GameVault API] [ERROR] API Error 401: Unauthorized
```

---

## 📲 Atualizações de Dependências

Novas dependências adicionadas para melhor performance:

```yaml
dependencies:
  shimmer: ^3.0.0                    # Componentes de loading
  connectivity_plus: ^6.0.1          # Verifica conectividade
  shared_preferences: ^2.2.3         # Cache local
  hive: ^2.2.3                       # Banco de dados local
  uuid: ^4.0.0                       # Geração de IDs únicos
  dio: ^5.4.1                        # Cliente HTTP alternativo
  retry: ^3.1.2                      # Retry utilities
```

ParaInstalarDependências:
```bash
flutter pub get
flutter pub upgrade
```

---

## 🔍 Debugging e Troubleshooting

### Verificar Conexão
```dart
final connectionHandler = ConnectionHandler();
final isConnected = await connectionHandler.checkConnection();
print('Conectado: $isConnected');
```

### Ver URL da API em Uso
```dart
final api = ApiService();
print('API URL: ${api.getApiUrl()}');
```

### Limpar Cache da API
```dart
final api = ApiService();
api.clearCache();
```

### Ativar Logging Detalhado
O logging esta automaticamente habilitado em modo debug. Para mais detalhes:

```dart
// Em main.dart
if (kDebugMode) {
  debugPrintBeginFrame = true;
  debugPrintEndFrame = true;
}
```

---

## ⚡ Performance Otimizações

### 1. **Lazy Loading**
Imagens são carregadas sob demanda com `CachedNetworkImage`:
```dart
CachedNetworkImage(
  imageUrl: game.coverImageUrl,
  placeholder: (context, url) => ShimmerLoading(),
  errorWidget: (context, url, error) => Icon(Icons.error),
)
```

### 2. **Paginação**
Jogos são carregados com paginação de 20 por página:
```dart
// Página 1
await gamesProvider.fetchGames();

// Próxima página
await gamesProvider.loadMore();
```

### 3. **Cache de Dados**
Providers mantêm cache de dados em memória:
```dart
// Reutiliza dados se recém carregados
final games = gamesProvider.games;
```

### 4. **Minificação**
Build de release automaticamente minifica Dart:
```bash
flutter build apk --release
flutter build ios --release
```

---

## 🧪 Testes

### Executar Testes
```bash
flutter test

# Teste específico
flutter test test/services/api_service_test.dart

# Com coverage
flutter test --coverage
```

---

## 📋 Endpoints da API Suportados

Todos os endpoints estão mapeados em `lib/config/api_endpoints.dart`:

```dart
ApiEndpoints.login           // POST /auth/login
ApiEndpoints.register        // POST /auth/register
ApiEndpoints.games           // GET /games
ApiEndpoints.gameById(id)    // GET /games/{id}
ApiEndpoints.collection      // GET/POST /collection
ApiEndpoints.updateProfile   // PUT /users/me
// ... e muitos mais
```

---

## 🔒 Segurança

- ✅ Token armazenado em `FlutterSecureStorage` (integrado ao KeyChain/Keystore)
- ✅ Headers `Authorization: Bearer <token>` em requisições autenticadas
- ✅ Limpeza automática de token em 401 Unauthorized
- ✅ User-Agent header para identificação
- ✅ SSL/TLS em produção

---

## 📝 Exemplo de Uso Completo

```dart
// 1. Login
final authProvider = context.watch<AuthProvider>();
final success = await authProvider.login(
  email: 'user@example.com',
  password: 'password123',
);

// 2. Carregar jogos
final gamesProvider = context.watch<GamesProvider>();
await gamesProvider.fetchGames();

// 3. Exibir jogos
ListView.builder(
  itemCount: gamesProvider.games.length,
  itemBuilder: (context, index) {
    final game = gamesProvider.games[index];
    return GameCard(game: game);
  },
)

// 4. Adicionar à coleção
final userProvider = context.watch<UserDataProvider>();
await userProvider.addToCollection(
  gameId: game.id,
  status: 'playing',
  format: 'digital',
);
```

---

## 📞 Suporte

Para mais informações:
- Ver [Backend API Docs](../backend/README_API.md)
- Verificar logs em modo debug
- Consultar arquivo de migrações em `database/migrations/`

---

**Última atualização:** Março 2026
**Versão do App:** 1.0.0
