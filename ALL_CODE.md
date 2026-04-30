# Consolidated Source Code

This file contains the relevant project source code extracted into a single document. Each section begins with the original file path and name.

---

## File: API/app/api/routes.py
```python
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import logging
from app.models.schemas import HealthResponse, SearchResponse, CrawlResponse, SearchResult, SearchKeywordStat, EnhancedSearchResponse
from app.services.search import search_service
from app.services.hybrid_search import hybrid_search_service
from app.services.semantic_search import semantic_search_service
from app.services.crawler import wikipedia_crawler
from app.services.indexer import indexer
from app.db.supabase_client import supabase_client
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/healthz", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    try:
        # Check database connection
        doc_count = supabase_client.get_document_count()
        return HealthResponse(status="ok")
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")


@router.get("/search", response_model=List[SearchResult])
async def search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(default=10, ge=1, le=settings.MAX_SEARCH_LIMIT, description="Number of results"),
    offset: int = Query(default=0, ge=0, description="Pagination offset")
):
    """
    Search for documents using the query.
    
    Supports wildcard patterns:
    - Prefix: comput*
    - Suffix: *ing
    - Single character: te?t
    """
    try:
        if not q or not q.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        supabase_client.log_search_query(q)
        results = search_service.search(query=q, limit=limit, offset=offset)
        return results
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/search-hybrid", response_model=EnhancedSearchResponse)
async def hybrid_search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(default=10, ge=1, le=settings.MAX_SEARCH_LIMIT, description="Number of results"),
    offset: int = Query(default=0, ge=0, description="Pagination offset")
):
    """Enhanced hybrid search: cache → database TF-IDF → semantic fallback."""
    try:
        if not q or not q.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        supabase_client.log_search_query(q)
        response = hybrid_search_service.hybrid_search(query=q, limit=limit, offset=offset)
        return response
    except Exception as e:
        logger.error(f"Hybrid search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/search-semantic", response_model=List[SearchResult])
async def semantic_search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(default=10, ge=1, le=settings.MAX_SEARCH_LIMIT, description="Number of results")
):
    """Semantic search using embeddings to find conceptually similar content."""
    try:
        if not q or not q.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        supabase_client.log_search_query(q)
        results = semantic_search_service.semantic_search(query=q, limit=limit)
        return results
    except Exception as e:
        logger.error(f"Semantic search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/search-keywords/top", response_model=List[SearchKeywordStat])
async def get_top_search_keywords(
    limit: int = Query(default=10, ge=1, le=50, description="Number of top queries to return")
):
    """Return the most searched keywords."""
    try:
        top_queries = supabase_client.get_top_search_queries(limit=limit)
        return top_queries
    except Exception as e:
        logger.error(f"Top search keywords error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve top search keywords")


@router.post("/crawl/start", response_model=CrawlResponse)
async def start_crawler():
    """
    Start the Wikipedia crawler to fetch and index documents.
    
    This will:
    1. Fetch random Wikipedia pages
    2. Store them in the database
    3. Build the inverted index
    """
    try:
        logger.info("Starting crawler")
        
        # Crawl documents
        crawled_count = wikipedia_crawler.crawl_documents(limit=settings.MAX_DOCUMENTS)
        
        if crawled_count == 0:
            return CrawlResponse(
                status="completed",
                documents_crawled=0,
                message="No new documents were crawled"
            )
        
        # Build index
        logger.info("Building inverted index")
        documents = supabase_client.get_all_documents()
        indexer.build_index_from_documents(documents)
        
        # Save index to database
        indexer.save_index_to_database()
        
        return CrawlResponse(
            status="completed",
            documents_crawled=crawled_count,
            message=f"Successfully crawled and indexed {crawled_count} documents"
        )
        
    except Exception as e:
        logger.error(f"Crawler error: {e}")
        raise HTTPException(status_code=500, detail=f"Crawler failed: {str(e)}")


@router.get("/stats")
async def get_stats():
    """Get statistics about the indexed documents."""
    try:
        doc_count = supabase_client.get_document_count()
        terms = supabase_client.get_all_terms()
        
        return {
            "total_documents": doc_count,
            "total_terms": len(terms),
            "max_documents": settings.MAX_DOCUMENTS
        }
        
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")


@router.post("/index/rebuild")
async def rebuild_index():
    """
    Rebuild the inverted index from existing documents.
    """
    try:
        logger.info("Rebuilding inverted index")
        
        # Clear existing index
        indexer.clear_index()
        supabase_client.clear_index()
        
        # Fetch all documents
        documents = supabase_client.get_all_documents()
        
        if not documents:
            return {"status": "completed", "message": "No documents to index"}
        
        # Build index
        indexer.build_index_from_documents(documents)
        
        # Save index to database
        indexer.save_index_to_database()
        
        return {
            "status": "completed",
            "message": f"Index rebuilt for {len(documents)} documents"
        }
        
    except Exception as e:
        logger.error(f"Index rebuild error: {e}")
        raise HTTPException(status_code=500, detail=f"Index rebuild failed: {str(e)}")
```

---

## File: API/app/db/supabase_client.py
```python
from supabase import create_client, Client
from app.core.config import settings
from typing import List, Dict, Any, Optional
from datetime import datetime
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

    def log_search_query(self, query: str) -> bool:
        """Log a search query to the search_logs table."""
        try:
            self.client.table('search_logs').insert({
                'query': query,
                'created_at': datetime.utcnow().isoformat()
            }).execute()
            return True
        except Exception as e:
            logger.error(f"Error logging search query '{query}': {e}")
            return False

    def get_top_search_queries(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Return top search queries aggregated by count."""
        try:
            response = self.client.table('search_logs').select('query').execute()
            data = response.data if response.data else []
            counts: Dict[str, int] = {}
            for row in data:
                query = row.get('query')
                if not query:
                    continue
                counts[query] = counts.get(query, 0) + 1
            sorted_queries = sorted(counts.items(), key=lambda item: item[1], reverse=True)
            return [{'query': query, 'count': count} for query, count in sorted_queries[:limit]]
        except Exception as e:
            logger.error(f"Error fetching top search queries: {e}")
            return []


# Global Supabase client instance
supabase_client = SupabaseClient()
```

---

## File: UI/artifacts/ir-search/src/lib/search-engine.ts
```typescript
import { Document } from "./mock-data";

export interface SearchResult {
  doc_id: number;
  title: string;
  url: string | null;
  score: number;
  snippet: string | null;
  highlighted_snippet: string | null;
}

export interface InvertedIndex {
  [term: string]: {
    [docId: string]: number; // term frequency in this doc
  };
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in",
  "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the",
  "their", "then", "there", "these", "they", "this", "to", "was", "will", "with",
  "how", "what", "where", "why", "when", "who"
]);

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// 1. Tokenization & Processing
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .split(/\s+/)
    .filter(token => token.length > 0 && !STOP_WORDS.has(token));
}

// 2. API-based Search
export async function search(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  try {
    // Use hybrid search endpoint (cache first, then database)
    const response = await fetch(
      `${API_BASE_URL}/api/search-hybrid?q=${encodeURIComponent(query)}&limit=10&offset=0`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform API response to SearchResult format
    return data.map((item: any) => ({
      doc_id: item.doc_id,
      title: item.title,
      url: item.url,
      score: item.score,
      snippet: item.snippet || item.highlighted_snippet || "",
      highlighted_snippet: item.highlighted_snippet || null
    }));
  } catch (error) {
    console.error("Search API error:", error);
    // Fallback to empty results on error
    return [];
  }
}

export async function getSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  try {
    // Use search API to get suggestions from titles
    const results = await search(query);
    return results.slice(0, 5).map(r => r.title);
  } catch (error) {
    console.error("Suggestions API error:", error);
    return [];
  }
}

export async function getJourneyData() {
  try {
    // Get stats from API
    const statsResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!statsResponse.ok) {
      throw new Error("Failed to fetch stats");
    }
    const stats = await statsResponse.json();

    // Get documents for journey visualization
    // Note: This would need a documents endpoint, for now return mock data structure
    return {
      corpus: [], // Would need a /api/documents endpoint
      index: {}, // Would need a /api/index endpoint
      totalDocs: stats.total_documents || 0
    };
  } catch (error) {
    console.error("Journey data API error:", error);
    return {
      corpus: [],
      index: {},
      totalDocs: 0
    };
  }
}

export interface SearchKeywordStat {
  query: string;
  count: number;
}

export async function getTopSearchKeywords(limit: number = 10): Promise<SearchKeywordStat[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search-keywords/top?limit=${limit}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch top search keywords');
    }

    return await response.json();
  } catch (error) {
    console.error('Top search keywords API error:', error);
    return [];
  }
}
```

---

## File: UI/artifacts/ir-search/src/App.tsx
```tsx
import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Results from "@/pages/results";
import Journey from "@/pages/journey";
import Dashboard from "@/pages/dashboard";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/results" component={Results} />
        <Route path="/journey" component={Journey} />
        <Route path="/dashboard" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

---

## File: UI/artifacts/ir-search/src/pages/dashboard.tsx
```tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { getTopSearchKeywords, SearchKeywordStat } from "@/lib/search-engine";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Dashboard() {
    const [topKeywords, setTopKeywords] = useState<SearchKeywordStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadKeywords = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await getTopSearchKeywords(10);
                setTopKeywords(data);
            } catch (err) {
                console.error(err);
                setError("Unable to load top search keywords.");
            } finally {
                setIsLoading(false);
            }
        };

        loadKeywords();
    }, []);

    return (
        <div className="flex-1 min-h-screen bg-slate-50 dark:bg-background text-foreground">
            <div className="container mx-auto px-4 py-10 max-w-5xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-primary font-semibold uppercase tracking-[0.3em]">Dashboard</p>
                        <h1 className="text-4xl font-extrabold tracking-tight">Top Search Keywords</h1>
                        <p className="mt-3 text-muted-foreground max-w-2xl">
                            Here are the most searched queries tracked from user search activity.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>

                <div className="grid gap-6">
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div>
                                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Search activity</p>
                                <h2 className="text-2xl font-semibold">Most Frequently Searched</h2>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-primary">
                                <TrendingUp className="w-4 h-4" />
                                Real-time
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : error ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                                {error}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {topKeywords.length === 0 ? (
                                    <div className="rounded-2xl border border-border/50 bg-muted/10 p-6 text-center text-muted-foreground">
                                        No search keyword data available yet.
                                    </div>
                                ) : (
                                    <motion.ul
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3"
                                    >
                                        {topKeywords.map((keyword, index) => (
                                            <motion.li
                                                key={keyword.query}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="rounded-3xl border border-border/70 bg-background p-5 shadow-sm flex items-center justify-between gap-4"
                                            >
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Rank #{index + 1}</p>
                                                    <p className="text-lg font-semibold">{keyword.query}</p>
                                                </div>
                                                <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                                                    {keyword.count} searches
                                                </div>
                                            </motion.li>
                                        ))}
                                    </motion.ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
```

---

## File: UI/artifacts/ir-search/src/pages/home.tsx
```tsx
import { Link } from "wouter";
import { motion } from "framer-motion";
import { SearchBar } from "@/components/search-bar";
import { Footer } from "@/components/footer";
import { ArrowUpRight, Database, Search, Sparkles, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden bg-gradient-to-b from-background to-muted/30">
      {/* Abstract Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto text-center space-y-10"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            className="w-20 h-20 mx-auto bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300"
          >
            <Search className="w-10 h-10" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">QueryFlow</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            A visual playground to explore how search engines crawl, process, index, and rank information.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full pt-4"
        >
          <SearchBar size="lg" autoFocus />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="pt-12 flex flex-col items-center gap-4"
        >
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Curious how it works under the hood?
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/journey"
              className="group flex items-center gap-2 px-6 py-3 bg-card hover:bg-muted border rounded-full shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-sm font-semibold"
            >
              <Sparkles className="w-4 h-4 text-primary group-hover:animate-pulse" />
              Take the Data Journey
              <span className="text-primary ml-1 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full shadow-sm hover:bg-primary/90 transition-all text-sm font-semibold"
            >
              <ArrowUpRight className="w-4 h-4" />
              Top Search Keywords
            </Link>
          </div>
        </motion.div>
      </motion.div>
      {/* Features grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 mb-16 px-4"
      >
        <FeatureCard
          icon={Database}
          title="Inverted Index"
          desc="See how text is tokenized and stored for O(1) lookup speeds."
        />
        <FeatureCard
          icon={Zap}
          title="TF-IDF Ranking"
          desc="Understand how term frequency and inverse document frequency calculate relevance."
        />
        <FeatureCard
          icon={Search}
          title="Real-time Search"
          desc="Experience a mock corpus search running entirely in your browser."
        />
      </motion.div>
      <Footer />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
```

---

## File: API/app/models/schemas.py
```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class DocumentBase(BaseModel):
    """Base document schema."""
    title: str
    content: str
    url: Optional[str] = None


class Document(DocumentBase):
    """Document schema with ID."""
    id: int
    
    class Config:
        from_attributes = True


class DocumentCreate(DocumentBase):
    """Schema for creating a document."""
    pass


class IndexEntry(BaseModel):
    """Inverted index entry schema."""
    term: str
    doc_id: int
    frequency: int
    positions: List[int]
    
    class Config:
        from_attributes = True


class IndexEntryCreate(BaseModel):
    """Schema for creating an index entry."""
    term: str
    doc_id: int
    frequency: int
    positions: List[int]


class SearchResult(BaseModel):
    """Search result schema."""
    doc_id: int
    title: str
    url: Optional[str] = None
    score: float
    snippet: Optional[str] = None
    highlighted_snippet: Optional[str] = None


class SearchKeywordStat(BaseModel):
    """Most searched keyword statistics."""
    query: str
    count: int


class SearchResponse(BaseModel):
    """Search response schema."""
    results: List[SearchResult]
    total: int
    limit: int
    offset: int


class EnhancedSearchResponse(BaseModel):
    """Enhanced search response with search mode indicator."""
    results: List[SearchResult]
    did_you_mean: Optional[str] = None
    search_mode: str = "hybrid"


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str


class CrawlResponse(BaseModel):
    """Crawler response schema."""
    status: str
    documents_crawled: Optional[int] = None
    message: Optional[str] = None


class SearchRequest(BaseModel):
    """Search request schema."""
    query: str = Field(..., min_length=1, description="Search query")
    limit: Optional[int] = Field(10, ge=1, le=100, description="Number of results to return")
    offset: Optional[int] = Field(0, ge=0, description="Offset for pagination")
```

---

## File: API/app/services/spell_correction.py
```python
"""Spell Correction Service - corrects misspelled search terms using indexed vocabulary."""
import re, difflib, logging
from typing import List, Optional

logger = logging.getLogger(__name__)

class SpellCorrector:
    def __init__(self):
        self._vocabulary: set = set()
        self._loaded = False

    def _ensure_vocabulary(self):
        if self._loaded:
            return
        from app.services.document_cache import document_cache
        for doc in document_cache.documents.values():
            self._vocabulary.update(re.findall(r'[a-zA-Z]{3,}', doc.get('title', '').lower()))
            self._vocabulary.update(re.findall(r'[a-zA-Z]{3,}', doc.get('content', '')[:300].lower()))
        from app.services.indexer import indexer
        for term in indexer.inverted_index.keys():
            if len(term) >= 3:
                self._vocabulary.add(term)
        self._loaded = True

    def correct_query(self, raw_query: str) -> Optional[str]:
        self._ensure_vocabulary()
        if not self._vocabulary:
            return None
        words = raw_query.strip().split()
        corrected_words, was_corrected = [], False
        for word in words:
            clean = re.sub(r'[^a-zA-Z]', '', word).lower()
            if not clean or len(clean) <= 2 or clean in self._vocabulary:
                corrected_words.append(word)
            else:
                matches = difflib.get_close_matches(clean, list(self._vocabulary), n=1, cutoff=0.6)
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
        self._vocabulary.clear()
        self._loaded = False
        self._ensure_vocabulary()

spell_corrector = SpellCorrector()
```

---

## File: API/app/services/hybrid_search.py
```python
"""Hybrid Search: cache first → database TF-IDF → semantic fallback."""
import logging
from typing import List, Dict, Set, Tuple
from app.services.document_cache import document_cache
from app.services.indexer import indexer, TextPreprocessor
from app.models.schemas import SearchResult, EnhancedSearchResponse

logger = logging.getLogger(__name__)

class HybridSearchService:
    def __init__(self):
        self.preprocessor = TextPreprocessor()
        self.cache_index: Dict[int, Set[str]] = {}
        self._load_cache_index()

    def _load_cache_index(self):
        self.cache_index.clear()
        for doc_id, doc in document_cache.documents.items():
            self.cache_index[doc_id] = set(self.preprocessor.preprocess(
                doc.get('title', '') + ' ' + doc.get('content', '')))

    def _ensure_cache_index(self):
        if len(self.cache_index) != len(document_cache.documents):
            self._load_cache_index()

    def search_in_cache(self, query: str, limit: int = 10) -> List[SearchResult]:
        query_terms = self.preprocessor.preprocess(query)
        if not query_terms:
            return []
        self._ensure_cache_index()
        query_set = set(query_terms)
        scored = []
        for doc in document_cache.documents.values():
            doc_id = doc.get('id')
            if doc_id is None:
                continue
            doc_set = self.cache_index.get(doc_id, set())
            matches = len(query_set.intersection(doc_set))
            if matches == 0:
                continue
            score = matches / len(doc_set) if doc_set else 0
            title_terms = set(self.preprocessor.preprocess(doc.get('title', '')))
            score += len(query_set.intersection(title_terms)) * 0.3
            if score >= 0.1:
                scored.append((doc_id, doc.get('title', ''), doc.get('content', ''), score))
        scored.sort(key=lambda x: x[3], reverse=True)
        results = []
        for doc_id, title, content, score in scored[:limit]:
            snippet = content[:200] + '...' if len(content) > 200 else content
            results.append(SearchResult(doc_id=doc_id, title=title,
                url=document_cache.documents.get(doc_id, {}).get('url'),
                score=round(min(score, 1.0), 4), snippet=snippet, highlighted_snippet=snippet))
        return results

    def hybrid_search(self, query: str, limit: int = 10, offset: int = 0) -> EnhancedSearchResponse:
        cache_results = self.search_in_cache(query, limit=limit)
        if cache_results:
            return EnhancedSearchResponse(results=cache_results, search_mode="cache")
        from app.services.search import search_service
        db_results = search_service.search(query, limit, offset)
        if db_results:
            return EnhancedSearchResponse(results=db_results, search_mode="database")
        try:
            from app.services.semantic_search import semantic_search_service
            sem_results = semantic_search_service.semantic_search(query, limit=limit)
            if sem_results:
                return EnhancedSearchResponse(results=sem_results, search_mode="semantic")
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
        return EnhancedSearchResponse(results=[], search_mode="none")

hybrid_search_service = HybridSearchService()
```

---

## File: API/app/services/semantic_search.py
```python
"""Semantic Search Service - embedding-based meaning search."""
import logging
from typing import List, Dict
import numpy as np

logger = logging.getLogger(__name__)

class SemanticSearchService:
    def __init__(self):
        self._model = None
        self._title_embeddings: Dict[int, np.ndarray] = {}
        self._title_map: Dict[int, dict] = {}
        self._titles_loaded = False

    def _ensure_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer('all-MiniLM-L6-v2')

    def _ensure_title_embeddings(self):
        if self._titles_loaded:
            return
        from app.services.document_cache import document_cache
        docs = document_cache.documents
        if not docs:
            return
        self._ensure_model()
        titles, doc_ids = [], []
        for doc_id, doc in docs.items():
            title = doc.get('title', '')
            if title:
                titles.append(title)
                doc_ids.append(doc_id)
                self._title_map[doc_id] = doc
        if titles:
            embeddings = self._model.encode(titles, batch_size=64, show_progress_bar=False)
            for i, doc_id in enumerate(doc_ids):
                self._title_embeddings[doc_id] = embeddings[i]
        self._titles_loaded = True

    def encode_text(self, text: str) -> List[float]:
        self._ensure_model()
        return self._model.encode(text).tolist()

    def semantic_search(self, query: str, limit: int = 10) -> List[dict]:
        from app.models.schemas import SearchResult
        self._ensure_title_embeddings()
        if not self._title_embeddings:
            return []
        self._ensure_model()
        query_emb = self._model.encode(query)
        similarities = []
        for doc_id, title_emb in self._title_embeddings.items():
            sim = float(np.dot(query_emb, title_emb) /
                        (np.linalg.norm(query_emb) * np.linalg.norm(title_emb) + 1e-8))
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
                results.append(SearchResult(doc_id=doc_id, title=doc['title'],
                    url=doc.get('url'), score=round(score, 4),
                    snippet=snippet, highlighted_snippet=snippet))
        return results

    def reload_embeddings(self):
        self._title_embeddings.clear()
        self._title_map.clear()
        self._titles_loaded = False

semantic_search_service = SemanticSearchService()
```

---
