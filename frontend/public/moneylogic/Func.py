import bcrypt
import re

def hash_password(password: str) -> bytes:
    """
    Hash a password using bcrypt with a salt.
    
    Args:
        password (str): The plain text password to hash
        
    Returns:
        bytes: The hashed password with salt
    """
    # Convert password to bytes
    password_bytes = password.encode('utf-8')
    
    # Generate salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    return hashed

def verify_password(password: str, hashed: bytes) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        password (str): The plain text password to verify
        hashed (bytes): The hashed password to check against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    # Convert password to bytes
    password_bytes = password.encode('utf-8')
    
    # Check if password matches hash
    return bcrypt.checkpw(password_bytes, hashed)

def verify_email(email: str) -> bool:
    """
    Verify if an email address is valid.
    
    Args:
        email (str): The email address to verify
        
    Returns:
        bool: True if email is valid, False otherwise
    """
    # Regular expression pattern for email validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    # Check if email matches the pattern
    return bool(re.match(pattern, email))
