from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import logging
from app.models.schemas import HealthResponse, SearchResponse, CrawlResponse, SearchResult
from app.services.search import search_service
from app.services.hybrid_search import hybrid_search_service
from app.services.crawler import wikipedia_crawler
from app.services.indexer import indexer
from app.db.supabase_client import supabase_client
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/healthz", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    try:
        # Check database connection
        doc_count = supabase_client.get_document_count()
        return HealthResponse(status="ok")
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")


@router.get("/search", response_model=List[SearchResult])
async def search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(default=10, ge=1, le=settings.MAX_SEARCH_LIMIT, description="Number of results"),
    offset: int = Query(default=0, ge=0, description="Pagination offset")
):
    """
    Search for documents using the query.
    
    Supports wildcard patterns:
    - Prefix: comput*
    - Suffix: *ing
    - Single character: te?t
    """
    try:
        if not q or not q.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        results = search_service.search(query=q, limit=limit, offset=offset)
        return results
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/search-hybrid", response_model=List[SearchResult])
async def hybrid_search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(default=10, ge=1, le=settings.MAX_SEARCH_LIMIT, description="Number of results"),
    offset: int = Query(default=0, ge=0, description="Pagination offset")
):
    """
    Hybrid search: checks document cache first, falls back to database if needed.
    
    This endpoint is faster for frequently searched terms as it searches
    within the local cache first before querying the database.
    """
    try:
        if not q or not q.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        results = hybrid_search_service.hybrid_search(query=q, limit=limit, offset=offset)
        return results
        
    except Exception as e:
        logger.error(f"Hybrid search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/crawl/start", response_model=CrawlResponse)
async def start_crawler():
    """
    Start the Wikipedia crawler to fetch and index documents.
    
    This will:
    1. Fetch random Wikipedia pages
    2. Store them in the database
    3. Build the inverted index
    """
    try:
        logger.info("Starting crawler")
        
        # Crawl documents
        crawled_count = wikipedia_crawler.crawl_documents(limit=settings.MAX_DOCUMENTS)
        
        if crawled_count == 0:
            return CrawlResponse(
                status="completed",
                documents_crawled=0,
                message="No new documents were crawled"
            )
        
        # Build index
        logger.info("Building inverted index")
        documents = supabase_client.get_all_documents()
        indexer.build_index_from_documents(documents)
        
        # Save index to database
        indexer.save_index_to_database()
        
        return CrawlResponse(
            status="completed",
            documents_crawled=crawled_count,
            message=f"Successfully crawled and indexed {crawled_count} documents"
        )
        
    except Exception as e:
        logger.error(f"Crawler error: {e}")
        raise HTTPException(status_code=500, detail=f"Crawler failed: {str(e)}")


@router.get("/stats")
async def get_stats():
    """Get statistics about the indexed documents."""
    try:
        doc_count = supabase_client.get_document_count()
        terms = supabase_client.get_all_terms()
        
        return {
            "total_documents": doc_count,
            "total_terms": len(terms),
            "max_documents": settings.MAX_DOCUMENTS
        }
        
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")


@router.post("/index/rebuild")
async def rebuild_index():
    """
    Rebuild the inverted index from existing documents.
    """
    try:
        logger.info("Rebuilding inverted index")
        
        # Clear existing index
        indexer.clear_index()
        supabase_client.clear_index()
        
        # Fetch all documents
        documents = supabase_client.get_all_documents()
        
        if not documents:
            return {"status": "completed", "message": "No documents to index"}
        
        # Build index
        indexer.build_index_from_documents(documents)
        
        # Save index to database
        indexer.save_index_to_database()
        
        return {
            "status": "completed",
            "message": f"Index rebuilt for {len(documents)} documents"
        }
        
    except Exception as e:
        logger.error(f"Index rebuild error: {e}")
        raise HTTPException(status_code=500, detail=f"Index rebuild failed: {str(e)}")
