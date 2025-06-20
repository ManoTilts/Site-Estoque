import qrcode
import io
import base64
from typing import Optional
from PIL import Image

def generate_qr_code(data: str, size: int = 10, border: int = 4) -> str:
    """
    Generate a QR code for the given data and return it as a base64 encoded string.
    
    Args:
        data (str): The data to encode in the QR code
        size (int): The size of each box in pixels (default: 10)
        border (int): The border size in boxes (default: 4)
        
    Returns:
        str: Base64 encoded PNG image of the QR code
    """
    try:
        # Create QR code instance
        qr = qrcode.QRCode(
            version=1,  # controls the size of the QR code
            error_correction=qrcode.constants.ERROR_CORRECT_L,  # about 7% error correction
            box_size=size,  # controls how many pixels each "box" of the QR code is
            border=border,  # controls how many boxes thick the border should be
        )
        
        # Add data to the QR code
        qr.add_data(data)
        qr.make(fit=True)
        
        # Create an image from the QR Code instance
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert PIL image to base64 string
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
        
    except Exception as e:
        print(f"Error generating QR code: {e}")
        return ""

def generate_product_qr_code(product_id: str, barcode: Optional[str] = None) -> str:
    """
    Generate a QR code for a product containing its ID and barcode.
    
    Args:
        product_id (str): The product ID
        barcode (str, optional): The product barcode
        
    Returns:
        str: Base64 encoded PNG image of the QR code
    """
    # Create JSON-like data for the QR code
    if barcode:
        qr_data = f"{{'id': '{product_id}', 'barcode': '{barcode}', 'type': 'product'}}"
    else:
        qr_data = f"{{'id': '{product_id}', 'type': 'product'}}"
    
    return generate_qr_code(qr_data)

def generate_simple_barcode_qr(barcode: str) -> str:
    """
    Generate a simple QR code containing just the barcode.
    
    Args:
        barcode (str): The barcode to encode
        
    Returns:
        str: Base64 encoded PNG image of the QR code
    """
    return generate_qr_code(barcode) 