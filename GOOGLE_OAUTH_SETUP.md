# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for Life OS.

## Prerequisites

- Google account
- Project running on `localhost:5173` (frontend) and `localhost:8000` (backend)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: **Life OS** (or your preferred name)
4. Click **Create**
5. Wait for project creation, then select your new project

## Step 2: Configure OAuth Consent Screen

1. In the left sidebar, navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click **Create**
4. Fill in the required fields:
   - **App name**: Life OS
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **Save and Continue**
6. Skip **Scopes** (click **Save and Continue**)
7. Skip **Test users** (click **Save and Continue**)
8. Review and click **Back to Dashboard**

## Step 3: Create OAuth 2.0 Credentials

1. In the left sidebar, navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application** as application type
4. Enter name: **Life OS Web Client**
5. Under **Authorized JavaScript origins**, click **Add URI** and enter:
   ```
   http://localhost:5173
   http://localhost:3000
   ```
6. Under **Authorized redirect URIs**, click **Add URI** and enter:
   ```
   http://localhost:5173
   http://localhost:3000
   ```
7. Click **Create**
8. A dialog will appear with your credentials:
   - **Client ID**: Copy this (looks like `xxx.apps.googleusercontent.com`)
   - **Client Secret**: Copy this

**⚠️ Important**: Keep these credentials secure! Don't commit them to git.

## Step 4: Configure Backend Environment Variables

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your Google OAuth credentials:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

4. Ensure other required variables are set:
   ```bash
   JWT_SECRET=your-super-secret-key-change-this-in-production
   DATABASE_URL=postgresql://postgres:postgres@db:5432/garden
   ```

## Step 5: Configure Frontend Environment Variables

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your Google Client ID:
   ```bash
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

   **Note**: Use the same Client ID as in the backend.

## Step 6: Install Dependencies

### Backend

```bash
cd backend
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Step 7: Run Database Migration

This migration adds Google OAuth fields to the database and removes password-related fields.

```bash
cd backend
python migrate_to_oauth.py
```

You'll be prompted to confirm. Type `yes` to proceed.

**Expected output:**
```
✅ Migration completed successfully!

Next steps:
1. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env
2. Set VITE_GOOGLE_CLIENT_ID in frontend/.env
3. Install frontend dependencies: cd frontend && npm install
4. Start the application and test Google Sign-In
```

## Step 8: Start the Application

### Option A: Using Docker (Recommended)

```bash
docker-compose up
```

### Option B: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Step 9: Test Google Sign-In

1. Open your browser to [http://localhost:5173](http://localhost:5173)
2. You should see the login page with a "Sign in with Google" button
3. Click the button
4. Select your Google account
5. Grant permissions
6. You should be redirected to the journal view

## Troubleshooting

### Issue: "VITE_GOOGLE_CLIENT_ID not set" error

**Solution**: Check that you created `frontend/.env` with the correct CLIENT_ID

```bash
cd frontend
cat .env
# Should show: VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Issue: "Invalid Google token" error

**Possible causes:**
- Client ID mismatch between frontend and backend
- Network issue reaching Google's servers
- Token expired (Google tokens expire in 1 hour)

**Solution**: Verify both `.env` files have the same CLIENT_ID:

```bash
# Check backend
cat backend/.env | grep GOOGLE_CLIENT_ID

# Check frontend
cat frontend/.env | grep VITE_GOOGLE_CLIENT_ID
```

### Issue: Google Sign-In button doesn't render

**Possible causes:**
- `@react-oauth/google` not installed
- Frontend not reading environment variables
- Browser console shows errors

**Solution**:
1. Install dependencies: `cd frontend && npm install`
2. Restart dev server: `npm run dev`
3. Check browser console for errors
4. Verify `frontend/.env` exists and has correct format

### Issue: "redirect_uri_mismatch" error

**Solution**: Update your Google Cloud Console authorized redirect URIs to include your current URL.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, ensure these are added:
   - `http://localhost:5173`
   - `http://localhost:3000`
5. Click **Save**

### Issue: Database migration failed

**Solution**: Restore from backup and check database connection

```bash
# Check if database is running
psql $DATABASE_URL -c "SELECT 1"

# If migration partially completed, restore from backup
psql $DATABASE_URL < backup_before_oauth.sql
```

## Production Deployment (Future)

When you deploy to production with a custom domain:

1. **Create new OAuth client** (don't reuse localhost credentials):
   - Go to Google Cloud Console → Credentials → Create Credentials
   - Add production URLs to **Authorized JavaScript origins**:
     ```
     https://yourdomain.com
     ```
   - Add production URLs to **Authorized redirect URIs**:
     ```
     https://yourdomain.com
     ```

2. **Update environment variables** with production CLIENT_ID:
   - Backend `.env`: `GOOGLE_CLIENT_ID=prod-client-id.apps.googleusercontent.com`
   - Frontend `.env`: `VITE_GOOGLE_CLIENT_ID=prod-client-id.apps.googleusercontent.com`

3. **Update OAuth Consent Screen** (if publishing publicly):
   - Verify your domain ownership
   - Add privacy policy and terms of service URLs
   - Submit for Google verification (optional, but recommended)

## Security Notes

✅ **What's secure:**
- Google handles password security
- JWT tokens are signed and verified
- Email verification handled by Google
- CORS properly configured

⚠️ **Recommendations:**
- Use HTTPS in production
- Rotate JWT_SECRET regularly
- Monitor failed authentication attempts
- Keep dependencies updated

## Support

For issues or questions:
- Check the [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md) file
- Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/

---

## Quick Reference

### Environment Variables

**Backend (.env):**
```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://postgres:postgres@db:5432/garden
```

**Frontend (.env):**
```bash
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_API_URL=http://localhost:8000
```

### Useful Commands

```bash
# Start backend
cd backend && uvicorn main:app --reload

# Start frontend
cd frontend && npm run dev

# Run migration
cd backend && python migrate_to_oauth.py

# Check database schema
psql $DATABASE_URL -c "\d users"

# Test backend endpoint
curl -X POST http://localhost:8000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential": "GOOGLE_ID_TOKEN"}'
```
