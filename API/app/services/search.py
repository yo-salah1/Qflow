import re
import logging
from typing import List, Set, Dict, Optional
from app.services.indexer import indexer, TextPreprocessor
from app.services.ranking import tfidf_ranker
from app.services.document_cache import document_cache
from app.db.supabase_client import supabase_client
from app.core.config import settings
from app.models.schemas import SearchResult

logger = logging.getLogger(__name__)


class WildcardMatcher:
    """Wildcard pattern matching for search terms."""
    
    @staticmethod
    def wildcard_to_regex(pattern: str) -> str:
        """
        Convert wildcard pattern to regex pattern.
        
        Supports:
        - * for any number of characters
        - ? for single character
        
        Args:
            pattern: Wildcard pattern (e.g., "comput*", "*ing", "te?t")
            
        Returns:
            Regex pattern string
        """
        # Escape special regex characters except * and ?
        escaped = re.escape(pattern)
        # Replace escaped * with .*
        escaped = escaped.replace(r'\*', '.*')
        # Replace escaped ? with .
        escaped = escaped.replace(r'\?', '.')
        # Add word boundaries
        return f'^{escaped}$'
    
    @staticmethod
    def match_terms(terms: Set[str], pattern: str) -> Set[str]:
        """
        Find all terms that match a wildcard pattern.
        
        Args:
            terms: Set of terms to search
            pattern: Wildcard pattern
            
        Returns:
            Set of matching terms
        """
        regex_pattern = WildcardMatcher.wildcard_to_regex(pattern)
        regex = re.compile(regex_pattern, re.IGNORECASE)
        
        matching_terms = {term for term in terms if regex.match(term)}
        return matching_terms


class SearchService:
    """Search service with wildcard support and TF-IDF ranking."""
    
    def __init__(self):
        self.preprocessor = TextPreprocessor()
        self.wildcard_matcher = WildcardMatcher()
        self.index_loaded = False
    
    def ensure_index_loaded(self):
        """Ensure the inverted index is loaded in memory."""
        if not self.index_loaded:
            # Try loading from local file first (faster)
            if indexer.index_file_exists():
                success = indexer.load_index_from_file()
                if success and len(indexer.inverted_index) > 0:
                    self.index_loaded = True
                    logger.info("Index loaded successfully from file")
                    return
            
            # Fallback to database
            logger.info("Index file not found, loading from database...")
            success = indexer.load_index_from_database()
            if success and len(indexer.inverted_index) > 0:
                self.index_loaded = True
                logger.info("Index loaded successfully from database")
                # Save to file for next time
                indexer.save_index_to_file()
            else:
                logger.warning("Index load failed or index is empty, not marking as loaded")
    
    def preprocess_query(self, query: str) -> List[str]:
        """
        Preprocess user query.
        
        Args:
            query: Raw query string
            
        Returns:
            List of preprocessed terms
        """
        return self.preprocessor.preprocess(query)
    
    def expand_wildcards(self, query_terms: List[str]) -> List[str]:
        """
        Expand wildcard patterns in query terms to matching indexed terms.
        
        Args:
            query_terms: List of query terms (may contain wildcards)
            
        Returns:
            List of expanded terms
        """
        self.ensure_index_loaded()
        
        # Get all indexed terms
        all_terms = set(indexer.inverted_index.keys())
        
        expanded_terms = []
        
        for term in query_terms:
            # Check if term contains wildcards
            if '*' in term or '?' in term:
                # Find matching terms
                matching = self.wildcard_matcher.match_terms(all_terms, term)
                expanded_terms.extend(matching)
                logger.info(f"Wildcard '{term}' matched {len(matching)} terms")
            else:
                # No wildcard, keep as is
                expanded_terms.append(term)
        
        return expanded_terms
    
    def retrieve_documents(self, query_terms: List[str]) -> Set[int]:
        """
        Retrieve documents containing any of the query terms.
        
        Args:
            query_terms: List of query terms
            
        Returns:
            Set of document IDs
        """
        self.ensure_index_loaded()
        
        matching_docs = set()
        
        for term in query_terms:
            if term in indexer.inverted_index:
                doc_ids = set(indexer.inverted_index[term].keys())
                matching_docs.update(doc_ids)
        
        logger.info(f"Retrieved {len(matching_docs)} documents for query")
        return matching_docs
    
    def generate_snippet(self, content: str, query_terms: List[str]) -> str:
        """
        Generate a snippet from document content.
        
        Args:
            content: Document content
            query_terms: Query terms to highlight
            
        Returns:
            Snippet (first 200 characters)
        """
        snippet = content[:settings.SNIPPET_LENGTH]
        if len(content) > settings.SNIPPET_LENGTH:
            snippet += "..."
        return snippet
    
    def highlight_terms(self, text: str, query_terms: List[str]) -> str:
        """
        Highlight query terms in text.
        
        Args:
            text: Text to highlight
            query_terms: Terms to highlight
            
        Returns:
            Text with highlighted terms wrapped in **bold**
        """
        highlighted_text = text
        for term in query_terms:
            # Case-insensitive replacement
            pattern = re.compile(re.escape(term), re.IGNORECASE)
            highlighted_text = pattern.sub(f'**{term}**', highlighted_text)
        return highlighted_text
    
    def search(
        self,
        query: str,
        limit: int = 10,
        offset: int = 0,
        use_wildcards: bool = True
    ) -> List[SearchResult]:
        """
        Perform search with ranking.
        
        Args:
            query: Search query
            limit: Number of results to return
            offset: Pagination offset
            use_wildcards: Whether to expand wildcard patterns
            
        Returns:
            List of search results
        """
        logger.info(f"Searching for: '{query}' (limit={limit}, offset={offset})")
        
        if not query or not query.strip():
            logger.warning("Empty query received")
            return []
        
        # Preprocess query
        query_terms = self.preprocess_query(query)
        
        if not query_terms:
            logger.warning("No valid terms after preprocessing")
            return []
        
        # Expand wildcards if enabled
        if use_wildcards:
            expanded_terms = self.expand_wildcards(query_terms)
            if not expanded_terms:
                logger.warning("No terms after wildcard expansion")
                return []
            query_terms = expanded_terms
        
        # Retrieve matching documents
        candidate_docs = self.retrieve_documents(query_terms)
        
        if not candidate_docs:
            logger.info("No documents matched the query")
            return []
        
        # Rank documents
        ranked_docs = tfidf_ranker.rank_documents(query_terms, candidate_docs)
        
        # Apply pagination
        paginated_docs = ranked_docs[offset:offset + limit]
        
        # Fetch document details from cache or database
        results = []
        doc_ids = [doc_id for doc_id, _ in paginated_docs]
        
        # Get documents from cache (with fallback to DB)
        cached_docs = document_cache.get_documents_batch(doc_ids)
        
        for doc_id, score in paginated_docs:
            doc = cached_docs.get(doc_id)
            if doc:
                snippet = self.generate_snippet(doc['content'], query_terms)
                highlighted = self.highlight_terms(snippet, query_terms)
                
                result = SearchResult(
                    doc_id=doc_id,
                    title=doc['title'],
                    url=doc.get('url'),
                    score=round(score, 4),
                    snippet=snippet,
                    highlighted_snippet=highlighted
                )
                results.append(result)
        
        logger.info(f"Returning {len(results)} results")
        return results
    
    def search_exact(
        self,
        query: str,
        limit: int = 10,
        offset: int = 0
    ) -> List[SearchResult]:
        """
        Perform exact search without wildcard expansion.
        
        Args:
            query: Search query
            limit: Number of results to return
            offset: Pagination offset
            
        Returns:
            List of search results
        """
        return self.search(query, limit, offset, use_wildcards=False)


# Global search service instance
search_service = SearchService()
