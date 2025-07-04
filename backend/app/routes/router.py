from fastapi import APIRouter, HTTPException, status, Body, Query, Depends
from typing import List, Optional
from app.models.models import ItemCreate, ItemUpdate, ItemInDB, StockTransactionCreate, StockTransactionUpdate, StockTransactionInDB, StockTransactionType, ActivityLogInDB, ActivityType
from app.services.service import ItemService, StockTransactionService, ActivityLogService
from bson import ObjectId
from datetime import datetime
from app.routes.auth import router as auth_router
from app.utils.auth_dependencies import get_current_user_id
from app.utils.units import get_all_units, get_units_by_category, get_unit_categories
from fastapi.responses import StreamingResponse
import pandas as pd
import io
from datetime import datetime

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
    
    # Log activity
    await ActivityLogService.log_activity({
        "user_id": current_user_id,
        "activity_type": ActivityType.ITEM_CREATED,
        "description": f"Produto '{item_dict['title']}' foi criado",
        "entity_id": str(new_item["_id"]),
        "entity_type": "item",
        "metadata": {
            "item_title": item_dict["title"],
            "stock": item_dict["stock"],
            "barcode": item_dict["barcode"]
        }
    })
    
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
    
    # Log activity
    updated_fields = list(item_dict.keys())
    await ActivityLogService.log_activity({
        "user_id": current_user_id,
        "activity_type": ActivityType.ITEM_UPDATED,
        "description": f"Produto '{existing_item['title']}' foi atualizado",
        "entity_id": id,
        "entity_type": "item",
        "metadata": {
            "item_title": existing_item["title"],
            "updated_fields": updated_fields,
            "changes": item_dict
        }
    })
    
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
    
    # Log activity
    await ActivityLogService.log_activity({
        "user_id": current_user_id,
        "activity_type": ActivityType.ITEM_DELETED,
        "description": f"Produto '{existing_item['title']}' foi deletado",
        "entity_id": id,
        "entity_type": "item",
        "metadata": {
            "item_title": existing_item["title"],
            "barcode": existing_item.get("barcode")
        }
    })
    
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
        
        # Log activity
        await ActivityLogService.log_activity({
            "user_id": current_user_id,
            "activity_type": ActivityType.STOCK_TRANSACTION,
            "description": f"Transação de estoque '{transaction.transaction_type}' criada para produto '{item['title']}'",
            "entity_id": str(created_transaction["_id"]),
            "entity_type": "stock_transaction",
            "metadata": {
                "item_title": item["title"],
                "item_id": transaction.item_id,
                "transaction_type": transaction.transaction_type,
                "quantity": transaction.quantity,
                "reason": transaction.reason
            }
        })
        
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

# Activity Log Routes
@router.get("/activity-logs/", response_description="Get activity logs", response_model=List[ActivityLogInDB])
async def get_activity_logs(
    current_user_id: str = Depends(get_current_user_id),
    activity_type: Optional[ActivityType] = Query(None, description="Filter by activity type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    skip: int = Query(0, description="Number of activities to skip"),
    limit: int = Query(100, description="Maximum number of activities to return")
):
    """Get activity logs for the current user"""
    try:
        activities = await ActivityLogService.get_user_activities(
            user_id=current_user_id,
            activity_type=activity_type.value if activity_type else None,
            entity_type=entity_type,
            skip=skip,
            limit=limit
        )
        
        return [
            ActivityLogInDB(
                id=str(activity["_id"]),
                **{k: v for k, v in activity.items() if k != "_id"}
            )
            for activity in activities
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activity logs: {str(e)}")

@router.get("/activity-logs/count", response_description="Get activity log count")
async def get_activity_log_count(
    current_user_id: str = Depends(get_current_user_id),
    activity_type: Optional[ActivityType] = Query(None, description="Filter by activity type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type")
):
    """Get count of activity logs for the current user"""
    try:
        count = await ActivityLogService.get_activity_count(
            user_id=current_user_id,
            activity_type=activity_type.value if activity_type else None,
            entity_type=entity_type
        )
        return {"count": count}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error counting activity logs: {str(e)}")

@router.get("/activity-logs/recent", response_description="Get recent activity logs", response_model=List[ActivityLogInDB])
async def get_recent_activity_logs(
    current_user_id: str = Depends(get_current_user_id),
    limit: int = Query(20, description="Maximum number of recent activities to return")
):
    """Get recent activity logs for the current user"""
    try:
        activities = await ActivityLogService.get_recent_activities(current_user_id, limit)
        
        return [
            ActivityLogInDB(
                id=str(activity["_id"]),
                **{k: v for k, v in activity.items() if k != "_id"}
            )
            for activity in activities
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recent activity logs: {str(e)}")

@router.get("/activity-logs/stats", response_description="Get activity log statistics")
async def get_activity_log_stats(current_user_id: str = Depends(get_current_user_id)):
    """Get activity log statistics for the current user"""
    try:
        stats = await ActivityLogService.get_activity_stats(current_user_id)
        return stats
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activity log stats: {str(e)}")

# Export Routes
@router.get("/export/items", response_description="Export user items to Excel")
async def export_user_items_to_excel(
    current_user_id: str = Depends(get_current_user_id),
    category: Optional[str] = Query(None, description="Filter by category"),
    distributer: Optional[str] = Query(None, description="Filter by distributor"),
    low_stock_only: bool = Query(False, description="Export only low stock items")
):
    """Export user's items to Excel with optional filtering"""
    try:
        if low_stock_only:
            items = await ItemService.get_low_stock_items(current_user_id)
        elif category or distributer:
            items = await ItemService.filter_user_items(
                user_id=current_user_id,
                category=category,
                distributer=distributer
            )
        else:
            items = await ItemService.get_by_user(current_user_id)
        
        if not items:
            raise HTTPException(status_code=404, detail="No items found")
        
        # Prepare data for Excel export
        export_data = []
        for item in items:
            export_data.append({
                'ID': str(item.get('_id', '')),
                'Nome': item.get('title', ''),
                'Descrição': item.get('description', ''),
                'Categoria': item.get('category', ''),
                'Fornecedor': item.get('distributer', ''),
                'Unidade': item.get('unit', ''),
                'Estoque': item.get('stock', 0),
                'Estoque Mínimo': item.get('low_stock_threshold', 10),
                'Preço de Compra': item.get('purchase_price', 0),
                'Preço de Venda': item.get('sell_price', 0),
                'Código de Barras': item.get('barcode', ''),
                'Valor Total': (item.get('sell_price', 0) or item.get('purchase_price', 0)) * item.get('stock', 0),
                'Status Estoque': 'Baixo' if item.get('stock', 0) <= item.get('low_stock_threshold', 10) else 'Normal',
                'Criado em': item.get('created_at', '').strftime('%d/%m/%Y %H:%M') if item.get('created_at') else '',
                'Atualizado em': item.get('updated_at', '').strftime('%d/%m/%Y %H:%M') if item.get('updated_at') else ''
            })
        
        # Create DataFrame
        df = pd.DataFrame(export_data)
        
        # Generate Excel file
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Produtos', index=False)
            
            # Get the workbook and worksheet
            workbook = writer.book
            worksheet = writer.sheets['Produtos']
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        filename = f"produtos_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.xlsx"
        if low_stock_only:
            filename = f"produtos_estoque_baixo_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.xlsx"
        
        return StreamingResponse(
            io.BytesIO(output.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting items to Excel: {str(e)}")

@router.get("/export/stock-transactions", response_description="Export stock transactions to Excel")
async def export_stock_transactions_to_excel(
    current_user_id: str = Depends(get_current_user_id),
    transaction_type: Optional[StockTransactionType] = Query(None, description="Filter by transaction type"),
    item_id: Optional[str] = Query(None, description="Filter by item ID")
):
    """Export user's stock transactions to Excel"""
    try:
        transactions = await StockTransactionService.get_transactions(
            user_id=current_user_id,
            transaction_type=transaction_type.value if transaction_type else None,
            item_id=item_id
        )
        
        if not transactions:
            raise HTTPException(status_code=404, detail="No transactions found")
        
        # Prepare data for Excel export
        export_data = []
        for transaction in transactions:
            # Get item details
            item = await ItemService.get_by_id(transaction.get('item_id', ''))
            item_name = item.get('title', 'Item não encontrado') if item else 'Item não encontrado'
            
            export_data.append({
                'ID': str(transaction.get('_id', '')),
                'Produto': item_name,
                'Tipo': transaction.get('transaction_type', '').upper(),
                'Quantidade': transaction.get('quantity', 0),
                'Motivo': transaction.get('reason', ''),
                'Observações': transaction.get('notes', ''),
                'Impacto Financeiro': transaction.get('cost_impact', 0),
                'Número de Referência': transaction.get('reference_number', ''),
                'Data': transaction.get('created_at', '').strftime('%d/%m/%Y %H:%M') if transaction.get('created_at') else ''
            })
        
        # Create DataFrame
        df = pd.DataFrame(export_data)
        
        # Generate Excel file
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Transações de Estoque', index=False)
            
            # Get the workbook and worksheet
            workbook = writer.book
            worksheet = writer.sheets['Transações de Estoque']
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        filename = f"transacoes_estoque_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.xlsx"
        
        return StreamingResponse(
            io.BytesIO(output.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting stock transactions to Excel: {str(e)}")

@router.get("/export/activity-logs", response_description="Export activity logs to Excel")
async def export_activity_logs_to_excel(
    current_user_id: str = Depends(get_current_user_id),
    activity_type: Optional[ActivityType] = Query(None, description="Filter by activity type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type")
):
    """Export user's activity logs to Excel"""
    try:
        activities = await ActivityLogService.get_user_activities(
            user_id=current_user_id,
            activity_type=activity_type.value if activity_type else None,
            entity_type=entity_type
        )
        
        if not activities:
            raise HTTPException(status_code=404, detail="No activities found")
        
        # Prepare data for Excel export
        export_data = []
        for activity in activities:
            export_data.append({
                'ID': str(activity.get('_id', '')),
                'Tipo de Atividade': activity.get('activity_type', '').replace('_', ' ').title(),
                'Descrição': activity.get('description', ''),
                'Entidade ID': activity.get('entity_id', ''),
                'Tipo de Entidade': activity.get('entity_type', ''),
                'IP': activity.get('ip_address', ''),
                'User Agent': activity.get('user_agent', ''),
                'Data': activity.get('created_at', '').strftime('%d/%m/%Y %H:%M') if activity.get('created_at') else ''
            })
        
        # Create DataFrame
        df = pd.DataFrame(export_data)
        
        # Generate Excel file
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Histórico de Atividades', index=False)
            
            # Get the workbook and worksheet
            workbook = writer.book
            worksheet = writer.sheets['Histórico de Atividades']
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        filename = f"historico_atividades_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.xlsx"
        
        return StreamingResponse(
            io.BytesIO(output.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting activity logs to Excel: {str(e)}")

@router.get("/export/full-report", response_description="Export full inventory report to Excel")
async def export_full_inventory_report(
    current_user_id: str = Depends(get_current_user_id)
):
    """Export comprehensive inventory report with multiple sheets to Excel"""
    try:
        # Get all data
        items = await ItemService.get_by_user(current_user_id)
        transactions = await StockTransactionService.get_transactions(user_id=current_user_id)
        activities = await ActivityLogService.get_user_activities(user_id=current_user_id, limit=1000)
        low_stock_items = await ItemService.get_low_stock_items(current_user_id)
        
        # Generate Excel file with multiple sheets
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            
            # Sheet 1: Products Overview
            if items:
                products_data = []
                for item in items:
                    products_data.append({
                        'Nome': item.get('title', ''),
                        'Categoria': item.get('category', ''),
                        'Fornecedor': item.get('distributer', ''),
                        'Estoque': item.get('stock', 0),
                        'Preço de Venda': item.get('sell_price', 0),
                        'Valor Total': (item.get('sell_price', 0) or item.get('purchase_price', 0)) * item.get('stock', 0)
                    })
                
                df_products = pd.DataFrame(products_data)
                df_products.to_excel(writer, sheet_name='Produtos', index=False)
            
            # Sheet 2: Low Stock Alert
            if low_stock_items:
                low_stock_data = []
                for item in low_stock_items:
                    low_stock_data.append({
                        'Nome': item.get('title', ''),
                        'Estoque Atual': item.get('stock', 0),
                        'Estoque Mínimo': item.get('low_stock_threshold', 10),
                        'Categoria': item.get('category', ''),
                        'Fornecedor': item.get('distributer', '')
                    })
                
                df_low_stock = pd.DataFrame(low_stock_data)
                df_low_stock.to_excel(writer, sheet_name='Estoque Baixo', index=False)
            
            # Sheet 3: Transaction Summary
            if transactions:
                transaction_summary = {}
                for transaction in transactions:
                    trans_type = transaction.get('transaction_type', 'unknown')
                    if trans_type not in transaction_summary:
                        transaction_summary[trans_type] = {'count': 0, 'total_quantity': 0, 'total_cost': 0}
                    
                    transaction_summary[trans_type]['count'] += 1
                    transaction_summary[trans_type]['total_quantity'] += transaction.get('quantity', 0)
                    transaction_summary[trans_type]['total_cost'] += transaction.get('cost_impact', 0)
                
                summary_data = []
                for trans_type, data in transaction_summary.items():
                    summary_data.append({
                        'Tipo': trans_type.upper(),
                        'Quantidade de Ocorrências': data['count'],
                        'Quantidade Total': data['total_quantity'],
                        'Impacto Financeiro Total': data['total_cost']
                    })
                
                df_summary = pd.DataFrame(summary_data)
                df_summary.to_excel(writer, sheet_name='Resumo Transações', index=False)
        
        output.seek(0)
        
        filename = f"relatorio_completo_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.xlsx"
        
        return StreamingResponse(
            io.BytesIO(output.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting full report to Excel: {str(e)}")

# Units of Measurement Routes
@router.get("/units", response_description="Get all units of measurement")
async def get_units():
    """Get all available units of measurement"""
    try:
        units = get_all_units()
        return {"units": units}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching units: {str(e)}")

@router.get("/units/categories", response_description="Get unit categories")
async def get_units_categories():
    """Get all unit categories"""
    try:
        categories = get_unit_categories()
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching unit categories: {str(e)}")

@router.get("/units/category/{category}", response_description="Get units by category")
async def get_units_by_category_endpoint(category: str):
    """Get units for a specific category"""
    try:
        units = get_units_by_category(category)
        if not units:
            raise HTTPException(status_code=404, detail=f"Category '{category}' not found")
        return {"category": category, "units": units}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching units for category: {str(e)}")