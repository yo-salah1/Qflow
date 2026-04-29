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
