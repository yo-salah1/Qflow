#!/usr/bin/env python3
"""
Semantic Search Service
Uses embeddings for meaning-based search
"""

import logging
from typing import List, Dict, Optional
import numpy as np

logger = logging.getLogger(__name__)


class SemanticSearchService:
    """
    Semantic search using sentence embeddings.
    Supports both database-stored embeddings and in-memory title embeddings.
    """

    def __init__(self):
        self._model = None
        self._title_embeddings: Dict[int, np.ndarray] = {}
        self._title_map: Dict[int, dict] = {}
        self._titles_loaded = False
        logger.info("SemanticSearchService initialized (model loads lazily)")

    def _ensure_model(self):
        """Lazy-load the sentence transformer model."""
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Loaded sentence transformer model")

    def _ensure_title_embeddings(self):
        """Build in-memory title embeddings from cached documents."""
        if self._titles_loaded:
            return

        from app.services.document_cache import document_cache

        docs = document_cache.documents
        if not docs:
            logger.warning("No cached documents for title embeddings")
            return

        self._ensure_model()

        titles = []
        doc_ids = []
        for doc_id, doc in docs.items():
            title = doc.get('title', '')
            if title:
                titles.append(title)
                doc_ids.append(doc_id)
                self._title_map[doc_id] = doc

        if titles:
            logger.info(f"Encoding {len(titles)} document titles for semantic search...")
            embeddings = self._model.encode(titles, batch_size=64, show_progress_bar=False)
            for i, doc_id in enumerate(doc_ids):
                self._title_embeddings[doc_id] = embeddings[i]

        self._titles_loaded = True
        logger.info(f"Built in-memory title embeddings for {len(self._title_embeddings)} documents")

    def encode_text(self, text: str) -> List[float]:
        """Encode text to embedding vector."""
        self._ensure_model()
        embedding = self._model.encode(text)
        return embedding.tolist()

    def semantic_search(self, query: str, limit: int = 10) -> List[dict]:
        """
        Perform semantic search using in-memory title embeddings.
        Falls back to database embeddings if available.
        """
        from app.models.schemas import SearchResult

        # Try in-memory search first (faster and always available)
        results = self._semantic_search_local(query, limit)
        if results:
            return results

        # Fallback to database embeddings
        return self._semantic_search_db(query, limit)

    def _semantic_search_local(self, query: str, limit: int = 10) -> List[dict]:
        """Semantic search using in-memory title embeddings."""
        from app.models.schemas import SearchResult

        self._ensure_title_embeddings()

        if not self._title_embeddings:
            return []

        self._ensure_model()
        query_emb = self._model.encode(query)

        similarities = []
        for doc_id, title_emb in self._title_embeddings.items():
            sim = float(np.dot(query_emb, title_emb) / (
                np.linalg.norm(query_emb) * np.linalg.norm(title_emb) + 1e-8
            ))
            similarities.append((doc_id, sim))

        similarities.sort(key=lambda x: x[1], reverse=True)

        results = []
        for doc_id, score in similarities[:limit]:
            if score < 0.25:
                continue
            doc = self._title_map.get(doc_id)
            if doc:
                content = doc.get('content', '')
                snippet = content[:200] + '...' if len(content) > 200 else content
                results.append(SearchResult(
                    doc_id=doc_id,
                    title=doc['title'],
                    url=doc.get('url'),
                    score=round(score, 4),
                    snippet=snippet,
                    highlighted_snippet=snippet
                ))

        return results

    def _semantic_search_db(self, query: str, limit: int = 10) -> List[dict]:
        """Fallback semantic search using database embeddings."""
        from app.models.schemas import SearchResult
        from app.db.supabase_client import supabase_client

        try:
            self._ensure_model()
            query_embedding = self.encode_text(query)

            all_embeddings = self._get_all_embeddings()
            if not all_embeddings:
                return []

            query_vec = np.array(query_embedding)
            similarities = []

            for doc_id, emb in all_embeddings.items():
                emb_vec = np.array(emb)
                cos_sim = float(np.dot(query_vec, emb_vec) / (
                    np.linalg.norm(query_vec) * np.linalg.norm(emb_vec) + 1e-8
                ))
                similarities.append((doc_id, cos_sim))

            similarities.sort(key=lambda x: x[1], reverse=True)

            results = []
            for doc_id, score in similarities[:limit]:
                if score < 0.25:
                    continue
                doc = supabase_client.get_document(doc_id)
                if doc:
                    content = doc.get('content', '')
                    snippet = content[:200] + '...' if len(content) > 200 else content
                    results.append(SearchResult(
                        doc_id=doc_id,
                        title=doc['title'],
                        url=doc.get('url'),
                        score=round(score, 4),
                        snippet=snippet,
                        highlighted_snippet=snippet
                    ))

            return results

        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return []

    def _get_all_embeddings(self) -> Dict[int, List[float]]:
        """Get all document embeddings from database."""
        from app.db.supabase_client import supabase_client
        try:
            response = supabase_client.client.table('document_embeddings').select('doc_id, embedding').execute()
            embeddings = {}
            for row in response.data or []:
                embeddings[row['doc_id']] = row['embedding']
            return embeddings
        except Exception as e:
            logger.error(f"Error getting embeddings: {e}")
            return {}

    def reload_embeddings(self):
        """Force reload title embeddings."""
        self._title_embeddings.clear()
        self._title_map.clear()
        self._titles_loaded = False


# Global instance
semantic_search_service = SemanticSearchService()