# QueryFlow Search Engine Backend

A production-ready search engine backend system built with Python, FastAPI, Supabase, and Wikipedia API. Features TF-IDF ranking, inverted indexing, and wildcard search support.

## Features

- **Wikipedia Crawler**: Fetches up to 3000 English documents from Wikipedia API
- **Inverted Index**: Efficient term-based document indexing with positions
- **TF-IDF Ranking**: Standard information retrieval ranking algorithm
- **Wildcard Search**: Support for prefix (*), suffix (*), and single character (?) patterns
- **Snippet Generation**: Extracts relevant snippets from search results
- **Query Highlighting**: Highlights matching terms in results
- **Pagination**: Supports limit and offset for result pagination
- **REST API**: Clean FastAPI endpoints with OpenAPI documentation

## Tech Stack

- **Python 3.10+**
- **FastAPI** - Web framework
- **Supabase** - PostgreSQL database
- **Wikipedia API** - Document source
- **NLTK** - Text preprocessing and stemming
- **Pydantic** - Data validation

## Project Structure

```
project/
│
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── api/
│   │   └── routes.py        # API endpoints
│   ├── core/
│   │   └── config.py        # Configuration settings
│   ├── services/
│   │   ├── crawler.py       # Wikipedia crawler
│   │   ├── indexer.py       # Document indexing
│   │   ├── ranking.py       # TF-IDF ranking
│   │   └── search.py        # Search service
│   ├── db/
│   │   └── supabase_client.py  # Database client
│   └── models/
│       └── schemas.py       # Pydantic models
│
├── scripts/
│   └── run_crawler.py       # Standalone crawler script
│
├── requirements.txt          # Python dependencies
└── README.md               # This file
```

## Setup Instructions

### 1. Prerequisites

- Python 3.10 or higher
- Supabase account (free tier works)
- pip package manager

### 2. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Navigate to the SQL Editor in your Supabase dashboard
3. Run the following SQL to create the required tables:

```sql
-- Documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL
);

-- Inverted index table
CREATE TABLE inverted_index (
    id SERIAL PRIMARY KEY,
    term TEXT NOT NULL,
    doc_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    frequency INTEGER NOT NULL,
    positions INTEGER[] NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_inverted_index_term ON inverted_index(term);
CREATE INDEX idx_inverted_index_doc_id ON inverted_index(doc_id);
CREATE INDEX idx_documents_title ON documents(title);
```
-- Option 1: Disable RLS entirely (simplest for development)
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE inverted_index DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS with permissive policies (recommended for production)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inverted_index ENABLE ROW LEVEL SECURITY;

-- Allow all operations on documents
CREATE POLICY "Enable all access on documents" ON documents
  FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on inverted_index
CREATE POLICY "Enable all access on inverted_index" ON inverted_index
  FOR ALL USING (true) WITH CHECK (true);
### 3. Get Supabase Credentials

1. Go to Project Settings → API
2. Copy your:
   - Project URL
   - anon/public API Key

### 4. Environment Configuration

Create a `.env` file in the project root:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```

### 6. Download NLTK Data

The application will automatically download required NLTK data on first run, but you can also do it manually:

```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

## Running the Application

### Option 1: Run with Uvicorn (Development)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Option 2: Run the Python Script

```bash
python -m app.main
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Crawling Documents

### Option 1: Via API Endpoint

```bash
curl -X POST http://localhost:8000/api/crawl/start
```

### Option 2: Standalone Script

```bash
python scripts/run_crawler.py
```

This will:
1. Fetch random Wikipedia pages (up to 3000)
2. Store them in the database
3. Build the inverted index
4. Save the index to Supabase

## API Endpoints

### Health Check

```bash
GET /api/healthz
```

Response:
```json
{
  "status": "ok"
}
```

### Search

```bash
GET /api/search?q=data mining&limit=10&offset=0
```

Response:
```json
[
  {
    "doc_id": 12,
    "title": "Data Mining",
    "score": 0.92,
    "snippet": "Data mining is the process of discovering patterns...",
    "highlighted_snippet": "**data** **mining** is the process of discovering patterns..."
  }
]
```

**Query Parameters:**
- `q` (required): Search query string
- `limit` (optional, default=10): Number of results (1-100)
- `offset` (optional, default=0): Pagination offset

**Wildcard Search Examples:**
- Prefix: `comput*` matches "computer", "computing", "computation"
- Suffix: `*ing` matches "mining", "learning", "processing"
- Single char: `te?t` matches "test", "text", "tent"

### Start Crawler

```bash
POST /api/crawl/start
```

Response:
```json
{
  "status": "completed",
  "documents_crawled": 3000,
  "message": "Successfully crawled and indexed 3000 documents"
}
```

### Get Statistics

```bash
GET /api/stats
```

Response:
```json
{
  "total_documents": 3000,
  "total_terms": 45000,
  "max_documents": 3000
}
```

### Rebuild Index

```bash
POST /api/index/rebuild
```

Rebuilds the inverted index from existing documents in the database.

## Architecture Overview

### Crawler Module
- Uses Wikipedia API to fetch random English pages
- Extracts title and plain text content
- Handles duplicates and errors gracefully
- Batch inserts documents for performance

### Indexer Module
- Text preprocessing pipeline:
  1. Punctuation removal
  2. Lowercasing
  3. Tokenization (spaces and commas)
  4. Stopword removal (NLTK)
  5. Porter stemming
- Builds inverted index with term positions
- Stores index in Supabase for persistence

### Ranking Module
- Implements TF-IDF algorithm:
  - TF (Term Frequency): Count of term in document
  - IDF (Inverse Document Frequency): log(N / df)
  - Score: Sum of TF * IDF for all query terms
- Supports normalized TF-IDF (TF divided by document length)

### Search Module
- Preprocesses user queries
- Expands wildcard patterns to matching terms
- Retrieves candidate documents from inverted index
- Ranks documents using TF-IDF
- Generates snippets with highlighted terms
- Supports pagination

## Performance Optimizations

- **Batch Operations**: Documents and index entries inserted in batches
- **Memory Caching**: Inverted index cached in memory for fast lookups
- **Database Indexes**: Optimized indexes on term and doc_id columns
- **Connection Pooling**: Supabase client manages connections efficiently

## Error Handling

The API includes comprehensive error handling:
- Empty query validation
- API failure handling
- Database error logging
- Proper HTTP status codes (400, 500, 503)

## Configuration

Edit `app/core/config.py` to customize:

```python
CRAWL_BATCH_SIZE: int = 50        # Documents per batch
MAX_DOCUMENTS: int = 3000          # Maximum documents to crawl
DEFAULT_SEARCH_LIMIT: int = 10     # Default results per page
MAX_SEARCH_LIMIT: int = 100        # Maximum results per page
SNIPPET_LENGTH: int = 200         # Characters in snippet
ENABLE_CACHE: bool = True         # Enable in-memory caching
```

## Example Usage

### Python Client Example

```python
import requests

# Search for documents
response = requests.get(
    "http://localhost:8000/api/search",
    params={"q": "machine learning", "limit": 5}
)

results = response.json()
for result in results:
    print(f"{result['title']} (score: {result['score']})")
    print(f"Snippet: {result['snippet']}\n")
```

### cURL Example

```bash
# Search with wildcard
curl "http://localhost:8000/api/search?q=comput*&limit=5"

# Start crawler
curl -X POST "http://localhost:8000/api/crawl/start"

# Get stats
curl "http://localhost:8000/api/stats"
```

## Troubleshooting

### NLTK Data Not Found

If you see NLTK data errors, run:
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### Supabase Connection Issues

- Verify your `.env` file has correct credentials
- Check that your Supabase project is active
- Ensure the tables are created in your database

### Crawler Returns 0 Documents

- Check your internet connection
- Wikipedia API may be rate-limited
- Verify Supabase connection is working

## License

This project is provided as-is for educational and development purposes.

## Contributing

This is a demonstration project. Feel free to extend it with:
- More sophisticated ranking algorithms (BM25, PageRank)
- Query expansion and relevance feedback
- Document categorization
- Search analytics and logging
- Caching layer with Redis
