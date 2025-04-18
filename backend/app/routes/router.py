from fastapi import APIRouter, HTTPException, status, Body, Query
from typing import List
from app.models.models import ItemCreate, ItemUpdate, ItemInDB
from app.services.service import ItemService
from bson import ObjectId
from datetime import datetime

router = APIRouter()

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

@router.get("/items/{id}", response_description="Get a single item", response_model=ItemInDB)
async def get_item(id: str):
    item = await ItemService.get_by_id(id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"Item with ID {id} not found")
    return ItemInDB(
        id=str(item["_id"]),
        **{k: v for k, v in item.items() if k != "_id"}
    )

@router.post("/items/", response_description="Create a new item", response_model=ItemInDB, status_code=status.HTTP_201_CREATED)
async def create_item(item: ItemCreate = Body(...)):
    item_dict = item.model_dump()  # Changed from dict() to model_dump()
    new_item = await ItemService.create(item_dict)
    
    # Convert the MongoDB document to your Pydantic model
    created_item = ItemInDB(
        id=str(new_item["_id"]),  # Convert ObjectId to string
        **{k: v for k, v in new_item.items() if k != "_id"}
    )
    return created_item

@router.put("/items/{id}", response_description="Update an item", response_model=ItemInDB)
async def update_item(id: str, item: ItemUpdate = Body(...)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
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
async def delete_item(id: str):
    deleted = await ItemService.delete(id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Item with ID {id} not found")
    return {"detail": "Item deleted successfully"}