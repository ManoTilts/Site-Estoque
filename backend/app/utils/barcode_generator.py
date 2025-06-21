import uuid
import re
import random
import string
from datetime import datetime
from typing import Optional

def generate_unique_barcode():
    """
    Generates a unique barcode for an item.
    The barcode consists of a timestamp and a unique identifier.
    Format: YYYYMMDD-HHMMSS-UUID (truncated to keep reasonable length)
    """
    # Generate timestamp portion
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    
    # Generate a unique identifier (UUID) portion - using just the first 8 chars for brevity
    unique_id = str(uuid.uuid4()).split('-')[0]
    
    # Combine them to form the barcode
    barcode = f"{timestamp}-{unique_id}"
    
    return barcode

def generate_ean13():
    """
    Generates a valid EAN-13 barcode (European Article Number)
    Returns a 13-digit numeric string
    """
    # Generate first 12 digits randomly
    first_12 = ''.join([str(random.randint(0, 9)) for _ in range(12)])
    
    # Calculate check digit
    check_digit = calculate_ean13_check_digit(first_12)
    
    return first_12 + str(check_digit)

def calculate_ean13_check_digit(first_12_digits: str) -> int:
    """
    Calculate EAN-13 check digit using the standard algorithm
    """
    if len(first_12_digits) != 12:
        raise ValueError("First 12 digits must be exactly 12 characters")
    
    odd_sum = sum(int(first_12_digits[i]) for i in range(0, 12, 2))
    even_sum = sum(int(first_12_digits[i]) for i in range(1, 12, 2))
    
    total = odd_sum + (even_sum * 3)
    check_digit = (10 - (total % 10)) % 10
    
    return check_digit

def generate_simple_numeric(length: int = 8):
    """
    Generate a simple numeric barcode
    """
    return ''.join([str(random.randint(0, 9)) for _ in range(length)])

def generate_alphanumeric(length: int = 8):
    """
    Generate an alphanumeric barcode
    """
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def validate_barcode(barcode: str, barcode_type: str = "auto") -> bool:
    """
    Validate a barcode based on its type
    """
    if not barcode:
        return False
    
    if barcode_type == "ean13" or (barcode_type == "auto" and len(barcode) == 13 and barcode.isdigit()):
        return validate_ean13(barcode)
    elif barcode_type == "numeric" or (barcode_type == "auto" and barcode.isdigit()):
        return True
    elif barcode_type == "alphanumeric" or (barcode_type == "auto" and barcode.isalnum()):
        return True
    else:
        # For custom format, just check if it's not empty and has reasonable length
        return len(barcode) >= 4 and len(barcode) <= 50

def validate_ean13(barcode: str) -> bool:
    """
    Validate an EAN-13 barcode
    """
    if len(barcode) != 13 or not barcode.isdigit():
        return False
    
    try:
        calculated_check_digit = calculate_ean13_check_digit(barcode[:12])
        return int(barcode[12]) == calculated_check_digit
    except:
        return False

def generate_barcode_by_type(barcode_type: str = "unique", **kwargs) -> str:
    """
    Generate a barcode based on specified type
    
    Args:
        barcode_type: Type of barcode to generate
            - "unique": Custom unique format (default)
            - "ean13": EAN-13 format
            - "numeric": Simple numeric
            - "alphanumeric": Alphanumeric
        **kwargs: Additional parameters like length for some types
    """
    if barcode_type == "ean13":
        return generate_ean13()
    elif barcode_type == "numeric":
        length = kwargs.get("length", 8)
        return generate_simple_numeric(length)
    elif barcode_type == "alphanumeric":
        length = kwargs.get("length", 8)
        return generate_alphanumeric(length)
    else:  # Default to unique
        return generate_unique_barcode()

def is_barcode_format_valid(barcode: str) -> dict:
    """
    Analyze a barcode and return information about its format
    """
    result = {
        "valid": False,
        "type": "unknown",
        "length": len(barcode),
        "is_numeric": barcode.isdigit(),
        "is_alphanumeric": barcode.isalnum(),
        "format_info": ""
    }
    
    if not barcode:
        result["format_info"] = "Empty barcode"
        return result
    
    # Check EAN-13
    if len(barcode) == 13 and barcode.isdigit():
        if validate_ean13(barcode):
            result.update({
                "valid": True,
                "type": "ean13",
                "format_info": "Valid EAN-13 barcode"
            })
        else:
            result["format_info"] = "Invalid EAN-13 check digit"
        return result
    
    # Check custom unique format
    if re.match(r'^\d{8}-\d{6}-[a-f0-9]{8}$', barcode):
        result.update({
            "valid": True,
            "type": "unique",
            "format_info": "Custom unique format"
        })
        return result
    
    # Check if it's a simple valid barcode
    if 4 <= len(barcode) <= 50 and barcode.replace('-', '').replace('_', '').isalnum():
        result.update({
            "valid": True,
            "type": "custom",
            "format_info": "Custom format"
        })
        return result
    
    result["format_info"] = "Invalid barcode format"
    return result