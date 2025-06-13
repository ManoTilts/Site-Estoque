import uuid
from datetime import datetime

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