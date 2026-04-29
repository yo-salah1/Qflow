#!/usr/bin/env python3
"""
Hybrid Search Service
Searches in document cache first, falls back to database if no results
"""

import logging
import re
from typing import List, Dict, Optional, Set, Tuple
from app.services.document_cache import document_cache
from app.services.indexer import indexer, TextPreprocessor
from app.db.supabase_client import supabase_client
from app.models.schemas import SearchResult

logger = logging.getLogger(__name__)

class HybridSearchService:
    """
    Hybrid search that checks cache first, then database
    """
    
    def __init__(self):
        self.preprocessor = TextPreprocessor()
    
    def search_in_cache(
        self, 
        query: str, 
        limit: int = 10,
        min_score_threshold: float = 0.1
    ) -> List[SearchResult]:
        """
        Search within cached documents
        Returns results if found, empty list if no good matches
        """
        try:
            # Preprocess query
            query_terms = self.preprocessor.preprocess(query)
            if not query_terms:
                logger.warning("No valid query terms after preprocessing")
                return []
            
            logger.info(f"Searching in cache for: {query_terms}")
            
            # Get all cached documents
            cached_docs = list(document_cache.documents.values())
            logger.info(f"Searching in {len(cached_docs)} cached documents")
            
            # Score each document
            scored_docs: List[Tuple[int, str, str, float]] = []
            query_set = set(query_terms)
            
            for doc in cached_docs:
                doc_id = doc.get('id')
                title = doc.get('title', '')
                content = doc.get('content', '')
                
                # Preprocess document content
                doc_terms = self.preprocessor.preprocess(title + ' ' + content)
                doc_set = set(doc_terms)
                
                # Calculate simple TF-like score
                if not doc_set:
                    continue
                
                # Count matching terms
                matches = len(query_set.intersection(doc_set))
                if matches == 0:
                    continue
                
                # Simple score: matching terms / total unique terms in doc
                score = matches / len(doc_set)
                
                # Boost score for title matches
                title_terms = set(self.preprocessor.preprocess(title))
                title_matches = len(query_set.intersection(title_terms))
                if title_matches > 0:
                    score += title_matches * 0.3  # Title match bonus
                
                if score >= min_score_threshold:
                    scored_docs.append((doc_id, title, content, score))
            
            # Sort by score descending
            scored_docs.sort(key=lambda x: x[3], reverse=True)
            
            # Take top results
            top_docs = scored_docs[:limit]
            
            if not top_docs:
                logger.info("No results found in cache, will fall back to database")
                return []
            
            logger.info(f"Found {len(top_docs)} results in cache")
            
            # Build results
            results = []
            for doc_id, title, content, score in top_docs:
                # Generate snippet
                snippet = self._generate_snippet(content, query_terms)
                
                result = SearchResult(
                    doc_id=doc_id,
                    title=title,
                    url=document_cache.documents.get(doc_id, {}).get('url'),
                    score=round(min(score, 1.0), 4),  # Cap at 1.0
                    snippet=snippet,
                    highlighted_snippet=snippet
                )
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching in cache: {e}")
            return []
    
    def search_in_database(
        self, 
        query: str, 
        limit: int = 10,
        offset: int = 0
    ) -> List[SearchResult]:
        """
        Fallback search in database using inverted index
        """
        from app.services.search import search_service
        return search_service.search(query, limit, offset)
    
    def hybrid_search(
        self,
        query: str,
        limit: int = 10,
        offset: int = 0
    ) -> List[SearchResult]:
        """
        Hybrid search: cache first, database ONLY if no cache results
        
        Args:
            query: Search query
            limit: Number of results to return
            offset: Pagination offset
            
        Returns:
            List of search results
        """
        logger.info(f"=== HYBRID SEARCH: '{query}' ===")
        
        # Step 1: Try cache search first
        cache_results = self.search_in_cache(query, limit=limit)
        
        # If cache has ANY results (> 0), return only cache results
        if cache_results:
            logger.info(f"✓ Found {len(cache_results)} results in cache - returning cache only")
            return cache_results
        
        # Step 2: ONLY if cache has ZERO results, search database
        logger.info("⚠ No results in cache, searching database...")
        db_results = self.search_in_database(query, limit=limit, offset=offset)
        logger.info(f"✓ Found {len(db_results)} results in database")
        return db_results
    
    def _generate_snippet(self, content: str, query_terms: List[str], max_length: int = 200) -> str:
        """Generate a snippet from content highlighting query terms"""
        if not content:
            return ""
        
        # Find first occurrence of any query term
        content_lower = content.lower()
        best_pos = -1
        
        for term in query_terms:
            pos = content_lower.find(term)
            if pos != -1:
                if best_pos == -1 or pos < best_pos:
                    best_pos = pos
        
        # If no term found, return start of content
        if best_pos == -1:
            return content[:max_length].strip() + "..." if len(content) > max_length else content
        
        # Get snippet around the best position
        start = max(0, best_pos - 50)
        end = min(len(content), best_pos + max_length)
        
        snippet = content[start:end].strip()
        if start > 0:
            snippet = "..." + snippet
        if end < len(content):
            snippet = snippet + "..."
        
        return snippet

# Global hybrid search instance
hybrid_search_service = HybridSearchService()
