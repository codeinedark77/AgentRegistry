import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt
from app.config import get_settings
from app.schemas.token import TokenPayload

import logging

settings = get_settings()
logger = logging.getLogger(__name__)

# ── Password Hashing (Raw Bcrypt - No Passlib Junk) ───────────

def hash_password(plain_password: str) -> str:
    # Bcrypt requires bytes
    pwd_bytes = plain_password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        logger.warning(f"Password verification error: {e}")
        return False

# ── JWT Logic ────────────────────────────────────────────────

def create_access_token(subject: int, role: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> TokenPayload:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    return TokenPayload(
        sub=int(payload["sub"]),
        role=payload["role"],
        exp=int(payload["exp"]),
    )