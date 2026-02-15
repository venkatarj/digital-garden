# Authentication System - Deployment Guide

## Quick Start

### 1. Generate JWT Secret (Already Done ✅)

Your JWT secret has been generated and added to `backend/.env`:
```
JWT_SECRET=6PuTtmPiVVkUFtUjykFtXViahDqazI0BzaPpXb5ObNs
```

### 2. Deploy to Production

```bash
./deploy.sh
```

### 3. Set Up Production Environment

SSH into your server:
```bash
ssh venkatarohithj@34.60.230.204
```

Create/update the `.env` file in the production directory:
```bash
cd ~/digital-garden

# Generate a NEW JWT secret for production (different from dev)
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Create .env file
cat > .env << 'EOF'
APP_PASSWORD=your-app-password
POSTGRES_PASSWORD=your-postgres-password
JWT_SECRET=<paste-generated-secret-here>
JWT_EXPIRE_MINUTES=10080
EOF
```

### 4. Run Migration Script

Still on the server, run the migration to create default user and assign existing data:

```bash
cd ~/digital-garden
docker compose -f docker-compose.prod.yml exec backend python migrate_existing_data.py
```

This will output:
```
============================================================
Life OS - Data Migration Script
============================================================

Creating database tables...
✓ Database tables ready

Step 1: Creating default user...
✓ Created default user: admin@lifeos.local
  Password: changeme123
  ⚠️  IMPORTANT: Change this password after logging in!

Step 2: Migrating existing data...
✓ Migrated X entries
✓ Migrated X habits
✓ Migrated X reminders

============================================================
✓ Migration completed successfully!
  Total items migrated: X
  
Next steps:
  1. Log in with email: admin@lifeos.local
  2. Change your password immediately
  3. Create additional user accounts as needed
============================================================
```

### 5. Test the Authentication

1. **Visit your site** (e.g., http://34.60.230.204 or your domain)
2. **Login with default credentials:**
   - Email: `admin@lifeos.local`
   - Password: `changeme123`
3. **Change password immediately:**
   - Click "Forgot password?"
   - Enter `admin@lifeos.local`
   - Copy the reset link from the response (dev mode)
   - Set a new secure password

### 6. Create Your Personal Account

1. Click "Create account" on login page
2. Enter your email and password
3. You'll be automatically logged in
4. All your new entries will be associated with your account

## Verification Checklist

- [ ] JWT_SECRET is set in production `.env`
- [ ] Migration script ran successfully
- [ ] Can login with default credentials
- [ ] Default password has been changed
- [ ] Can register new account
- [ ] Can login with new account
- [ ] Entries are user-specific (create entry, logout, login as different user - shouldn't see first user's entries)
- [ ] Forgot password flow works
- [ ] Reset password flow works

## Troubleshooting

### Migration script fails

If the migration script fails, you can run it manually:

```bash
# SSH into server
ssh venkatarohithj@34.60.230.204

# Access backend container
cd ~/digital-garden
docker compose -f docker-compose.prod.yml exec backend bash

# Inside container, run migration
python migrate_existing_data.py
```

### Can't login after deployment

1. Check backend logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs backend
   ```

2. Verify JWT_SECRET is set:
   ```bash
   docker compose -f docker-compose.prod.yml exec backend env | grep JWT
   ```

3. Check database connection:
   ```bash
   docker compose -f docker-compose.prod.yml exec backend python -c "from database import engine; print('DB OK')"
   ```

### "Invalid or expired token" errors

- Ensure JWT_SECRET is consistent (not changing between restarts)
- Check token expiry (default 7 days)
- Clear browser localStorage and login again

## Security Recommendations

1. **Change default credentials immediately**
2. **Use strong JWT_SECRET** (32+ characters, random)
3. **Enable HTTPS** for production (already configured with certbot)
4. **Set up email service** for password resets (currently using dev mode)
5. **Regular backups** of PostgreSQL database
6. **Monitor failed login attempts** (add rate limiting in future)

## Next Steps

After successful deployment:

1. **Set up email service** for password resets:
   - Add SendGrid or SMTP credentials to `.env`
   - Update `forgot_password` route in `main.py`
   - Remove `reset_link` from API response

2. **Add email verification** on registration

3. **Implement rate limiting** on auth endpoints

4. **Add session management UI** to view/revoke active sessions

5. **Consider 2FA** for enhanced security

## Support

For detailed implementation details, see `AUTH_IMPLEMENTATION.md`
