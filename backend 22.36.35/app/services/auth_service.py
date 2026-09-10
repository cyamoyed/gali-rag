from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token


class AuthService:
    @staticmethod
    async def register(db: AsyncSession, username: str, email: str, password: str) -> User:
        existing = await db.execute(select(User).where((User.username == username) | (User.email == email)))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username or email already exists")
        user = User(username=username, email=email, password_hash=get_password_hash(password), role="user")
        db.add(user)
        await db.flush()
        return user

    @staticmethod
    async def login(db: AsyncSession, username: str, password: str) -> dict:
        result = await db.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if user.status != "active":
            raise HTTPException(status_code=403, detail="Account is disabled")
        token = create_access_token(data={"sub": str(user.id)})
        return {"access_token": token, "user": user}
