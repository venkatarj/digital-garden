# Authentication System - Implementation Guide

## Overview

This document describes the complete authentication system implemented for Life OS, including email/password authentication, JWT tokens, and password reset functionality.

## Features Implemented

✅ **User Registration** - Email + password with validation  
✅ **Login** - Email + password authentication with JWT  
✅ **Forgot Password** - Email-based password reset flow  
✅ **Reset Password** - Secure token-based password reset  
✅ **User Isolation** - All data (entries, habits, reminders) is user-specific  
✅ **JWT Authentication** - Secure, stateless authentication  
✅ **Password Hashing** - bcrypt for secure password storage  

## Backend Changes

### 1. Dependencies Added

```txt
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
```

### 2. Database Models (`backend/models.py`)

**New Models:**
- `User` - Stores user accounts (email, password_hash, created_at)
- `PasswordResetToken` - Stores password reset tokens with expiry

**Updated Models:**
- `Entry`, `Habit`, `Reminder` - Added `user_id` foreign key (nullable for migration)

### 3. Authentication Module (`backend/auth.py`)

Provides utilities for:
- Password hashing and verification (bcrypt)
- JWT token creation and validation
- Reset token generation and verification

### 4. API Routes (`backend/main.py`)

**New Auth Routes:**
- `POST /auth/register` - Create new user account
- `POST /login` - Login with email/password (returns JWT)
- `POST /auth/login` - Alternative login endpoint
- `GET /auth/me` - Get current user info
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

**Protected Routes:**
All existing routes now require JWT authentication and filter data by `user_id`:
- `/entries/`, `/habits/`, `/reminders/`
- `/search/`, `/autotag/`

### 5. Environment Variables

Add to `.env` file:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRE_MINUTES=10080  # 7 days

# Default User (for migration)
DEFAULT_USER_EMAIL=admin@lifeos.local
DEFAULT_USER_PASSWORD=changeme123
```

## Frontend Changes

### 1. New Components

Created in `frontend/src/features/auth/`:
- `Login.jsx` - Email/password login with links to register and forgot password
- `Register.jsx` - User registration with email/password
- `ForgotPassword.jsx` - Request password reset link
- `ResetPassword.jsx` - Set new password using reset token

### 2. Updated Components

**`App.jsx`:**
- Added auth view routing (`login`, `register`, `forgot-password`, `reset-password`)
- Updated axios interceptor to send `Authorization: Bearer <token>`
- Added reset-password URL detection on mount

**`Login.jsx`:**
- Now accepts email + password (previously just password)
- Added navigation to register and forgot password
- Stores user info in localStorage

### 3. Token Management

Tokens are stored in localStorage:
```javascript
localStorage.setItem('token', jwt_token);
localStorage.setItem('user', JSON.stringify(user_data));
```

Tokens are sent in requests via axios interceptor:
```javascript
config.headers['Authorization'] = `Bearer ${token}`;
```

## Data Migration

### Running the Migration

After deploying the new code, run the migration script to assign existing data to a default user:

```bash
cd backend
python migrate_existing_data.py
```

This script will:
1. Create a default user account
2. Assign all existing entries, habits, and reminders to that user
3. Display the default credentials

**Important:** Change the default password immediately after logging in!

### Manual Migration

Alternatively, you can manually create a user and assign data:

```python
from database import SessionLocal
import models
import auth

db = SessionLocal()

# Create user
user = models.User(
    email="your@email.com",
    password_hash=auth.hash_password("your_password")
)
db.add(user)
db.commit()

# Assign existing data
db.query(models.Entry).update({"user_id": user.id})
db.query(models.Habit).update({"user_id": user.id})
db.query(models.Reminder).update({"user_id": user.id})
db.commit()
```

## Password Reset Flow

### Development/MVP (Current)

1. User enters email on forgot password page
2. Backend generates reset token and returns reset link in API response
3. Frontend displays the link (dev mode only)
4. User clicks link → redirected to reset password page
5. User enters new password → password updated

### Production (TODO)

1. User enters email on forgot password page
2. Backend generates reset token and **sends email** with reset link
3. Frontend shows generic "check your email" message
4. User clicks link in email → redirected to reset password page
5. User enters new password → password updated

**To implement email sending:**
1. Add email service (e.g., SendGrid, AWS SES, SMTP)
2. Update `forgot_password` route in `main.py` to send email
3. Remove `reset_link` from API response

## Security Features

✅ **Password Hashing** - bcrypt with automatic salt  
✅ **JWT Tokens** - Signed with secret key, includes expiry  
✅ **Reset Token Hashing** - Reset tokens are hashed before storage  
✅ **Token Expiry** - Reset tokens expire after 1 hour  
✅ **Single-Use Tokens** - Reset tokens are deleted after use  
✅ **No Email Enumeration** - Same response whether email exists or not  
✅ **User Data Isolation** - All queries filtered by user_id  

## Testing the System

### 1. Register a New User

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 2. Login

```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

Response:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "created_at": "2026-02-14T12:00:00"
  }
}
```

### 3. Access Protected Route

```bash
curl http://localhost:8000/entries/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### 4. Request Password Reset

```bash
curl -X POST http://localhost:8000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 5. Reset Password

```bash
curl -X POST http://localhost:8000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "reset_token_here", "new_password": "newpassword123"}'
```

## Troubleshooting

### "Invalid or expired token"
- Check that JWT_SECRET is set and consistent
- Verify token hasn't expired (default 7 days)
- Ensure token is being sent in Authorization header

### "User not found"
- Run migration script to assign existing data
- Verify user exists in database

### "Email already registered"
- User already has an account
- Use forgot password to reset if needed

### Reset link doesn't work
- Check token hasn't expired (1 hour limit)
- Verify token is correctly extracted from URL
- Ensure token hasn't already been used

## Next Steps

1. **Add Email Service** - Implement actual email sending for password resets
2. **Add Email Verification** - Verify email addresses on registration
3. **Add 2FA** - Two-factor authentication for enhanced security
4. **Add OAuth** - Google/GitHub login options
5. **Add Session Management** - View and revoke active sessions
6. **Add Rate Limiting** - Prevent brute force attacks
7. **Add Account Deletion** - Allow users to delete their accounts

## File Structure

```
backend/
├── auth.py                      # Auth utilities (NEW)
├── models.py                    # Updated with User model
├── main.py                      # Updated with auth routes
├── migrate_existing_data.py     # Migration script (NEW)
└── requirements.txt             # Updated dependencies

frontend/src/
├── App.jsx                      # Updated with auth routing
└── features/auth/
    ├── Login.jsx                # Updated for email/password
    ├── Register.jsx             # NEW
    ├── ForgotPassword.jsx       # NEW
    └── ResetPassword.jsx        # NEW
```

## Support

For issues or questions, refer to:
- FastAPI JWT documentation: https://fastapi.tiangolo.com/tutorial/security/
- Passlib documentation: https://passlib.readthedocs.io/
- Python-JOSE documentation: https://python-jose.readthedocs.io/
