import re
import string
import logging
import pickle
import os
from typing import List, Dict, Set, Tuple
from collections import defaultdict
import nltk
from nltk.stem import PorterStemmer
from nltk.corpus import stopwords
from app.db.supabase_client import supabase_client

# Path for local index file
INDEX_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'index.pkl')

logger = logging.getLogger(__name__)

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)


class TextPreprocessor:
    """Text preprocessing utility class."""
    
    def __init__(self):
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))
    
    def tokenize(self, text: str) -> List[str]:
        """
        Tokenize text using spaces and commas as delimiters.
        
        Args:
            text: Input text
            
        Returns:
            List of tokens
        """
        # Split by spaces and commas
        tokens = re.split(r'[,\s]+', text)
        # Remove empty tokens
        tokens = [token for token in tokens if token]
        return tokens
    
    def remove_punctuation(self, text: str) -> str:
        """
        Remove punctuation from text.
        
        Args:
            text: Input text
            
        Returns:
            Text without punctuation
        """
        return text.translate(str.maketrans('', '', string.punctuation))
    
    def lowercase(self, text: str) -> str:
        """
        Convert text to lowercase.
        
        Args:
            text: Input text
            
        Returns:
            Lowercased text
        """
        return text.lower()
    
    def remove_stopwords(self, tokens: List[str]) -> List[str]:
        """
        Remove stopwords from token list.
        
        Args:
            tokens: List of tokens
            
        Returns:
            List of tokens without stopwords
        """
        return [token for token in tokens if token not in self.stop_words]
    
    def stem(self, tokens: List[str]) -> List[str]:
        """
        Apply Porter stemming to tokens.
        
        Args:
            tokens: List of tokens
            
        Returns:
            List of stemmed tokens
        """
        return [self.stemmer.stem(token) for token in tokens]
    
    def preprocess(self, text: str) -> List[str]:
        """
        Apply full preprocessing pipeline to text.
        
        Args:
            text: Input text
            
        Returns:
            List of preprocessed tokens
        """
        # Remove punctuation
        text = self.remove_punctuation(text)
        
        # Lowercase
        text = self.lowercase(text)
        
        # Tokenize
        tokens = self.tokenize(text)
        
        # Remove stopwords
        tokens = self.remove_stopwords(tokens)
        
        # Apply stemming
        tokens = self.stem(tokens)
        
        return tokens


class Indexer:
    """Document indexer for building inverted index."""
    
    def __init__(self):
        self.preprocessor = TextPreprocessor()
        self.inverted_index: Dict[str, Dict[int, List[int]]] = defaultdict(lambda: defaultdict(list))
        self.document_lengths: Dict[int, int] = {}
    
    def build_index_for_document(self, doc_id: int, content: str) -> Dict[str, Dict[int, List[int]]]:
        """
        Build inverted index entries for a single document.
        
        Args:
            doc_id: Document ID
            content: Document content
            
        Returns:
            Dictionary of term -> {doc_id: [positions]}
        """
        # Preprocess the content
        tokens = self.preprocessor.preprocess(content)
        
        # Store document length
        self.document_lengths[doc_id] = len(tokens)
        
        # Build index with positions
        doc_index: Dict[str, List[int]] = defaultdict(list)
        
        for position, token in enumerate(tokens):
            if token:  # Skip empty tokens
                doc_index[token].append(position)
        
        # Merge into main inverted index
        for term, positions in doc_index.items():
            self.inverted_index[term][doc_id] = positions
        
        return {term: {doc_id: positions} for term, positions in doc_index.items()}
    
    def build_index_from_documents(self, documents: List[Dict]) -> int:
        """
        Build inverted index from a list of documents.
        
        Args:
            documents: List of document dictionaries with 'id' and 'content'
            
        Returns:
            Number of documents indexed
        """
        logger.info(f"Building index for {len(documents)} documents")
        
        for doc in documents:
            doc_id = doc['id']
            content = doc['content']
            self.build_index_for_document(doc_id, content)
        
        total_terms = len(self.inverted_index)
        logger.info(f"Index built with {total_terms} unique terms")
        
        return len(documents)
    
    def save_index_to_database(self, batch_size: int = 1000) -> bool:
        """
        Save the inverted index to Supabase in batches.
        
        Args:
            batch_size: Number of entries to insert per batch
            
        Returns:
            True if successful, False otherwise
        """
        logger.info("Saving inverted index to database")
        
        # Clear existing index
        supabase_client.clear_index()
        
        # Prepare batch entries
        batch_entries = []
        total_inserted = 0
        
        for term, doc_dict in self.inverted_index.items():
            for doc_id, positions in doc_dict.items():
                entry = {
                    'term': term,
                    'doc_id': doc_id,
                    'frequency': len(positions),
                    'positions': positions
                }
                batch_entries.append(entry)
                
                # Insert batch when it reaches batch_size
                if len(batch_entries) >= batch_size:
                    if supabase_client.batch_insert_index_entries(batch_entries):
                        total_inserted += len(batch_entries)
                        logger.info(f"Inserted batch: {total_inserted} entries")
                    batch_entries = []
        
        # Insert remaining entries
        if batch_entries:
            if supabase_client.batch_insert_index_entries(batch_entries):
                total_inserted += len(batch_entries)
                logger.info(f"Inserted final batch: {total_inserted} entries")
        
        logger.info(f"Index saved to database. Total entries: {total_inserted}")
        return total_inserted > 0
    
    def load_index_from_database(self) -> bool:
        """
        Load inverted index from Supabase into memory.
        
        Returns:
            True if successful, False otherwise
        """
        logger.info("Loading inverted index from database")
        
        # Clear current index
        self.inverted_index.clear()
        self.document_lengths.clear()
        
        # Fetch all terms
        terms = supabase_client.get_all_terms()
        
        for term in terms:
            entries = supabase_client.get_index_entries(term)
            for entry in entries:
                doc_id = entry['doc_id']
                positions = entry['positions']
                self.inverted_index[term][doc_id] = positions
        
        # Recalculate document lengths from loaded index
        for term, doc_dict in self.inverted_index.items():
            for doc_id, positions in doc_dict.items():
                self.document_lengths[doc_id] = self.document_lengths.get(doc_id, 0) + len(positions)
        
        logger.info(f"Index loaded with {len(self.inverted_index)} unique terms and {len(self.document_lengths)} documents")
        return True
    
    def get_document_length(self, doc_id: int) -> int:
        """
        Get the length (number of terms) of a document.
        
        Args:
            doc_id: Document ID
            
        Returns:
            Document length
        """
        return self.document_lengths.get(doc_id, 0)
    
    def clear_index(self):
        """Clear the in-memory inverted index."""
        self.inverted_index.clear()
        self.document_lengths.clear()
        logger.info("In-memory index cleared")
    
    def save_index_to_file(self, file_path: str = None) -> bool:
        """
        Save the inverted index to a local pickle file.
        
        Args:
            file_path: Path to save the index file (default: INDEX_FILE_PATH)
            
        Returns:
            True if successful, False otherwise
        """
        if file_path is None:
            file_path = INDEX_FILE_PATH
        
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            # Prepare data to save
            index_data = {
                'inverted_index': dict(self.inverted_index),
                'document_lengths': self.document_lengths
            }
            
            # Save to file
            with open(file_path, 'wb') as f:
                pickle.dump(index_data, f, protocol=pickle.HIGHEST_PROTOCOL)
            
            file_size = os.path.getsize(file_path) / (1024 * 1024)  # MB
            logger.info(f"Index saved to {file_path} ({file_size:.2f} MB)")
            return True
        except Exception as e:
            logger.error(f"Failed to save index to file: {e}")
            return False
    
    def load_index_from_file(self, file_path: str = None) -> bool:
        """
        Load inverted index from a local pickle file.
        
        Args:
            file_path: Path to the index file (default: INDEX_FILE_PATH)
            
        Returns:
            True if successful, False otherwise
        """
        if file_path is None:
            file_path = INDEX_FILE_PATH
        
        try:
            if not os.path.exists(file_path):
                logger.warning(f"Index file not found: {file_path}")
                return False
            
            # Load from file
            with open(file_path, 'rb') as f:
                index_data = pickle.load(f)
            
            # Restore index
            self.inverted_index.clear()
            self.document_lengths.clear()
            
            self.inverted_index = defaultdict(lambda: defaultdict(list), index_data['inverted_index'])
            self.document_lengths = index_data['document_lengths']
            
            file_size = os.path.getsize(file_path) / (1024 * 1024)  # MB
            logger.info(f"Index loaded from {file_path} ({file_size:.2f} MB) with {len(self.inverted_index)} terms and {len(self.document_lengths)} documents")
            return True
        except Exception as e:
            logger.error(f"Failed to load index from file: {e}")
            return False
    
    def index_file_exists(self, file_path: str = None) -> bool:
        """
        Check if index file exists.
        
        Args:
            file_path: Path to the index file (default: INDEX_FILE_PATH)
            
        Returns:
            True if file exists, False otherwise
        """
        if file_path is None:
            file_path = INDEX_FILE_PATH
        return os.path.exists(file_path)


# Global indexer instance
indexer = Indexer()
