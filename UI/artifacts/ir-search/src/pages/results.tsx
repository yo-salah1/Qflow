import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SearchBar } from "@/components/search-bar";
import { search, SearchResult, EnhancedSearchResponse, tokenize } from "@/lib/search-engine";
import { ExternalLink, Sparkles, AlertCircle, Brain } from "lucide-react";
import { Link, useSearch, useLocation } from "wouter";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function useQueryParam(): string {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  return params.get("q") || "";
}

export default function Results() {
  const query = useQueryParam();
  const [, setLocation] = useLocation();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMode, setSearchMode] = useState<string>("hybrid");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true);
      try {
        const response: EnhancedSearchResponse = await search(query);
        setResults(response.results);
        setSearchMode(response.search_mode);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  // Helper to highlight query terms in snippet
  const highlightText = (text: string, queryStr: string) => {
    if (!queryStr) return text;
    const tokens = tokenize(queryStr);
    if (tokens.length === 0) return text;

    const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) => {
          if (tokens.includes(part.toLowerCase())) {
            return <strong key={i} className="text-primary bg-primary/10 rounded px-1">{part}</strong>;
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-background">
      {/* Sticky Header with Search */}
      <div className="sticky top-16 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b py-4 shadow-sm">
        <div className="container mx-auto px-4 max-w-4xl flex items-center gap-4">
          <div className="flex-1">
            <SearchBar initialQuery={query} isLoading={isLoading} />
          </div>
          <Link
            href={`/journey?q=${encodeURIComponent(query)}`}
            className="hidden md:flex shrink-0 items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-medium transition-colors border border-primary/20"
          >
            <Sparkles className="w-4 h-4" />
            See Pipeline
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-8 flex-1">
        {/* Search Mode Badge */}
        {!isLoading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 mb-6"
          >
            <p className="text-sm text-muted-foreground">
              Found {results.length} results for "{query}"
            </p>
            {searchMode === "semantic" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-semibold border border-purple-200 dark:border-purple-800">
                <Brain className="w-3 h-3" />
                Semantic Search
              </span>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            {/* Loading Header */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                duration: 0.6
              }}
              className="relative overflow-hidden"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/10 to-cyan-500/10 rounded-3xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-3xl" />

              {/* Animated Border */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-blue-500/20 to-cyan-500/20 p-[1px]">
                <div className="w-full h-full bg-background/95 rounded-3xl backdrop-blur-sm" />
              </div>

              {/* Content */}
              <div className="relative flex items-center gap-4 p-6">
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="relative"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                    <LoadingSpinner size="md" />
                  </div>
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-primary to-blue-500 rounded-2xl -z-10"
                  />
                </motion.div>

                <div className="flex-1 space-y-2">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      Searching for "{query}"
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 1, 0.3]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                          }}
                          className="w-2 h-2 bg-gradient-to-r from-primary to-blue-500 rounded-full"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Running TF-IDF + Semantic search pipeline...
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="shrink-0"
                >
                  <div className="px-4 py-2 bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-full">
                    <p className="text-xs font-medium text-primary flex items-center gap-1">
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 bg-primary rounded-full"
                      />
                      PROCESSING
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Progress Bar */}
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-cyan-500 rounded-full"
              />
            </motion.div>

            {/* Loading Skeletons */}
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-3"
                >
                  <div className="animate-pulse flex justify-between">
                    <div className="h-6 bg-muted rounded w-2/3" />
                    <div className="h-6 bg-muted rounded-full w-16 animate-pulse" />
                  </div>
                  <div className="animate-pulse h-4 bg-muted/50 rounded w-1/3" />
                  <div className="animate-pulse h-10 bg-muted/30 rounded w-full mt-2" />
                  <div className="flex gap-2 mt-2">
                    <div className="animate-pulse h-6 bg-muted/50 rounded-full w-16" />
                    <div className="animate-pulse h-6 bg-muted/50 rounded-full w-20" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        {!isLoading && results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, index) => (
              <motion.div
                key={result.doc_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <a
                  href={result.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-card hover:bg-accent/50 p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h2 className="text-xl font-semibold text-primary group-hover:underline decoration-2 underline-offset-4 line-clamp-2">
                      {result.title}
                    </h2>
                    <div className="shrink-0 flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <span className="text-xs font-bold uppercase tracking-wide">Score</span>
                      <span className="font-mono font-medium">{result.score.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3 truncate">
                    <span className="font-medium text-foreground/70">{result.url || 'No URL available'}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <p className="text-foreground/80 leading-relaxed mb-4">
                    {highlightText(result.snippet || '', query)}
                  </p>
                </a>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No results found</h3>
            <p className="text-muted-foreground max-w-md">
              We couldn't find any documents matching your query "{query}".
              Try searching for "IR", "TF-IDF", or "Google".
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
