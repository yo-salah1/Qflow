#!/usr/bin/env python3
"""
Standalone script to run the Wikipedia crawler and build the search index.
This script can be run independently to populate the database with documents.
"""

import sys
import os
import logging

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.crawler import wikipedia_crawler
from app.services.indexer import indexer
from app.db.supabase_client import supabase_client
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def main():
    """Main function to run the crawler and build the index."""
    logger.info("=" * 60)
    logger.info("QueryFlow Search Engine - Crawler Script")
    logger.info("=" * 60)
    
    try:
        # Step 1: Crawl documents from Wikipedia (skip duplicate check for speed)
        logger.info(f"Starting to crawl {settings.MAX_DOCUMENTS} documents from Wikipedia...")
        crawled_count = wikipedia_crawler.crawl_documents(limit=settings.MAX_DOCUMENTS, skip_duplicate_check=True)
        
        if crawled_count == 0:
            logger.warning("No documents were crawled. Exiting.")
            return
        
        logger.info(f"Successfully crawled {crawled_count} documents")
        
        # Step 2: Fetch all documents from database
        logger.info("Fetching documents from database...")
        documents = supabase_client.get_all_documents()
        logger.info(f"Retrieved {len(documents)} documents from database")
        
        # Step 3: Build inverted index
        logger.info("Building inverted index...")
        indexed_count = indexer.build_index_from_documents(documents)
        logger.info(f"Built index for {indexed_count} documents")
        
        # Step 4: Save index to database
        logger.info("Saving inverted index to database...")
        success = indexer.save_index_to_database()
        
        if success:
            logger.info("Index saved successfully")
        else:
            logger.error("Failed to save index to database")
            return
        
        # Step 5: Print statistics
        logger.info("=" * 60)
        logger.info("CRAWL COMPLETED SUCCESSFULLY")
        logger.info("=" * 60)
        logger.info(f"Documents crawled: {crawled_count}")
        logger.info(f"Documents indexed: {indexed_count}")
        logger.info(f"Total unique terms: {len(indexer.inverted_index)}")
        logger.info("=" * 60)
        
    except KeyboardInterrupt:
        logger.info("Crawler interrupted by user")
    except Exception as e:
        logger.error(f"Crawler failed with error: {e}")
        raise


if __name__ == "__main__":
    main()
