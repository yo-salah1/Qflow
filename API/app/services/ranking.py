import math
import logging
from typing import Dict, List, Set, Tuple
from collections import Counter
from app.db.supabase_client import supabase_client
from app.services.indexer import indexer

logger = logging.getLogger(__name__)


class TFIDFRanker:
    """TF-IDF ranking implementation for document scoring."""
    
    def __init__(self):
        self.total_documents: int = 0
        self.document_frequency: Dict[str, int] = {}
    
    def compute_tf(self, term: str, doc_id: int) -> float:
        """
        Compute term frequency (TF) for a term in a document.
        
        Args:
            term: The term to compute TF for
            doc_id: The document ID
            
        Returns:
            TF score (raw frequency)
        """
        # Get index entries for the term
        entries = supabase_client.get_index_entries(term)
        
        for entry in entries:
            if entry['doc_id'] == doc_id:
                return float(entry['frequency'])
        
        return 0.0
    
    def compute_idf(self, term: str) -> float:
        """
        Compute inverse document frequency (IDF) for a term.
        
        Args:
            term: The term to compute IDF for
            
        Returns:
            IDF score: log(N / df) where N is total docs, df is doc frequency
        """
        # Get total number of documents
        if self.total_documents == 0:
            self.total_documents = supabase_client.get_document_count()
        
        if self.total_documents == 0:
            return 0.0
        
        # Get document frequency (number of docs containing the term)
        df = supabase_client.get_term_frequency(term)
        
        if df == 0:
            return 0.0
        
        # IDF = log(N / df)
        idf = math.log(self.total_documents / df)
        
        return idf
    
    def compute_tf_idf(self, term: str, doc_id: int) -> float:
        """
        Compute TF-IDF score for a term in a document.
        
        Args:
            term: The term to compute TF-IDF for
            doc_id: The document ID
            
        Returns:
            TF-IDF score
        """
        tf = self.compute_tf(term, doc_id)
        idf = self.compute_idf(term)
        
        return tf * idf
    
    def rank_documents(
        self,
        query_terms: List[str],
        candidate_doc_ids: Set[int]
    ) -> List[Tuple[int, float]]:
        """
        Rank documents based on TF-IDF scores for query terms.
        
        Args:
            query_terms: List of preprocessed query terms
            candidate_doc_ids: Set of candidate document IDs to rank
            
        Returns:
            List of (doc_id, score) tuples sorted by score descending
        """
        logger.info(f"Ranking {len(candidate_doc_ids)} documents for {len(query_terms)} query terms")
        
        # Update total documents count
        self.total_documents = supabase_client.get_document_count()
        
        # Calculate scores for each document
        doc_scores: Dict[int, float] = {}
        
        for doc_id in candidate_doc_ids:
            score = 0.0
            for term in query_terms:
                tf_idf = self.compute_tf_idf(term, doc_id)
                score += tf_idf
            doc_scores[doc_id] = score
        
        # Sort by score descending
        ranked_docs = sorted(doc_scores.items(), key=lambda x: x[1], reverse=True)
        
        logger.info(f"Ranking completed. Top score: {ranked_docs[0][1] if ranked_docs else 0}")
        return ranked_docs
    
    def compute_normalized_tf_idf(self, term: str, doc_id: int) -> float:
        """
        Compute normalized TF-IDF score (TF normalized by document length).
        
        Args:
            term: The term to compute TF-IDF for
            doc_id: The document ID
            
        Returns:
            Normalized TF-IDF score
        """
        # Get raw TF
        entries = supabase_client.get_index_entries(term)
        tf = 0.0
        doc_length = 0
        
        for entry in entries:
            if entry['doc_id'] == doc_id:
                tf = float(entry['frequency'])
                doc_length = len(entry['positions'])
                break
        
        if doc_length == 0:
            return 0.0
        
        # Normalize TF by document length
        normalized_tf = tf / doc_length
        
        # Get IDF
        idf = self.compute_idf(term)
        
        return normalized_tf * idf
    
    def rank_documents_normalized(
        self,
        query_terms: List[str],
        candidate_doc_ids: Set[int]
    ) -> List[Tuple[int, float]]:
        """
        Rank documents using normalized TF-IDF scores.
        
        Args:
            query_terms: List of preprocessed query terms
            candidate_doc_ids: Set of candidate document IDs to rank
            
        Returns:
            List of (doc_id, score) tuples sorted by score descending
        """
        logger.info(f"Ranking {len(candidate_doc_ids)} documents using normalized TF-IDF")
        
        # Update total documents count
        self.total_documents = supabase_client.get_document_count()
        
        # Calculate scores for each document
        doc_scores: Dict[int, float] = {}
        
        for doc_id in candidate_doc_ids:
            score = 0.0
            for term in query_terms:
                normalized_tf_idf = self.compute_normalized_tf_idf(term, doc_id)
                score += normalized_tf_idf
            doc_scores[doc_id] = score
        
        # Sort by score descending
        ranked_docs = sorted(doc_scores.items(), key=lambda x: x[1], reverse=True)
        
        return ranked_docs
    
    def get_top_k_documents(
        self,
        query_terms: List[str],
        candidate_doc_ids: Set[int],
        k: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Get top K documents ranked by TF-IDF.
        
        Args:
            query_terms: List of preprocessed query terms
            candidate_doc_ids: Set of candidate document IDs
            k: Number of top documents to return
            
        Returns:
            List of (doc_id, score) tuples for top K documents
        """
        ranked = self.rank_documents(query_terms, candidate_doc_ids)
        return ranked[:k]


# Global ranker instance
tfidf_ranker = TFIDFRanker()
