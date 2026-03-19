# 🚀 Quick Start - Backend Configuration

## ⚡ Setup in 30 Seconds

### 1. **Verify Backend is Running**
```bash
# Terminal 1 - From the project root folder
npm install
npm run dev

# Or if using Makefile
make dev
```

You should see:
```
✓ Backend API running on http://localhost:3000
```

### 2. **Run Mobile App**
```bash
# Terminal 2 - In mobile-app folder
cd mobile-app
flutter pub get
flutter run
```

### 3. **Done! 🎉**

The app will automatically connect to `http://10.0.2.2:3000/api` (emulator) or `http://192.168.1.X:3000/api` (real device).

---

## 🔧 Configuration by Environment

### Android Emulator (Default)
✅ Already configured to connect to `http://10.0.2.2:3000/api`

### Real Device
```bash
# 1. Discover your machine's IP
ifconfig | grep inet

# 2. In lib/main.dart or settings screen, add:
AppConfig.setLocalDeviceUrl('192.168.1.100'); // Your IP

# 3. Done!
```

### iOS Simulator
```dart
AppConfig.setLocalDeviceUrl('localhost');
```

---

## 🔍 Verify Connection

```bash
# On your computer/server
curl http://localhost:3000/api/games

# Expected result:
# {"success":true,"data":{"games":[...]}}
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection refused" | Backend not running - execute `npm run dev` |
| "Network timeout" on emulator | Use `10.0.2.2` instead of `localhost` |
| "Network timeout" on real device | Check IP - use `ifconfig` |
| Outdated cache | Execute `flutter run --no-fast-start` |

---

## 📊 Check Status

```bash
# Is API working?
curl -v http://localhost:3000/api/games

# You see: "200 OK" ✅
```

---

**Ready to develop! 🚀**

For more details, see [SETUP_GUIDE.md](SETUP_GUIDE.md)
