# 🎮 GameVault Mobile App - GitHub Codespaces Setup

## 🚀 Configuração Rápida

Se você está rodando o backend em um **GitHub Codespaces** e quer conectar o app Flutter no emulador do seu PC, siga estes passos:

### 1. **Identifique a URL do seu Codespaces**

Ao iniciar o Codespaces, você verá uma URL como:
```
https://organic-waddle-v6pqv4rj459g2wpj7-3000.app.github.dev
```

**IMPORTANTE:** Copie essa URL completa!

---

### 2. **Configure a URL no App Flutter**

Há duas formas de fazer isso:

#### **Opção A: Modificação Permanente (Padrão)**

1. Abra: `mobile-app/lib/config/app_config.dart`
2. Procure por esta linha na função `_getDefaultApiUrl()`:
   ```dart
   return 'https://organic-waddle-v6pqv4rj459g2wpj7-3000.app.github.dev/api';
   ```
3. **Substitua `organic-waddle-v6pqv4rj459g2wpj7` pela sua ID de Codespace** (a primeira parte antes de `-3000`)

#### **Opção B: Configuração em Runtime (Dinâmica)**

Se preferir configurar sem editar código, adicione isto no `main.dart` antes de `runApp()`:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Configure a URL do seu Codespaces aqui
  AppConfig.setCustomApiUrl('https://organic-waddle-v6pqv4rj459g2wpj7-3000.app.github.dev/api');
  
  // ... resto do código ...
  runApp(const GameVaultApp());
}
```

---

### 3. **Reconstrua e Execute o App**

Com o emulador aberto, execute:

```bash
cd mobile-app

# Opção 1: Clean rebuild
flutter clean
flutter pub get
flutter run

# Opção 2: Hot reload (mais rápido se já aberto)
# Pressione 'r' no terminal onde o app está rodando
```

---

### 4. **Verifique a Conexão**

Ao iniciar o app, você verá no console:
```
=== GameVault Debug ===
Platform: android
API URL: https://organic-waddle-v6pqv4rj459g2wpj7-3000.app.github.dev/api
=======================
```

Se aparecer algo como `Timeout` após alguns segundos, é problema de CORS ou rede. Veja a seção de troubleshooting.

---

## 📋 Casos de Uso

| Cenário | URL | Onde Configurar |
|---------|-----|-----------------|
| **Backend Local (Máquina hospedeira)** | `http://10.0.2.2:3000/api` | Padrão (já configurado) |
| **GitHub Codespaces** | `https://{workspace-id}-3000.app.github.dev/api` | `app_config.dart` ou `main.dart` |
| **Smartphone na mesma WiFi** | `http://192.168.1.X:3000/api` | `AppConfig.setLocalDeviceUrl('192.168.1.X')` |
| **Produção** | `https://api.gamevault.com/api` | `AppConfig.setEnvironment(ApiEnvironment.production)` |

---

## 🔧 Configurações Avançadas

### Timeout Customizado

Se a conexão é lenta:

```dart
// Em app_config.dart
static const Duration requestTimeout = Duration(seconds: 60); // Aumentado de 30
```

### Ambiente de Teste

Para testar com diferentes URLs sem editar:

```dart
// Em main.dart
if (kDebugMode) {
  // Altere entre estes conforme necessário
  AppConfig.setCustomApiUrl('https://seu-codespace-id-3000.app.github.dev/api');
}
```

---

## ❌ Troubleshooting

### ✗ "Request timeout. Please check your connection and try again"

**Possíveis causas:**
1. URL do Codespaces incorreta → Copie novamente
2. Backend não está rodando → Execute `npm start` no backend
3. Porta 3000 não está exposta → Verifique forwarding

**Solução:**
```bash
# 1. Verifique se a URL está correta
curl https://seu-codespace-id-3000.app.github.dev/api/games

# 2. Reinicie o app (hot restart)
# No console do flutter run, pressione 'R'

# 3. Se continuar, faça clean rebuild
flutter clean && flutter pub get && flutter run
```

---

### ✗ "SSL: CERTIFICATE_VERIFY_FAILED"

**Isso foi resolvido!** O app agora aceita certificados auto-assinados do Codespaces.

Se ainda tiver erro:
1. Reconstrua: `flutter clean && flutter pub get`
2. Faça hot restart: pressione `R` no console

---

### ✗ "CORS Error" ou "No CORS header"

**No backend (`backend/src/config/app.ts`), verifique:**

```typescript
corsOrigin: parseCorsOrigin(), // Padrão: 'http://localhost'
```

Se está bloqueando, configure a variável de ambiente:

```bash
export CORS_ORIGIN="https://seu-codespace-id-3000.app.github.dev"
```

Ou no `.env`:

```
CORS_ORIGIN=https://seu-codespace-id-3000.app.github.dev
```

---

## ✅ Verificação Passo a Passo

1. **Check backend rodando:**
   ```bash
   curl -I https://seu-codespace-id-3000.app.github.dev/api/games
   # Esperado: HTTP/2 401 (ou 200 se sem autenticação)
   ```

2. **Check URL no app:**
   ```bash
   cd mobile-app
   grep -n "codespaces\|app.github.dev" lib/config/app_config.dart
   # Deve mostrar sua URL configurada
   ```

3. **Inicie o app:**
   ```bash
   flutter run
   # Procure por "API URL:" no output
   ```

4. **Monitor logs:**
   ```
   flutter logs
   # Procure por "[GameVault API]" para ver requests/responses
   ```

---

## 📚 Referências

- [AppConfig Class](./mobile-app/lib/config/app_config.dart)
- [API Service](./mobile-app/lib/services/api_service.dart)
- [Backend API Docs](./backend/README_API.md)
- [GitHub Codespaces Port Forwarding](https://docs.github.com/en/codespaces/developing-in-codespaces/forwarding-ports-in-your-codespace)

---

**Última atualização:** 26 de Março de 2026
