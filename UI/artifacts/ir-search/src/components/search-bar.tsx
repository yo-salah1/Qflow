import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useLocation } from "wouter";
import { Search, Sparkles, ArrowRight, X } from "lucide-react";
import { getSuggestions } from "@/lib/search-engine";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initialQuery?: string;
  size?: "lg" | "default";
  autoFocus?: boolean;
  isLoading?: boolean;
}

export function SearchBar({ initialQuery = "", size = "default", autoFocus = false, isLoading = false }: SearchBarProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync query state with initialQuery prop when it changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Also sync with URL when component mounts (for direct URL access)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get("q") || "";
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim()) {
        try {
          const result = await getSuggestions(query);
          setSuggestions(result);
        } catch (error) {
          console.error("Failed to fetch suggestions:", error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
      setSelectedIndex(-1);
    };

    fetchSuggestions();
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLocation(`/results?q=${encodeURIComponent(searchQuery)}`);
    setIsFocused(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        setQuery(suggestions[selectedIndex]);
        handleSearch(suggestions[selectedIndex]);
      } else {
        handleSearch(query);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  const isLarge = size === "lg";

  return (
    <div className="relative w-full max-w-3xl mx-auto" ref={wrapperRef}>
      <div
        className={cn(
          "relative flex items-center w-full bg-card rounded-2xl border-2 transition-all duration-300 shadow-sm",
          isFocused ? "border-primary shadow-md shadow-primary/20 ring-4 ring-primary/10" : "border-border hover:border-primary/50",
          isLarge ? "h-16 px-6" : "h-12 px-4"
        )}
      >
        <Search className={cn("text-muted-foreground transition-colors", isFocused && "text-primary", isLarge ? "w-6 h-6 mr-3" : "w-5 h-5 mr-2")} />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for IR, NLP, Data Mining..."
          className={cn(
            "flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground w-full",
            isLarge ? "text-lg md:text-xl" : "text-base"
          )}
          autoFocus={autoFocus}
          spellCheck={false}
          autoComplete="off"
        />

        {query && (
          <button 
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              document.querySelector("input")?.focus();
            }}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => handleSearch(query)}
          disabled={isLoading}
          className={cn(
            "rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100",
            isLarge ? "h-10 px-6 ml-2" : "h-8 px-4 ml-1"
          )}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Search
            </>
          )}
        </button>
      </div>

      {isFocused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <ul className="py-2">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  className={cn(
                    "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors",
                    selectedIndex === index ? "bg-muted/80 text-primary" : "hover:bg-muted/50"
                  )}
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch(suggestion);
                  }}
                >
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{suggestion}</span>
                  {selectedIndex === index && <ArrowRight className="w-4 h-4 text-primary shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
