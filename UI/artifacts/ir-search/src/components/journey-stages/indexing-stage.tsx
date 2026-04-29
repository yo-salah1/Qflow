import { motion } from "framer-motion";
import { Database, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface IndexingStageProps {
  isActive: boolean;
}

const TERMS = [
  { term: "machine", docs: [1, 3, 5] },
  { term: "learning", docs: [1, 2, 5] },
  { term: "artificial", docs: [1, 4] },
  { term: "intelligence", docs: [1, 4, 6] },
  { term: "data", docs: [2, 3, 6] },
  { term: "mining", docs: [2, 3] },
];

export default function IndexingStage({ isActive }: IndexingStageProps) {
  const [indexedTerms, setIndexedTerms] = useState<number>(0);
  const [showConnections, setShowConnections] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    setIndexedTerms(0);
    setShowConnections(false);

    const timer = setInterval(() => {
      setIndexedTerms((prev) => {
        if (prev < TERMS.length) {
          return prev + 1;
        }
        return prev;
      });
    }, 400);

    const connectTimer = setTimeout(() => {
      setShowConnections(true);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(connectTimer);
    };
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
          <Database className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
          <h2 className="text-2xl md:text-3xl font-bold">Inverted Index</h2>
        </div>
        <p className="text-gray-400 text-sm md:text-base">
          Terms are mapped to document IDs in an inverted index structure, enabling fast lookup of
          documents containing specific terms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Inverted Index Structure */}
        <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-purple-300">Index Structure</h3>
          <div className="space-y-2 md:space-y-3">
            {TERMS.map((item, index) => {
              const isIndexed = index < indexedTerms;
              return (
                <motion.div
                  key={item.term}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: isIndexed ? 1 : 0.2,
                    x: 0,
                  }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-2 md:gap-4 p-3 md:p-4 rounded-lg ${
                    isIndexed
                      ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30"
                      : "bg-white/5"
                  }`}
                >
                  <div className="flex-1">
                    <span className="font-mono font-semibold text-purple-300">
                      {item.term}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {showConnections && isIndexed && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 origin-left"
                      />
                    )}
                    <ArrowRight
                      className={`w-4 h-4 ${
                        isIndexed ? "text-purple-400" : "text-gray-600"
                      }`}
                    />
                  </div>

                  <div className="flex gap-1">
                    {item.docs.map((doc) => (
                      <motion.div
                        key={doc}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={
                          showConnections && isIndexed
                            ? { scale: 1, opacity: 1 }
                            : { scale: 0, opacity: 0 }
                        }
                        transition={{ delay: 0.5 + doc * 0.05 }}
                        className="w-8 h-8 md:w-10 md:h-10 bg-blue-500/30 border border-blue-400 rounded-lg flex items-center justify-center font-mono text-xs md:text-sm font-semibold text-blue-300"
                      >
                        D{doc}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Visualization & Stats */}
        <div className="space-y-3 md:space-y-4">
          {/* Visual Representation */}
          <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10 h-64 md:h-80">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-blue-300">
              Index Visualization
            </h3>
            <div className="relative h-48 md:h-64">
              {/* Terms Column */}
              <div className="absolute left-0 top-0 bottom-0 w-1/3 flex flex-col justify-around">
                {TERMS.slice(0, 4).map((item, index) => {
                  const isIndexed = index < indexedTerms;
                  return (
                    <motion.div
                      key={item.term}
                      initial={{ scale: 0 }}
                      animate={{ scale: isIndexed ? 1 : 0 }}
                      className="bg-purple-500/30 border border-purple-400 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-xs font-mono text-center"
                    >
                      {item.term}
                    </motion.div>
                  );
                })}
              </div>

              {/* Documents Column */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 flex flex-col justify-around">
                {[1, 2, 3, 4, 5, 6].map((doc) => (
                  <motion.div
                    key={doc}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: doc * 0.1 }}
                    className="bg-blue-500/30 border border-blue-400 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-xs font-mono text-center"
                  >
                    Doc {doc}
                  </motion.div>
                ))}
              </div>

              {/* Connection Lines */}
              {showConnections && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {TERMS.slice(0, 4).map((item, termIndex) => {
                    if (termIndex >= indexedTerms) return null;
                    const termY = (termIndex + 0.5) * (256 / 4);
                    return item.docs.slice(0, 3).map((doc) => {
                      const docY = (doc - 0.5) * (256 / 6);
                      return (
                        <motion.line
                          key={`${item.term}-${doc}`}
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.3 }}
                          transition={{ duration: 0.5, delay: termIndex * 0.1 }}
                          x1="33%"
                          y1={termY}
                          x2="67%"
                          y2={docY}
                          stroke="url(#gradient)"
                          strokeWidth="2"
                        />
                      );
                    });
                  })}
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-3 md:p-4 border border-white/10">
              <div className="text-xl md:text-2xl font-bold text-purple-400">{TERMS.length}</div>
              <div className="text-[10px] md:text-xs text-gray-400 mt-1">Unique Terms</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-3 md:p-4 border border-white/10">
              <div className="text-xl md:text-2xl font-bold text-blue-400">6</div>
              <div className="text-[10px] md:text-xs text-gray-400 mt-1">Documents</div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl p-3 md:p-4 border border-white/10">
            <h4 className="font-semibold mb-2 text-purple-300 text-xs md:text-sm">Key Benefits</h4>
            <ul className="space-y-1 text-[10px] md:text-xs text-gray-300">
              <li>• O(1) lookup time for term queries</li>
              <li>• Efficient storage and retrieval</li>
              <li>• Enables fast boolean searches</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
