from supabase import create_client, Client
from app.core.config import settings
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Supabase database client wrapper."""
    
    def __init__(self):
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    def insert_document(self, title: str, content: str) -> Optional[int]:
        """Insert a document into the documents table."""
        try:
            response = self.client.table('documents').insert({
                'title': title,
                'content': content
            }).execute()
            
            if response.data:
                return response.data[0]['id']
            return None
        except Exception as e:
            logger.error(f"Error inserting document: {e}")
            return None
    
    def batch_insert_documents(self, documents: List[Dict[str, str]]) -> List[int]:
        """Batch insert documents into the documents table."""
        try:
            response = self.client.table('documents').insert(documents).execute()
            return [doc['id'] for doc in response.data] if response.data else []
        except Exception as e:
            logger.error(f"Error batch inserting documents: {e}")
            return []
    
    def get_document(self, doc_id: int) -> Optional[Dict[str, Any]]:
        """Retrieve a document by ID."""
        try:
            response = self.client.table('documents').select('*').eq('id', doc_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error retrieving document {doc_id}: {e}")
            return None
    
    def get_all_documents(self) -> List[Dict[str, Any]]:
        """Retrieve all documents."""
        try:
            response = self.client.table('documents').select('id, title, content, url').execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error retrieving all documents: {e}")
            return []
    
    def document_exists(self, title: str) -> bool:
        """Check if a document with the given title exists."""
        try:
            response = self.client.table('documents').select('id').eq('title', title).execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            logger.error(f"Error checking document existence: {e}")
            return False
    
    def insert_index_entry(self, term: str, doc_id: int, frequency: int, positions: List[int]) -> bool:
        """Insert an entry into the inverted index."""
        try:
            self.client.table('inverted_index').insert({
                'term': term,
                'doc_id': doc_id,
                'frequency': frequency,
                'positions': positions
            }).execute()
            return True
        except Exception as e:
            logger.error(f"Error inserting index entry for term '{term}': {e}")
            return False
    
    def batch_insert_index_entries(self, entries: List[Dict[str, Any]]) -> bool:
        """Batch insert entries into the inverted index."""
        try:
            self.client.table('inverted_index').insert(entries).execute()
            return True
        except Exception as e:
            logger.error(f"Error batch inserting index entries: {e}")
            return False
    
    def get_index_entries(self, term: str) -> List[Dict[str, Any]]:
        """Retrieve all index entries for a given term."""
        try:
            response = self.client.table('inverted_index').select('*').eq('term', term).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error retrieving index entries for term '{term}': {e}")
            return []
    
    def get_all_terms(self) -> List[str]:
        """Retrieve all unique terms from the inverted index."""
        try:
            response = self.client.table('inverted_index').select('term').execute()
            terms = list(set([entry['term'] for entry in response.data])) if response.data else []
            return terms
        except Exception as e:
            logger.error(f"Error retrieving all terms: {e}")
            return []
    
    def clear_documents(self) -> bool:
        """Clear all documents from the documents table."""
        try:
            self.client.table('documents').delete().neq('id', 0).execute()
            return True
        except Exception as e:
            logger.error(f"Error clearing documents: {e}")
            return False
    
    def clear_index(self) -> bool:
        """Clear all entries from the inverted index."""
        try:
            self.client.table('inverted_index').delete().neq('id', 0).execute()
            return True
        except Exception as e:
            logger.error(f"Error clearing index: {e}")
            return False
    
    def get_document_count(self) -> int:
        """Get the total number of documents."""
        try:
            response = self.client.table('documents').select('id', count='exact').execute()
            return response.count if response.count else 0
        except Exception as e:
            logger.error(f"Error getting document count: {e}")
            return 0
    
    def get_term_frequency(self, term: str) -> int:
        """Get the document frequency (number of documents containing the term)."""
        try:
            response = self.client.table('inverted_index').select('doc_id', count='exact').eq('term', term).execute()
            return response.count if response.count else 0
        except Exception as e:
            logger.error(f"Error getting term frequency for '{term}': {e}")
            return 0


# Global Supabase client instance
supabase_client = SupabaseClient()
