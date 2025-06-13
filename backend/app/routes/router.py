from fastapi import APIRouter, HTTPException, status, Body, Query, Depends
from typing import List, Optional
from app.models.models import ItemCreate, ItemUpdate, ItemInDB
from app.services.service import ItemService
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

@router.get("/users/{user_id}/items/", response_description="Get items for a specific user", response_model=List[ItemInDB])
async def get_user_items(
    user_id: str,
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
    Get items for a specific user with optional search, sorting, and filtering.
    This endpoint uses optimized queries with database indexes.
    """
    
    # Determine sort order
    sort_order_int = 1 if sort_order.lower() == "asc" else -1
    
    try:
        if search:
            # Use text search
            items = await ItemService.search_user_items(user_id, search, skip, limit)
        elif any([category, distributer, min_stock, max_stock, min_price, max_price]):
            # Use filtering
            items = await ItemService.filter_user_items(
                user_id=user_id,
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
                user_id=user_id,
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
    threshold: int = Query(10, description="Stock threshold for low stock alert")
):
    """Get items with stock below the specified threshold for current user"""
    try:
        items = await ItemService.get_low_stock_items(current_user_id, threshold)
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
    threshold: int = Query(10, description="Stock threshold for low stock alert")
):
    """Get items with stock below the specified threshold"""
    try:
        items = await ItemService.get_low_stock_items(user_id, threshold)
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