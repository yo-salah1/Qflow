#!/usr/bin/env python3
"""
Test hybrid search functionality
Shows cache-first search with database fallback
"""

import sys
import os
import time

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.hybrid_search import hybrid_search_service
from app.services.search import search_service

def test_search(search_func, name, query, iterations=3):
    """Test a search function and measure timing"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"Query: '{query}'")
    print(f"{'='*60}")
    
    total_time = 0
    for i in range(iterations):
        start = time.time()
        results = search_func(query)
        elapsed = time.time() - start
        total_time += elapsed
        
        if i == 0:  # Show results from first run
            print(f"\nResults ({len(results)} found):")
            for j, r in enumerate(results[:5], 1):
                print(f"  {j}. {r.title} (Score: {r.score:.4f})")
            if len(results) > 5:
                print(f"  ... and {len(results) - 5} more")
        
        print(f"  Run {i+1}: {elapsed*1000:.2f}ms")
    
    avg_time = (total_time / iterations) * 1000
    print(f"\nAverage time: {avg_time:.2f}ms")
    return avg_time

def main():
    print("="*60)
    print("Hybrid Search Test")
    print("="*60)
    
    # Test queries
    queries = [
        "tennis",
        "electrical workers",
        "beetle",
        "python programming",
        "artificial intelligence"
    ]
    
    for query in queries:
        # Test regular database search
        db_time = test_search(
            lambda q: search_service.search(q, limit=10),
            "Regular DB Search (Inverted Index)",
            query
        )
        
        # Test hybrid search (cache first)
        hybrid_time = test_search(
            lambda q: hybrid_search_service.hybrid_search(q, limit=10),
            "Hybrid Search (Cache → DB Fallback)",
            query
        )
        
        # Compare
        speedup = db_time / hybrid_time if hybrid_time > 0 else 0
        print(f"\n⚡ Speed improvement: {speedup:.2f}x faster" if speedup > 1 else f"\n⚠ Similar performance")
        print("\n" + "="*60)

if __name__ == "__main__":
    main()
