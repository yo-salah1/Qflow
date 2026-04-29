from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.api.routes import router
from app.services.search import search_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="QueryFlow Search Engine API",
    description="A production-ready search engine backend with TF-IDF ranking and wildcard search support",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting QueryFlow Search Engine API")
    
    # Load inverted index into memory
    try:
        search_service.ensure_index_loaded()
        logger.info("Inverted index loaded successfully")
    except Exception as e:
        logger.warning(f"Could not load index on startup: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Shutting down QueryFlow Search Engine API")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "QueryFlow Search Engine API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
