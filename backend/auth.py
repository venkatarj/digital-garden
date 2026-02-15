"""
Authentication utilities for Google OAuth and JWT token management
"""
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
import httpx

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", str(60 * 24 * 7)))  # 7 days default

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

async def verify_google_token(token: str) -> Optional[dict]:
    """
    Verify Google ID token using Google's tokeninfo endpoint.
    Returns user info: {sub, email, email_verified, name, picture}
    """
    try:
        # Verify using Google's token info endpoint
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://oauth2.googleapis.com/tokeninfo',
                params={'id_token': token}
            )

            if response.status_code != 200:
                return None

            token_info = response.json()

            # Verify audience (client ID)
            if token_info.get('aud') != GOOGLE_CLIENT_ID:
                return None

            # Extract user info
            return {
                'sub': token_info.get('sub'),  # Google user ID
                'email': token_info.get('email'),
                'email_verified': token_info.get('email_verified') == 'true',
                'name': token_info.get('name'),
                'picture': token_info.get('picture')
            }

    except Exception as e:
        print(f"Google token verification failed: {e}")
        return None
