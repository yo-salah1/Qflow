import { motion } from "framer-motion";
import { Globe, ArrowRight, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface CrawlerStageProps {
  isActive: boolean;
}

const URLS = [
  "https://wikipedia.org/machine-learning",
  "https://arxiv.org/cs/AI/papers",
  "https://medium.com/data-science",
  "https://github.com/ml-projects",
  "https://stanford.edu/courses/cs229",
  "https://blog.tensorflow.org",
];

export default function CrawlerStage({ isActive }: CrawlerStageProps) {
  const [crawledUrls, setCrawledUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!isActive) return;

    setCrawledUrls([]);
    let index = 0;

    const interval = setInterval(() => {
      if (index < URLS.length) {
        setCrawledUrls((prev) => [...prev, URLS[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3 mb-2">
          <Globe className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
          <h2 className="text-2xl md:text-3xl font-bold">Web Crawler</h2>
        </div>
        <p className="text-gray-400 text-sm md:text-base">
          The crawler discovers and fetches web pages from the internet, following links and
          collecting content for indexing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Crawling Activity */}
        <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-blue-300">Discovered URLs</h3>
          <div className="space-y-2 md:space-y-3 max-h-60 md:max-h-80 overflow-y-auto">
            {URLS.map((url, index) => {
              const isCrawled = crawledUrls.includes(url);
              return (
                <motion.div
                  key={url}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: isCrawled ? 1 : 0.3,
                    x: 0,
                  }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isCrawled ? "bg-green-500/20 border border-green-500/30" : "bg-white/5"
                  }`}
                >
                  {isCrawled ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Check className="w-5 h-5 text-green-400" />
                    </motion.div>
                  ) : (
                    <div className="w-5 h-5 border-2 border-white/30 rounded-full animate-pulse" />
                  )}
                  <span className="text-xs md:text-sm font-mono truncate flex-1">{url}</span>
                  {isCrawled && (
                    <ArrowRight className="w-4 h-4 text-green-400 animate-pulse" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Crawler Stats */}
        <div className="space-y-3 md:space-y-4">
          <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-blue-300">Crawler Activity</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Pages Fetched</span>
                  <span className="text-lg font-bold text-white">
                    {crawledUrls.length}/{URLS.length}
                  </span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(crawledUrls.length / URLS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4">
                <div className="bg-blue-500/20 rounded-xl p-3 md:p-4 border border-blue-500/30">
                  <div className="text-xl md:text-2xl font-bold text-blue-400">
                    {isActive ? <span className="animate-pulse">...</span> : "Active"}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-400 mt-1">Status</div>
                </div>
                <div className="bg-purple-500/20 rounded-xl p-3 md:p-4 border border-purple-500/30">
                  <div className="text-xl md:text-2xl font-bold text-purple-400">2.3s</div>
                  <div className="text-[10px] md:text-xs text-gray-400 mt-1">Avg Time</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-4 md:p-6 border border-white/10">
            <h4 className="font-semibold mb-2 md:mb-3 text-blue-300 text-sm md:text-base">How It Works</h4>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Starts with seed URLs and follows hyperlinks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Downloads HTML content from web pages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Respects robots.txt and crawl delays</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
