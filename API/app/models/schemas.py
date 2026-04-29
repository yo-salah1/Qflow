from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class DocumentBase(BaseModel):
    """Base document schema."""
    title: str
    content: str
    url: Optional[str] = None


class Document(DocumentBase):
    """Document schema with ID."""
    id: int
    
    class Config:
        from_attributes = True


class DocumentCreate(DocumentBase):
    """Schema for creating a document."""
    pass


class IndexEntry(BaseModel):
    """Inverted index entry schema."""
    term: str
    doc_id: int
    frequency: int
    positions: List[int]
    
    class Config:
        from_attributes = True


class IndexEntryCreate(BaseModel):
    """Schema for creating an index entry."""
    term: str
    doc_id: int
    frequency: int
    positions: List[int]


class SearchResult(BaseModel):
    """Search result schema."""
    doc_id: int
    title: str
    url: Optional[str] = None
    score: float
    snippet: Optional[str] = None
    highlighted_snippet: Optional[str] = None


class SearchResponse(BaseModel):
    """Search response schema."""
    results: List[SearchResult]
    total: int
    limit: int
    offset: int


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str


class CrawlResponse(BaseModel):
    """Crawler response schema."""
    status: str
    documents_crawled: Optional[int] = None
    message: Optional[str] = None


class SearchRequest(BaseModel):
    """Search request schema."""
    query: str = Field(..., min_length=1, description="Search query")
    limit: Optional[int] = Field(10, ge=1, le=100, description="Number of results to return")
    offset: Optional[int] = Field(0, ge=0, description="Offset for pagination")
