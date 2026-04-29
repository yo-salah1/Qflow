#!/usr/bin/env python3
"""
Script to populate document cache with documents from database
Run this after indexing to ensure fast document retrieval
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.document_cache import document_cache

def main():
    print("=" * 60)
    print("Populating Document Cache")
    print("=" * 60)
    
    # Populate cache with documents
    count = document_cache.populate_cache()
    
    if count > 0:
        print(f"✓ Successfully cached {count} documents")
        stats = document_cache.get_cache_stats()
        print(f"✓ Cache file: {stats['cache_file']}")
        print(f"✓ Cache size: {stats['cached_documents']} / {stats['max_size']}")
    else:
        print("✗ No documents were cached")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
