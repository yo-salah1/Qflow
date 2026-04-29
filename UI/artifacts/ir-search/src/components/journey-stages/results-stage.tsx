import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

interface ResultsStageProps {
  isActive: boolean;
}

const RESULTS = [
  {
    id: 1,
    title: "Machine Learning Fundamentals",
    url: "https://stanford.edu/ml/fundamentals",
    snippet:
      "Comprehensive guide to machine learning concepts including supervised and unsupervised learning techniques...",
    score: 0.95,
  },
  {
    id: 2,
    title: "Machine Learning Applications",
    url: "https://mlapp.org/practical-guide",
    snippet:
      "Explore real-world machine learning applications in healthcare, finance, and autonomous systems...",
    score: 0.92,
  },
  {
    id: 3,
    title: "Deep Learning with Neural Networks",
    url: "https://deeplearning.ai/courses",
    snippet:
      "Advanced machine learning using neural networks and deep learning architectures for complex problems...",
    score: 0.88,
  },
];

export default function ResultsStage({ isActive }: ResultsStageProps) {
  const [visibleResults, setVisibleResults] = useState<number>(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    setVisibleResults(0);
    setCompleted(false);

    RESULTS.forEach((_, index) => {
      setTimeout(() => {
        setVisibleResults(index + 1);
      }, index * 500);
    });

    setTimeout(() => {
      setCompleted(true);
    }, RESULTS.length * 500 + 500);
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
          <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
          <h2 className="text-2xl md:text-3xl font-bold">Search Results</h2>
        </div>
        <p className="text-gray-400 text-sm md:text-base">
          The final ranked results are presented to the user, with the most relevant documents
          appearing first.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Results Display */}
        <div className="col-span-1 md:col-span-2 space-y-3 md:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3 md:mb-4">
            <div className="text-xs md:text-sm text-gray-400">
              About {RESULTS.length} results for{" "}
              <strong className="text-white">"machine learning"</strong>
            </div>
            {completed && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
                className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1.5 md:px-4 md:py-2"
              >
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                <span className="text-xs md:text-sm font-semibold text-green-300">
                  Search Complete
                </span>
              </motion.div>
            )}
          </div>

          {RESULTS.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={
                index < visibleResults
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 30, scale: 0.9 }
              }
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
              whileHover={{ scale: 1.02 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/20 hover:border-white/40 transition-all cursor-pointer"
            >
              {/* Score Badge */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2 md:mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                    <span className="text-[10px] md:text-xs text-gray-400 truncate">{result.url}</span>
                    <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  </div>
                  <h3 className="text-base md:text-xl font-semibold text-blue-300 hover:text-blue-200 transition-colors">
                    {result.title}
                  </h3>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className={`flex items-center gap-1 md:gap-2 px-2 py-0.5 md:px-3 md:py-1 rounded-full ${
                    result.score >= 0.9
                      ? "bg-green-500/20 border border-green-500/40"
                      : "bg-blue-500/20 border border-blue-500/40"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      result.score >= 0.9 ? "bg-green-400" : "bg-blue-400"
                    }`}
                  ></div>
                  <span
                    className={`text-xs md:text-sm font-bold ${
                      result.score >= 0.9 ? "text-green-300" : "text-blue-300"
                    }`}
                  >
                    {(result.score * 100).toFixed(0)}%
                  </span>
                </motion.div>
              </div>

              {/* Snippet */}
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
                {result.snippet.split("machine learning").map((part, i, arr) =>
                  i < arr.length - 1 ? (
                    <span key={i}>
                      {part}
                      <mark className="bg-yellow-500/30 text-yellow-200 font-semibold px-1 rounded">
                        machine learning
                      </mark>
                    </span>
                  ) : (
                    part
                  )
                )}
              </p>

              {/* Animated Progress Bar */}
              <div className="mt-3 md:mt-4 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${result.score * 100}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-full ${
                    result.score >= 0.9
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : "bg-gradient-to-r from-blue-500 to-cyan-500"
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Statistics Panel */}
        <div className="space-y-3 md:space-y-4">
          <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-green-300">Journey Summary</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between pb-2 md:pb-3 border-b border-white/10">
                <span className="text-xs md:text-sm text-gray-400">Pages Crawled</span>
                <span className="text-base md:text-lg font-bold text-white">6</span>
              </div>
              <div className="flex items-center justify-between pb-2 md:pb-3 border-b border-white/10">
                <span className="text-xs md:text-sm text-gray-400">Terms Indexed</span>
                <span className="text-base md:text-lg font-bold text-white">6</span>
              </div>
              <div className="flex items-center justify-between pb-2 md:pb-3 border-b border-white/10">
                <span className="text-xs md:text-sm text-gray-400">Docs Ranked</span>
                <span className="text-base md:text-lg font-bold text-white">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-gray-400">Results Shown</span>
                <span className="text-base md:text-lg font-bold text-white">{visibleResults}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-4 md:p-6 border border-white/10">
            <h4 className="font-semibold mb-2 md:mb-3 text-green-300 text-sm md:text-base">Performance</h4>
            <div className="space-y-2 md:space-y-3">
              <div>
                <div className="flex justify-between text-[10px] md:text-xs mb-1">
                  <span className="text-gray-400">Query Time</span>
                  <span className="text-white font-semibold">0.08s</span>
                </div>
                <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "15%" }}
                    transition={{ duration: 1 }}
                    className="h-full bg-green-500"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] md:text-xs mb-1">
                  <span className="text-gray-400">Relevance</span>
                  <span className="text-white font-semibold">95%</span>
                </div>
                <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "95%" }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-green-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-4 md:p-6 border border-white/10">
            <h4 className="font-semibold mb-2 text-blue-300 text-xs md:text-sm">Mission Complete!</h4>
            <p className="text-[10px] md:text-xs text-gray-300">
              The Information Retrieval system successfully processed your query through all
              stages and delivered relevant results.
            </p>
          </div>

          {completed && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 md:p-6 border border-yellow-500/30 text-center"
            >
              <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-yellow-400 mx-auto mb-2" />
              <p className="text-xs md:text-sm font-semibold text-yellow-300">
                Pipeline Complete!
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
