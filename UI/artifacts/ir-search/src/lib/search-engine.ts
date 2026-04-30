import { Document } from "./mock-data";

export interface SearchResult {
  doc_id: number;
  title: string;
  url: string | null;
  score: number;
  snippet: string | null;
  highlighted_snippet: string | null;
}

export interface EnhancedSearchResponse {
  results: SearchResult[];
  did_you_mean: string | null;
  search_mode: string;
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

// 2. API-based Search (returns enhanced response)
export async function search(query: string): Promise<EnhancedSearchResponse> {
  if (!query.trim()) return { results: [], did_you_mean: null, search_mode: "none" };

  try {
    // Use hybrid search endpoint (cache → TF-IDF → semantic)
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

    // Handle enhanced response format
    return {
      results: (data.results || []).map((item: any) => ({
        doc_id: item.doc_id,
        title: item.title,
        url: item.url,
        score: item.score,
        snippet: item.snippet || item.highlighted_snippet || "",
        highlighted_snippet: item.highlighted_snippet || null
      })),
      did_you_mean: data.did_you_mean || null,
      search_mode: data.search_mode || "hybrid"
    };
  } catch (error) {
    console.error("Search API error:", error);
    return { results: [], did_you_mean: null, search_mode: "error" };
  }
}

export async function getSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  try {
    // Use search API to get suggestions from titles
    const response = await search(query);
    return response.results.slice(0, 5).map(r => r.title);
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

    return {
      corpus: [],
      index: {},
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
