import { motion, AnimatePresence } from "framer-motion";
import { FileText, ArrowRight, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ProcessingStageProps {
  isActive: boolean;
}

const EXAMPLE_TEXT = "Machine learning is a powerful subset of artificial intelligence";
const TOKENS = ["machine", "learning", "powerful", "subset", "artificial", "intelligence"];
const STOP_WORDS = ["is", "a", "of"];

export default function ProcessingStage({ isActive }: ProcessingStageProps) {
  const [showTokens, setShowTokens] = useState(false);
  const [processedTokens, setProcessedTokens] = useState<string[]>([]);

  useEffect(() => {
    if (!isActive) return;

    setShowTokens(false);
    setProcessedTokens([]);

    const timer1 = setTimeout(() => {
      setShowTokens(true);
    }, 500);

    const timer2 = setTimeout(() => {
      TOKENS.forEach((token, index) => {
        setTimeout(() => {
          setProcessedTokens((prev) => [...prev, token]);
        }, index * 200);
      });
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
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
          <FileText className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
          <h2 className="text-2xl md:text-3xl font-bold">Text Processing</h2>
        </div>
        <p className="text-gray-400 text-sm md:text-base">
          Raw text is cleaned, tokenized, and filtered. Stop words are removed and terms are
          normalized for efficient indexing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Raw Text */}
        <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-blue-300">Raw Text</h3>
          <div className="bg-black/30 rounded-lg p-3 md:p-4 font-mono text-xs md:text-sm">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-300 leading-relaxed"
            >
              {EXAMPLE_TEXT}
            </motion.p>
          </div>
          <div className="mt-3 md:mt-4 flex items-center justify-center">
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            </motion.div>
          </div>
        </div>

        {/* Tokenization */}
        <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-green-300">Tokenization</h3>
          <div className="space-y-1 md:space-y-2">
            <AnimatePresence>
              {showTokens &&
                EXAMPLE_TEXT.toLowerCase()
                  .split(" ")
                  .map((word, index) => {
                    const isStopWord = STOP_WORDS.includes(word);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`inline-block m-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg font-mono text-xs md:text-sm ${
                          isStopWord
                            ? "bg-red-500/20 border border-red-500/30 text-red-300"
                            : "bg-blue-500/20 border border-blue-500/30 text-blue-300"
                        }`}
                      >
                        {word}
                        {isStopWord && (
                          <Trash2 className="w-3 h-3 inline ml-1" />
                        )}
                      </motion.div>
                    );
                  })}
            </AnimatePresence>
          </div>
          <div className="mt-4 md:mt-6 flex items-center justify-center">
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
            >
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
            </motion.div>
          </div>
        </div>

        {/* Processed Tokens */}
        <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-purple-300">
            Filtered & Normalized
          </h3>
          <div className="space-y-1 md:space-y-2">
            {TOKENS.map((token, index) => {
              const isProcessed = processedTokens.includes(token);
              return (
                <motion.div
                  key={token}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: isProcessed ? 1 : 0.3,
                    scale: isProcessed ? 1 : 0.8,
                  }}
                  transition={{ type: "spring", stiffness: 500 }}
                  className={`p-2 md:p-3 rounded-lg font-mono text-xs md:text-sm ${
                    isProcessed
                      ? "bg-green-500/20 border border-green-500/30 text-green-300"
                      : "bg-white/5 text-gray-500"
                  }`}
                >
                  {token}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-3 md:p-4 border border-white/10">
          <div className="text-xl md:text-2xl font-bold text-blue-400">
            {EXAMPLE_TEXT.split(" ").length}
          </div>
          <div className="text-[10px] md:text-xs text-gray-400 mt-1">Words Input</div>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-3 md:p-4 border border-white/10">
          <div className="text-xl md:text-2xl font-bold text-red-400">{STOP_WORDS.length}</div>
          <div className="text-[10px] md:text-xs text-gray-400 mt-1">Removed</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-3 md:p-4 border border-white/10">
          <div className="text-xl md:text-2xl font-bold text-green-400">{TOKENS.length}</div>
          <div className="text-[10px] md:text-xs text-gray-400 mt-1">Final Tokens</div>
        </div>
      </div>
    </motion.div>
  );
}
