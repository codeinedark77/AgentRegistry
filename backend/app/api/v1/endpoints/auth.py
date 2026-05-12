"""
Authentication endpoints — register, login, and token refresh.

POST /api/v1/auth/register  → Create a new user account.
POST /api/v1/auth/token     → OAuth2-compatible login; returns JWT.
GET  /api/v1/auth/me        → Return the current authenticated user.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.core.exceptions import DuplicateResourceError, InvalidCredentialsError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(payload: UserCreate, db: DbSession) -> User:
    """
    Create a new user with a bcrypt-hashed password.

    - **username**: 3–64 chars, alphanumeric + underscore only.
    - **password**: minimum 8 characters.
    - **role**: ``admin`` | ``standard`` (defaults to ``standard``).
    """
    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError as exc:
        raise DuplicateResourceError("User", "username", payload.username) from exc

    await db.refresh(user)
    return user


@router.post(
    "/token",
    response_model=Token,
    summary="OAuth2 login — returns a JWT access token",
)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DbSession,
) -> Token:
    """
    Authenticate with ``username`` / ``password`` (form-encoded).

    Returns a Bearer JWT for use in the ``Authorization`` header.
    """
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(form_data.password, user.password_hash):
        raise InvalidCredentialsError("Incorrect username or password.")

    token = create_access_token(subject=user.id, role=user.role.value)
    return Token(access_token=token)


@router.get(
    "/me",
    response_model=UserRead,
    summary="Return the current authenticated user",
)
async def get_me(current_user: CurrentUser) -> User:
    """Return the profile of the currently authenticated user."""
    return current_user