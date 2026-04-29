export interface Document {
  id: string;
  title: string;
  url: string;
  snippet: string;
  tags: string[];
}

export const MOCK_CORPUS: Document[] = [
  {
    id: "doc_1",
    title: "Introduction to Information Retrieval",
    url: "https://nlp.stanford.edu/ir/",
    snippet: "Information retrieval is the activity of obtaining information system resources that are relevant to an information need from a collection of those resources.",
    tags: ["IR", "NLP", "Basics"]
  },
  {
    id: "doc_2",
    title: "Understanding TF-IDF in Machine Learning",
    url: "https://towardsdatascience.com/tf-idf-explained",
    snippet: "Term frequency-inverse document frequency is a numerical statistic that is intended to reflect how important a word is to a document in a collection or corpus.",
    tags: ["Machine Learning", "NLP", "TF-IDF"]
  },
  {
    id: "doc_3",
    title: "How Google Search Works",
    url: "https://google.com/search/how-it-works/",
    snippet: "Google search uses web crawlers to find pages, stores them in an index, and uses complex ranking algorithms to return the most relevant results for your query.",
    tags: ["Search Engine", "Crawling", "Indexing"]
  },
  {
    id: "doc_4",
    title: "Web Crawling and Data Mining",
    url: "https://data-mining.org/crawlers",
    snippet: "A web crawler, sometimes called a spider or spiderbot, is an internet bot that systematically browses the World Wide Web, typically operated by search engines for web indexing.",
    tags: ["Data Mining", "Crawling"]
  },
  {
    id: "doc_5",
    title: "The Inverted Index Structure",
    url: "https://en.wikipedia.org/wiki/Inverted_index",
    snippet: "An inverted index is a database index storing a mapping from content, such as words or numbers, to its locations in a document or a set of documents.",
    tags: ["Indexing", "Database"]
  },
  {
    id: "doc_6",
    title: "Natural Language Processing with Python",
    url: "https://nltk.org/book/",
    snippet: "This book offers a highly accessible introduction to natural language processing, the field that supports a variety of language technologies, from predictive text to search.",
    tags: ["NLP", "Python"]
  },
  {
    id: "doc_7",
    title: "PageRank: The Algorithm that Built Google",
    url: "https://cs.stanford.edu/pagerank",
    snippet: "PageRank works by counting the number and quality of links to a page to determine a rough estimate of how important the website is.",
    tags: ["Algorithms", "Ranking", "Search Engine"]
  },
  {
    id: "doc_8",
    title: "Tokenization in Text Processing",
    url: "https://nlp.stanford.edu/tokenization",
    snippet: "Tokenization is the process of demarcating and possibly classifying sections of a string of input characters. The resulting tokens are then passed to some other form of processing.",
    tags: ["NLP", "Tokenization"]
  },
  {
    id: "doc_9",
    title: "Stop Words in Search Engines",
    url: "https://seojournal.com/stop-words",
    snippet: "In computing, stop words are words which are filtered out before or after processing of natural language data. Most search engines do not use them to save space.",
    tags: ["Processing", "NLP", "SEO"]
  },
  {
    id: "doc_10",
    title: "Vector Space Model for Search",
    url: "https://en.wikipedia.org/wiki/Vector_space_model",
    snippet: "The vector space model is an algebraic model for representing text documents as vectors of identifiers, such as index terms. It is used in information filtering and retrieval.",
    tags: ["Math", "IR", "Algorithms"]
  },
  {
    id: "doc_11",
    title: "BM25 Ranking Function",
    url: "https://opensource.org/bm25",
    snippet: "Okapi BM25 is a ranking function used by search engines to estimate the relevance of documents to a given search query. It is an extension of TF-IDF.",
    tags: ["Ranking", "Algorithms", "TF-IDF"]
  },
  {
    id: "doc_12",
    title: "Building a Search Engine from Scratch",
    url: "https://github.com/build-a-search-engine",
    snippet: "Learn how to build a basic search engine using Python. We cover crawling, parsing, indexing, and ranking using cosine similarity.",
    tags: ["Tutorial", "Search Engine"]
  }
];
