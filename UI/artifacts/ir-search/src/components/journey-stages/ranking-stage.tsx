import { motion } from "framer-motion";
import { TrendingUp, Award } from "lucide-react";
import { useState, useEffect } from "react";

interface RankingStageProps {
  isActive: boolean;
}

const DOCUMENTS = [
  { id: 1, title: "Machine Learning Fundamentals", score: 0 },
  { id: 2, title: "Deep Learning with Neural Networks", score: 0 },
  { id: 3, title: "Introduction to AI", score: 0 },
  { id: 4, title: "Machine Learning Applications", score: 0 },
  { id: 5, title: "Data Science Basics", score: 0 },
];

const FINAL_SCORES = [0.95, 0.88, 0.76, 0.92, 0.65];

export default function RankingStage({ isActive }: RankingStageProps) {
  const [rankedDocs, setRankedDocs] = useState(DOCUMENTS);
  const [isRanking, setIsRanking] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    setRankedDocs(DOCUMENTS);
    setIsRanking(true);

    // Animate scores growing
    const scoreTimer = setTimeout(() => {
      FINAL_SCORES.forEach((finalScore, index) => {
        setTimeout(() => {
          setRankedDocs((prev) =>
            prev.map((doc, i) =>
              i === index ? { ...doc, score: finalScore } : doc
            )
          );
        }, index * 200);
      });
    }, 300);

    // Sort after all scores are set
    const sortTimer = setTimeout(() => {
      setRankedDocs((prev) =>
        [...prev].sort((a, b) => b.score - a.score)
      );
      setIsRanking(false);
    }, 300 + FINAL_SCORES.length * 200 + 500);

    return () => {
      clearTimeout(scoreTimer);
      clearTimeout(sortTimer);
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
          <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-orange-400" />
          <h2 className="text-2xl md:text-3xl font-bold">Ranking Algorithm</h2>
        </div>
        <p className="text-gray-400 text-sm md:text-base">
          Documents are scored using TF-IDF and other relevance metrics, then ranked by their
          scores to determine the best matches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 md:mb-6">
        {/* Scoring Metrics */}
        <div className="col-span-1 md:col-span-3 bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-orange-300">
            Document Scoring (Query: "machine learning")
          </h3>
          <div className="space-y-2 md:space-y-3">
            {rankedDocs.map((doc, index) => (
              <motion.div
                key={doc.id}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white/5 rounded-lg p-3 md:p-4 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="flex items-center gap-2 md:gap-3">
                    {!isRanking && index === 0 && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <Award className="w-5 h-5 text-yellow-400" />
                      </motion.div>
                    )}
                    <span className="font-semibold text-white text-xs md:text-sm">
                      {doc.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-[10px] md:text-xs text-gray-400">Score:</span>
                    <motion.span
                      key={doc.score}
                      initial={{ scale: 1.5, color: "#fbbf24" }}
                      animate={{ scale: 1, color: "#ffffff" }}
                      className="font-bold text-base md:text-lg"
                    >
                      {doc.score.toFixed(2)}
                    </motion.span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-4 md:h-6 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${doc.score * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      doc.score >= 0.9
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : doc.score >= 0.8
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                        : doc.score >= 0.7
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : "bg-gradient-to-r from-orange-500 to-red-500"
                    }`}
                  />
                  <div className="absolute inset-0 flex items-center justify-end pr-1 md:pr-2">
                    <span className="text-[10px] md:text-xs font-semibold text-white drop-shadow-lg">
                      {(doc.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Ranking Factors */}
        <div className="col-span-1 md:col-span-2 space-y-3 md:space-y-4">
          <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-orange-300">
              Ranking Factors
            </h3>
            <div className="space-y-2 md:space-y-3">
              <div className="bg-blue-500/20 rounded-lg p-2 md:p-3 border border-blue-500/30">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <span className="text-xs md:text-sm font-semibold text-blue-300">TF-IDF Score</span>
                  <span className="text-[10px] md:text-xs text-gray-400">40%</span>
                </div>
                <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "40%" }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </div>

              <div className="bg-purple-500/20 rounded-lg p-2 md:p-3 border border-purple-500/30">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <span className="text-xs md:text-sm font-semibold text-purple-300">
                    Term Frequency
                  </span>
                  <span className="text-[10px] md:text-xs text-gray-400">30%</span>
                </div>
                <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "30%" }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-full bg-purple-500"
                  />
                </div>
              </div>

              <div className="bg-green-500/20 rounded-lg p-2 md:p-3 border border-green-500/30">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <span className="text-xs md:text-sm font-semibold text-green-300">
                    Document Length
                  </span>
                  <span className="text-[10px] md:text-xs text-gray-400">20%</span>
                </div>
                <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "20%" }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-green-500"
                  />
                </div>
              </div>

              <div className="bg-yellow-500/20 rounded-lg p-2 md:p-3 border border-yellow-500/30">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <span className="text-xs md:text-sm font-semibold text-yellow-300">
                    Position Bonus
                  </span>
                  <span className="text-[10px] md:text-xs text-gray-400">10%</span>
                </div>
                <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "10%" }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="h-full bg-yellow-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-4 md:p-6 border border-white/10">
            <h4 className="font-semibold mb-2 md:mb-3 text-orange-300 text-sm md:text-base">TF-IDF Formula</h4>
            <div className="bg-black/30 rounded-lg p-2 md:p-3 font-mono text-[10px] md:text-xs text-gray-300">
              <div className="text-center">
                TF-IDF = TF × IDF
              </div>
              <div className="text-center mt-2 text-[10px] text-gray-400">
                Term Frequency × Inverse Document Frequency
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-2 md:p-3 border border-white/10">
              <div className="text-lg md:text-xl font-bold text-green-400">0.95</div>
              <div className="text-[10px] md:text-xs text-gray-400 mt-1">Top Score</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-2 md:p-3 border border-white/10">
              <div className="text-lg md:text-xl font-bold text-blue-400">5</div>
              <div className="text-[10px] md:text-xs text-gray-400 mt-1">Ranked Docs</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
