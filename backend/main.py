import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import PROJECT_NAME, API_V1_STR
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.routes.router import router as api_router

# Define lifespan context manager (replacing on_event)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(title=PROJECT_NAME, lifespan=lifespan, docs_url="/docs")

# Set up CORS
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",  # React frontend default
    "http://localhost:5173",  # Vite default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router, prefix=API_V1_STR)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI MongoDB API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)