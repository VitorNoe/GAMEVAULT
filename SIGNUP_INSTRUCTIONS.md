# 📝 Sign Up Instructions for GameVault

## ✅ System Running

Backend and frontend are connected and working correctly!

- **Backend**: http://localhost:3000 ✅
- **Frontend**: http://localhost:3001 ✅
- **Database**: PostgreSQL (gamevault) ✅

---

## 📋 What to Enter in the Registration Form

When accessing http://localhost:3001/register, you will see a form with the following fields:

### 1. **Name**
- Enter your full name
- Example: `John Smith`
- Minimum of 1 character
- Required field

### 2. **Email**
- Enter a valid email address
- Example: `john@email.com`
- Must be in valid format (with @)
- Required field
- ⚠️ Cannot be repeated (each email can only register once)

### 3. **Password**
- Enter a password with at least **6 characters**
- Example: `Password123`
- Should be a secure combination
- Required field

### 4. **Confirm Password**
- Repeat the same password from the previous field
- Must be exactly equal to the "Password" field
- Required field

---

## 🔍 Practical Fill-in Example

```
Name: Maria Santos
Email: maria.santos@example.com
Password: MyPassword@123
Confirm Password: MyPassword@123
```

---

## ✨ What Happens After Registration

1. ✅ Your user is created in the database
2. ✅ A JWT token is automatically generated
3. ✅ You are authenticated and redirected to home
4. ✅ Your token is saved to localStorage
5. ✅ You can log in anytime with your email and password

---

## 🛠️ Possible Errors and Solutions

| Error | Cause | Solution |
|------|-------|--------|
| "Passwords do not match" | The passwords are not the same | Make sure both password fields are identical |
| "Password must be at least 6 characters" | Password too short | Use a password with minimum 6 characters |
| "Email already registered" | The email was already used | Use a different email |
| "Registration failed" | Error connecting with backend | Check if backend is running at http://localhost:3000 |

---

## 🔗 Testing the API Directly (Optional)

If you prefer to test the API directly from the terminal:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "email": "your@email.com",
    "password": "Password123"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": 1,
      "name": "Your Name",
      "email": "your@email.com",
      "type": "regular"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 📚 User Types

- **regular**: Normal user with limited access
- **admin**: Administrator user with full access

When registering via the form, you receive **regular** type automatically.

---

## ✅ Checklist Before Registering

- [ ] Backend running (`npm run dev` in `/backend`)
- [ ] Frontend running (`npm start` in `/frontend-web`)
- [ ] PostgreSQL database active
- [ ] Database schema created (execute `node setup-db.js`)
- [ ] Browser open at http://localhost:3001

---

**Everything is ready! You can now register a new user successfully! 🎮**
