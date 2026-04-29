import requests
import logging
from typing import List, Dict, Optional, Tuple
from app.core.config import settings
from app.db.supabase_client import supabase_client

logger = logging.getLogger(__name__)


class WikipediaCrawler:
    """Wikipedia API crawler for fetching English documents."""
    
    def __init__(self):
        self.api_url = settings.WIKIPEDIA_API_URL
        self.session = requests.Session()
        # Add User-Agent header to avoid 403 errors
        self.session.headers.update({
            'User-Agent': 'QueryFlowSearchEngine/1.0 (https://github.com/QueryFlow; educational@queryflow.org)'
        })
    
    def get_random_pages(self, limit: int) -> List[str]:
        """
        Fetch random Wikipedia page titles.
        
        Args:
            limit: Number of random pages to fetch
            
        Returns:
            List of page titles
        """
        try:
            params = {
                'action': 'query',
                'list': 'random',
                'rnnamespace': 0,  # Main namespace only
                'rnlimit': limit,
                'format': 'json'
            }
            
            response = self.session.get(self.api_url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            titles = [page['title'] for page in data.get('query', {}).get('random', [])]
            
            logger.info(f"Fetched {len(titles)} random page titles")
            return titles
            
        except requests.RequestException as e:
            logger.error(f"Error fetching random pages: {e}")
            return []
    
    def get_page_content(self, title: str) -> Optional[Tuple[str, str, str]]:
        """
        Fetch the content of a specific Wikipedia page.
        
        Args:
            title: Page title
            
        Returns:
            Tuple of (title, content, url) or None if failed
        """
        try:
            params = {
                'action': 'query',
                'prop': 'extracts',
                'explaintext': True,
                'titles': title,
                'format': 'json'
            }
            
            response = self.session.get(self.api_url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            pages = data.get('query', {}).get('pages', {})
            
            for page_id, page_data in pages.items():
                if 'missing' in page_data:
                    logger.warning(f"Page not found: {title}")
                    return None
                
                content = page_data.get('extract', '')
                if not content or content.strip() == '':
                    logger.warning(f"Empty content for page: {title}")
                    return None
                
                # Build Wikipedia URL
                url = f"https://en.wikipedia.org/wiki/{page_data['title'].replace(' ', '_')}"
                
                return (page_data['title'], content, url)
            
            return None
            
        except requests.RequestException as e:
            logger.error(f"Error fetching page content for '{title}': {e}")
            return None
    
    def crawl_documents(self, limit: int = 3000, skip_duplicate_check: bool = False) -> int:
        """
        Crawl documents from Wikipedia and store them in the database.
        
        Args:
            limit: Maximum number of documents to crawl
            skip_duplicate_check: Skip checking for existing documents (faster for initial crawl)
            
        Returns:
            Number of documents successfully crawled
        """
        logger.info(f"Starting to crawl {limit} documents from Wikipedia")
        if skip_duplicate_check:
            logger.info("Skipping duplicate check for faster initial crawl")
        
        crawled_count = 0
        batch_size = settings.CRAWL_BATCH_SIZE
        
        while crawled_count < limit:
            # Determine how many pages to fetch in this batch
            batch_limit = min(batch_size, limit - crawled_count)
            
            # Fetch random page titles
            titles = self.get_random_pages(batch_limit)
            if not titles:
                logger.warning("No titles fetched, stopping crawl")
                break
            
            # Fetch content for each title
            documents_to_insert = []
            
            for title in titles:
                # Check if document already exists (unless skipped)
                if not skip_duplicate_check and supabase_client.document_exists(title):
                    logger.debug(f"Document already exists: {title}")
                    continue
                
                # Fetch page content
                page_data = self.get_page_content(title)
                if page_data:
                    doc_title, content, url = page_data
                    documents_to_insert.append({
                        'title': doc_title,
                        'content': content,
                        'url': url
                    })
            
            # Batch insert documents
            if documents_to_insert:
                inserted_ids = supabase_client.batch_insert_documents(documents_to_insert)
                crawled_count += len(inserted_ids)
                logger.info(f"Inserted {len(inserted_ids)} documents. Total: {crawled_count}/{limit}")
            
            # If no new documents were inserted, break to avoid infinite loop
            if not documents_to_insert:
                logger.warning("No new documents inserted in this batch, stopping crawl")
                break
        
        logger.info(f"Crawling completed. Total documents crawled: {crawled_count}")
        return crawled_count


# Global crawler instance
wikipedia_crawler = WikipediaCrawler()
