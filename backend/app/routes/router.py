from fastapi import APIRouter, HTTPException, status, Body, Query, Depends
from typing import List, Optional
from app.models.models import ItemCreate, ItemUpdate, ItemInDB, StockTransactionCreate, StockTransactionUpdate, StockTransactionInDB, StockTransactionType
from app.services.service import ItemService, StockTransactionService
from bson import ObjectId
from datetime import datetime
from app.routes.auth import router as auth_router
from app.utils.auth_dependencies import get_current_user_id

router = APIRouter()

# Include auth router with the correct prefix
router.include_router(auth_router, prefix="/auth", tags=["auth"])

@router.get("/items/", response_description="List all items", response_model=List[ItemInDB])
async def get_items(skip: int = Query(0), limit: int = Query(100)):
    items = await ItemService.get_all(skip, limit)
    # Convert MongoDB documents to Pydantic models
    return [
        ItemInDB(
            id=str(item["_id"]),
            **{k: v for k, v in item.items() if k != "_id"}
        ) 
        for item in items
    ]

@router.get("/items/my", response_description="Get items for current user", response_model=List[ItemInDB])
async def get_my_items(
    current_user_id: str = Depends(get_current_user_id),
    skip: int = Query(0),
    limit: int = Query(100),
    search: Optional[str] = Query(None, description="Search term for title and description"),
    sort_by: Optional[str] = Query("title", description="Field to sort by"),
    sort_order: Optional[str] = Query("asc", description="Sort order: asc or desc"),
    category: Optional[str] = Query(None, description="Filter by category"),
    distributer: Optional[str] = Query(None, description="Filter by distributor"),
    min_stock: Optional[int] = Query(None, description="Minimum stock level"),
    max_stock: Optional[int] = Query(None, description="Maximum stock level"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price")
):
    """
    Get items for the current authenticated user with optional search, sorting, and filtering.
    This endpoint uses optimized queries with database indexes.
    """
    
    # Determine sort order
    sort_order_int = 1 if sort_order.lower() == "asc" else -1
    
    try:
        if search:
            # Use text search
            items = await ItemService.search_user_items(current_user_id, search, skip, limit)
        elif any([category, distributer, min_stock, max_stock, min_price, max_price]):
            # Use filtering
            items = await ItemService.filter_user_items(
                user_id=current_user_id,
                category=category,
                distributer=distributer,
                min_stock=min_stock,
                max_stock=max_stock,
                min_price=min_price,
                max_price=max_price,
                skip=skip,
                limit=limit
            )
        else:
            # Use sorting
            items = await ItemService.get_user_items_sorted(
                user_id=current_user_id,
                sort_field=sort_by,
                sort_order=sort_order_int,
                skip=skip,
                limit=limit
            )
        
        return [
            ItemInDB(
                id=str(item["_id"]),
                **{k: v for k, v in item.items() if k != "_id"}
            ) 
            for item in items
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching items: {str(e)}")

@router.get("/items/count", response_description="Get item count for current user")
async def get_my_item_count(current_user_id: str = Depends(get_current_user_id)):
    """Get total number of items for the current user"""
    try:
        count = await ItemService.get_user_item_count(current_user_id)
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error counting items: {str(e)}")

@router.get("/users/{user_id}/items/count", response_description="Get item count for user")
async def get_user_item_count(user_id: str):
    """Get total number of items for a user"""
    try:
        count = await ItemService.get_user_item_count(user_id)
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error counting items: {str(e)}")

@router.get("/items/low-stock", response_description="Get low stock items for current user", response_model=List[ItemInDB])
async def get_my_low_stock_items(
    current_user_id: str = Depends(get_current_user_id),
    default_threshold: int = Query(10, description="Default stock threshold for items without custom threshold")
):
    """Get items with stock below their individual threshold (or default) for current user"""
    try:
        items = await ItemService.get_low_stock_items(current_user_id, default_threshold)
        return [
            ItemInDB(
                id=str(item["_id"]),
                **{k: v for k, v in item.items() if k != "_id"}
            ) 
            for item in items
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching low stock items: {str(e)}")

@router.get("/users/{user_id}/items/low-stock", response_description="Get low stock items", response_model=List[ItemInDB])
async def get_low_stock_items(
    user_id: str,
    default_threshold: int = Query(10, description="Default stock threshold for items without custom threshold")
):
    """Get items with stock below their individual threshold (or default)"""
    try:
        items = await ItemService.get_low_stock_items(user_id, default_threshold)
        return [
            ItemInDB(
                id=str(item["_id"]),
                **{k: v for k, v in item.items() if k != "_id"}
            ) 
            for item in items
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching low stock items: {str(e)}")

@router.get("/categories", response_description="Get categories for current user")
async def get_my_categories(current_user_id: str = Depends(get_current_user_id)):
    """Get distinct categories for the current user's items"""
    try:
        categories = await ItemService.get_categories_for_user(current_user_id)
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")

@router.get("/users/{user_id}/categories", response_description="Get categories for user")
async def get_user_categories(user_id: str):
    """Get distinct categories for a user's items"""
    try:
        categories = await ItemService.get_categories_for_user(user_id)
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")

@router.get("/distributors", response_description="Get distributors for current user")
async def get_my_distributors(current_user_id: str = Depends(get_current_user_id)):
    """Get distinct distributors for the current user's items"""
    try:
        distributors = await ItemService.get_distributors_for_user(current_user_id)
        return {"distributors": distributors}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching distributors: {str(e)}")

@router.get("/users/{user_id}/distributors", response_description="Get distributors for user")
async def get_user_distributors(user_id: str):
    """Get distinct distributors for a user's items"""
    try:
        distributors = await ItemService.get_distributors_for_user(user_id)
        return {"distributors": distributors}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching distributors: {str(e)}")

@router.get("/items/{id}", response_description="Get a single item", response_model=ItemInDB)
async def get_item(id: str):
    item = await ItemService.get_by_id(id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"Item with ID {id} not found")
    return ItemInDB(
        id=str(item["_id"]),
        **{k: v for k, v in item.items() if k != "_id"}
    )

@router.get("/items/barcode/{barcode}", response_description="Get item by barcode", response_model=ItemInDB)
async def get_item_by_barcode(barcode: str):
    """Get item by barcode (uses unique barcode index)"""
    item = await ItemService.get_by_barcode(barcode)
    if item is None:
        raise HTTPException(status_code=404, detail=f"Item with barcode {barcode} not found")
    return ItemInDB(
        id=str(item["_id"]),
        **{k: v for k, v in item.items() if k != "_id"}
    )

@router.post("/items/", response_description="Create a new item", response_model=ItemInDB, status_code=status.HTTP_201_CREATED)
async def create_item(
    item: ItemCreate = Body(...),
    current_user_id: str = Depends(get_current_user_id)
):
    item_dict = item.model_dump()  # Changed from dict() to model_dump()
    
    # Set the associatedUser to the current authenticated user
    item_dict["associatedUser"] = current_user_id
    
    # Always generate a barcode for new items
    from app.utils.barcode_generator import generate_unique_barcode
    item_dict["barcode"] = generate_unique_barcode()
    
    new_item = await ItemService.create(item_dict)
    
    # Convert the MongoDB document to your Pydantic model
    created_item = ItemInDB(
        id=str(new_item["_id"]),  # Convert ObjectId to string
        **{k: v for k, v in new_item.items() if k != "_id"}
    )
    return created_item

@router.put("/items/{id}", response_description="Update an item", response_model=ItemInDB)
async def update_item(
    id: str, 
    item: ItemUpdate = Body(...),
    current_user_id: str = Depends(get_current_user_id)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    # Check if the item belongs to the current user
    existing_item = await ItemService.get_by_id(id)
    if existing_item is None:
        raise HTTPException(status_code=404, detail=f"Item with ID {id} not found")
    
    if existing_item["associatedUser"] != current_user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to update this item")
    
    item_dict = {k: v for k, v in item.model_dump().items() if v is not None}
    if not item_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    updated_item = await ItemService.update(id, item_dict)
    if updated_item is None:
        raise HTTPException(status_code=404, detail=f"Item with ID {id} not found")
    
    # Convert the MongoDB document to your Pydantic model
    return ItemInDB(
        id=str(updated_item["_id"]),  # Convert ObjectId to string
        **{k: v for k, v in updated_item.items() if k != "_id"}
    )

@router.delete("/items/{id}", response_description="Delete an item")
async def delete_item(
    id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    # Check if the item belongs to the current user
    existing_item = await ItemService.get_by_id(id)
    if existing_item is None:
        raise HTTPException(status_code=404, detail=f"Item with ID {id} not found")
    
    if existing_item["associatedUser"] != current_user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this item")
    
    deleted = await ItemService.delete(id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Item with ID {id} not found")
    return {"detail": "Item deleted successfully"}

# QR Code related endpoints
@router.get("/items/{id}/qrcode", response_description="Generate QR code for an item")
async def generate_item_qr_code(
    id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Generate a QR code for a specific item"""
    # Check if the item exists and belongs to the current user
    item = await ItemService.get_by_id(id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"Item with ID {id} not found")
    
    if item["associatedUser"] != current_user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to access this item")
    
    try:
        from app.utils.qr_generator import generate_product_qr_code
        qr_code_data = generate_product_qr_code(id, item.get("barcode"))
        
        return {
            "item_id": id,
            "barcode": item.get("barcode"),
            "qr_code": qr_code_data,
            "title": item.get("title"),
            "description": item.get("description")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating QR code: {str(e)}")

@router.get("/items/barcode/{barcode}/qrcode", response_description="Generate QR code for barcode")
async def generate_barcode_qr_code(barcode: str):
    """Generate a simple QR code containing just the barcode"""
    try:
        from app.utils.qr_generator import generate_simple_barcode_qr
        qr_code_data = generate_simple_barcode_qr(barcode)
        
        return {
            "barcode": barcode,
            "qr_code": qr_code_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating QR code: {str(e)}")

@router.post("/items/qr-scan", response_description="Process scanned QR code data")
async def process_qr_scan(
    qr_data: str = Body(..., embed=True),
    current_user_id: str = Depends(get_current_user_id)
):
    """Process scanned QR code data and return item information"""
    try:
        import json
        
        # Try to parse as JSON first (for product QR codes)
        try:
            parsed_data = json.loads(qr_data.replace("'", '"'))
            
            # Check if it's a product QR code
            if parsed_data.get("type") == "product":
                item_id = parsed_data.get("id")
                if item_id:
                    # Get item by ID
                    item = await ItemService.get_by_id(item_id)
                    if item:
                        return {
                            "type": "product",
                            "item": ItemInDB(
                                id=str(item["_id"]),
                                **{k: v for k, v in item.items() if k != "_id"}
                            ),
                            "message": "Produto encontrado!"
                        }
            
            # Check if it has a barcode field
            barcode = parsed_data.get("barcode")
            if barcode:
                item = await ItemService.get_by_barcode(barcode)
                if item:
                    return {
                        "type": "barcode",
                        "item": ItemInDB(
                            id=str(item["_id"]),
                            **{k: v for k, v in item.items() if k != "_id"}
                        ),
                        "message": "Produto encontrado pelo código de barras!"
                    }
        
        except json.JSONDecodeError:
            # If not JSON, treat as plain barcode
            pass
        
        # Try to find item by barcode (plain text)
        item = await ItemService.get_by_barcode(qr_data)
        if item:
            return {
                "type": "barcode",
                "item": ItemInDB(
                    id=str(item["_id"]),
                    **{k: v for k, v in item.items() if k != "_id"}
                ),
                "message": "Produto encontrado pelo código de barras!"
            }
        
        # If no item found, return the raw data for manual processing
        return {
            "type": "unknown",
            "data": qr_data,
            "message": "QR Code escaneado, mas nenhum produto encontrado. Deseja criar um novo produto?"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing QR code: {str(e)}")

@router.post("/items/create-from-qr", response_description="Create item from QR scan", response_model=ItemInDB)
async def create_item_from_qr(
    item_data: ItemCreate = Body(...),
    qr_data: Optional[str] = Body(None),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Create an item from QR scan data.
    This endpoint combines item creation with QR code processing.
    
    Args:
        item_data: Item data to create
        qr_data: Optional QR code data for additional processing
        current_user_id: Current authenticated user ID
    
    Returns:
        Created item with all details
    """
    try:
        # Set the associated user
        item_dict = item_data.model_dump()
        item_dict["associatedUser"] = current_user_id
        
        # Generate barcode if not provided
        if not item_dict.get("barcode"):
            from app.utils.barcode_generator import generate_barcode
            item_dict["barcode"] = generate_barcode()
        
        # Create the item
        created_item = await ItemService.create(item_dict)
        if not created_item:
            raise HTTPException(status_code=500, detail="Failed to create item")
        
        # Convert to response format
        return ItemInDB(
            id=str(created_item["_id"]),
            **{k: v for k, v in created_item.items() if k != "_id"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating item from QR: {str(e)}")

# Stock Transaction Routes
@router.post("/stock-transactions/", response_description="Create stock transaction", response_model=StockTransactionInDB)
async def create_stock_transaction(
    transaction: StockTransactionCreate = Body(...),
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a new stock transaction (loss, damage, or return)"""
    try:
        # Check if item exists and belongs to user
        item = await ItemService.get_by_id(transaction.item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        if item["associatedUser"] != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied to this item")
        
        # Check if there's enough stock
        if item["stock"] < transaction.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough stock. Available: {item['stock']}, Requested: {transaction.quantity}"
            )
        
        # Create transaction
        transaction_dict = transaction.model_dump()
        transaction_dict["associated_user"] = current_user_id
        
        created_transaction = await StockTransactionService.create_transaction(transaction_dict)
        if not created_transaction:
            raise HTTPException(status_code=500, detail="Failed to create transaction")
        
        return StockTransactionInDB(
            id=str(created_transaction["_id"]),
            **{k: v for k, v in created_transaction.items() if k != "_id"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating stock transaction: {str(e)}")

@router.get("/stock-transactions/", response_description="Get stock transactions", response_model=List[StockTransactionInDB])
async def get_stock_transactions(
    current_user_id: str = Depends(get_current_user_id),
    transaction_type: Optional[StockTransactionType] = Query(None, description="Filter by transaction type"),
    item_id: Optional[str] = Query(None, description="Filter by item ID"),
    skip: int = Query(0, description="Number of transactions to skip"),
    limit: int = Query(100, description="Maximum number of transactions to return")
):
    """Get stock transactions for the current user"""
    try:
        transactions = await StockTransactionService.get_transactions(
            user_id=current_user_id,
            transaction_type=transaction_type.value if transaction_type else None,
            item_id=item_id,
            skip=skip,
            limit=limit
        )
        
        return [
            StockTransactionInDB(
                id=str(transaction["_id"]),
                **{k: v for k, v in transaction.items() if k != "_id"}
            )
            for transaction in transactions
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock transactions: {str(e)}")

@router.get("/stock-transactions/count", response_description="Get stock transaction count")
async def get_stock_transaction_count(
    current_user_id: str = Depends(get_current_user_id),
    transaction_type: Optional[StockTransactionType] = Query(None, description="Filter by transaction type"),
    item_id: Optional[str] = Query(None, description="Filter by item ID")
):
    """Get count of stock transactions for the current user"""
    try:
        count = await StockTransactionService.get_transaction_count(
            user_id=current_user_id,
            transaction_type=transaction_type.value if transaction_type else None,
            item_id=item_id
        )
        return {"count": count}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error counting stock transactions: {str(e)}")

@router.get("/stock-transactions/stats", response_description="Get stock transaction statistics")
async def get_stock_transaction_stats(current_user_id: str = Depends(get_current_user_id)):
    """Get stock transaction statistics for the current user"""
    try:
        stats = await StockTransactionService.get_transaction_stats(current_user_id)
        return stats
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock transaction stats: {str(e)}")

@router.get("/stock-transactions/{transaction_id}", response_description="Get stock transaction", response_model=StockTransactionInDB)
async def get_stock_transaction(
    transaction_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get a specific stock transaction"""
    try:
        transaction = await StockTransactionService.get_transaction_by_id(transaction_id)
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        if transaction["associated_user"] != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied to this transaction")
        
        return StockTransactionInDB(
            id=str(transaction["_id"]),
            **{k: v for k, v in transaction.items() if k != "_id"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock transaction: {str(e)}")

@router.put("/stock-transactions/{transaction_id}", response_description="Update stock transaction", response_model=StockTransactionInDB)
async def update_stock_transaction(
    transaction_id: str,
    transaction_update: StockTransactionUpdate = Body(...),
    current_user_id: str = Depends(get_current_user_id)
):
    """Update a stock transaction (only certain fields can be updated)"""
    try:
        # Check if transaction exists and belongs to user
        existing_transaction = await StockTransactionService.get_transaction_by_id(transaction_id)
        if not existing_transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        if existing_transaction["associated_user"] != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied to this transaction")
        
        # Update transaction
        update_data = {k: v for k, v in transaction_update.model_dump().items() if v is not None}
        updated_transaction = await StockTransactionService.update_transaction(transaction_id, update_data)
        
        if not updated_transaction:
            raise HTTPException(status_code=500, detail="Failed to update transaction")
        
        return StockTransactionInDB(
            id=str(updated_transaction["_id"]),
            **{k: v for k, v in updated_transaction.items() if k != "_id"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating stock transaction: {str(e)}")