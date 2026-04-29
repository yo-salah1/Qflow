#!/usr/bin/env python3
"""
Document Cache Service - Fast local JSON cache for documents
Stores frequently accessed documents in JSON for quick retrieval
"""

import json
import os
import logging
from typing import Dict, Optional, List, Any
from app.db.supabase_client import supabase_client

logger = logging.getLogger(__name__)

# Cache file path
CACHE_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'document_cache.json')
CACHE_MAX_SIZE = 1500  # Maximum number of documents to cache

class DocumentCache:
    """Local JSON cache for documents"""
    
    def __init__(self):
        self.documents: Dict[int, Dict[str, Any]] = {}
        self.cache_file = CACHE_FILE_PATH
        self._ensure_data_dir()
        self.load_cache()
    
    def _ensure_data_dir(self):
        """Ensure data directory exists"""
        data_dir = os.path.dirname(self.cache_file)
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
            logger.info(f"Created data directory: {data_dir}")
    
    def load_cache(self):
        """Load documents from JSON cache file"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
                    self.documents = {int(k): v for k, v in cache_data.get('documents', {}).items()}
                    logger.info(f"Loaded {len(self.documents)} documents from cache file")
            else:
                logger.info("No cache file found, starting with empty cache")
        except Exception as e:
            logger.error(f"Error loading cache: {e}")
            self.documents = {}
    
    def save_cache(self):
        """Save documents to JSON cache file"""
        try:
            cache_data = {
                'documents': self.documents,
                'count': len(self.documents),
                'max_size': CACHE_MAX_SIZE
            }
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
            logger.info(f"Saved {len(self.documents)} documents to cache file")
            return True
        except Exception as e:
            logger.error(f"Error saving cache: {e}")
            return False
    
    def get_document(self, doc_id: int) -> Optional[Dict[str, Any]]:
        """
        Get document from cache or database
        First checks cache, then falls back to database
        """
        # Check cache first
        if doc_id in self.documents:
            logger.debug(f"Document {doc_id} found in cache")
            return self.documents[doc_id]
        
        # Fall back to database
        logger.debug(f"Document {doc_id} not in cache, fetching from database")
        doc = supabase_client.get_document(doc_id)
        
        if doc and len(self.documents) < CACHE_MAX_SIZE:
            # Add to cache if there's space
            self.documents[doc_id] = doc
            self.save_cache()
            logger.debug(f"Added document {doc_id} to cache")
        
        return doc
    
    def get_documents_batch(self, doc_ids: List[int]) -> Dict[int, Dict[str, Any]]:
        """
        Get multiple documents efficiently
        Returns cached documents immediately, fetches missing ones from DB
        """
        results = {}
        missing_ids = []
        
        # Check cache for each document
        for doc_id in doc_ids:
            if doc_id in self.documents:
                results[doc_id] = self.documents[doc_id]
            else:
                missing_ids.append(doc_id)
        
        # Fetch missing documents from database
        if missing_ids:
            logger.info(f"Fetching {len(missing_ids)} documents from database (cache miss)")
            for doc_id in missing_ids:
                doc = supabase_client.get_document(doc_id)
                if doc:
                    results[doc_id] = doc
                    # Add to cache if there's space
                    if len(self.documents) < CACHE_MAX_SIZE:
                        self.documents[doc_id] = doc
            
            # Save updated cache
            if missing_ids and len(self.documents) < CACHE_MAX_SIZE:
                self.save_cache()
        
        return results
    
    def populate_cache(self, limit: int = CACHE_MAX_SIZE):
        """
        Populate cache with documents from database
        Call this after indexing to ensure fast access
        """
        try:
            logger.info(f"Populating document cache with up to {limit} documents...")
            
            # Get all documents from database
            docs = supabase_client.get_all_documents()
            
            if not docs:
                logger.warning("No documents found in database")
                return 0
            
            # Store in cache (up to limit)
            count = 0
            for doc in docs[:limit]:
                doc_id = doc.get('id')
                if doc_id:
                    self.documents[doc_id] = doc
                    count += 1
            
            # Save cache
            self.save_cache()
            logger.info(f"Populated cache with {count} documents")
            return count
            
        except Exception as e:
            logger.error(f"Error populating cache: {e}")
            return 0
    
    def clear_cache(self):
        """Clear all cached documents"""
        self.documents = {}
        if os.path.exists(self.cache_file):
            os.remove(self.cache_file)
        logger.info("Document cache cleared")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            'cached_documents': len(self.documents),
            'max_size': CACHE_MAX_SIZE,
            'cache_file': self.cache_file,
            'file_exists': os.path.exists(self.cache_file)
        }

# Global cache instance
document_cache = DocumentCache()
