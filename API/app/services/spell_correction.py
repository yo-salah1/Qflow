"""
Spell Correction Service
Suggests corrections for misspelled search terms using indexed vocabulary.
"""

import re
import difflib
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


class SpellCorrector:
    """Spell correction using document titles as dictionary."""

    def __init__(self):
        self._vocabulary: set = set()
        self._loaded = False

    def _ensure_vocabulary(self):
        """Build vocabulary from cached document titles."""
        if self._loaded:
            return

        from app.services.document_cache import document_cache

        for doc in document_cache.documents.values():
            title = doc.get('title', '')
            content = doc.get('content', '')
            # Extract words from title
            words = re.findall(r'[a-zA-Z]{3,}', title.lower())
            self._vocabulary.update(words)
            # Extract words from first 300 chars of content for more coverage
            content_words = re.findall(r'[a-zA-Z]{3,}', content[:300].lower())
            self._vocabulary.update(content_words)

        # Also add inverted index terms for wider coverage
        from app.services.indexer import indexer
        for term in indexer.inverted_index.keys():
            if len(term) >= 3:
                self._vocabulary.add(term)

        self._loaded = True
        logger.info(f"Built spell correction vocabulary with {len(self._vocabulary)} words")

    def suggest_term(self, word: str, max_suggestions: int = 3, cutoff: float = 0.6) -> List[str]:
        """Suggest corrections for a single misspelled word."""
        self._ensure_vocabulary()
        if not self._vocabulary:
            return []

        word_lower = word.lower()

        # If word exists in vocabulary, no correction needed
        if word_lower in self._vocabulary:
            return []

        matches = difflib.get_close_matches(
            word_lower, list(self._vocabulary), n=max_suggestions, cutoff=cutoff
        )
        return matches

    def correct_query(self, raw_query: str) -> Optional[str]:
        """
        Try to correct a full query string.
        Returns corrected query if corrections were made, None otherwise.
        """
        self._ensure_vocabulary()
        if not self._vocabulary:
            return None

        words = raw_query.strip().split()
        corrected_words = []
        was_corrected = False

        for word in words:
            clean = re.sub(r'[^a-zA-Z]', '', word).lower()
            if not clean or len(clean) <= 2:
                corrected_words.append(word)
                continue

            if clean in self._vocabulary:
                corrected_words.append(word)
            else:
                matches = difflib.get_close_matches(
                    clean, list(self._vocabulary), n=1, cutoff=0.6
                )
                if matches:
                    corrected_words.append(matches[0])
                    was_corrected = True
                else:
                    corrected_words.append(word)

        if was_corrected:
            result = ' '.join(corrected_words)
            logger.info(f"Spell correction: '{raw_query}' -> '{result}'")
            return result

        return None

    def reload_vocabulary(self):
        """Force reload vocabulary (call after re-indexing)."""
        self._vocabulary.clear()
        self._loaded = False
        self._ensure_vocabulary()


# Global instance
spell_corrector = SpellCorrector()
