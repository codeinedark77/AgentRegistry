from app.core.security import hash_password, verify_password

def test_password_hashing():
    pwd = "securepassword123"
    hashed = hash_password(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False
