import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { Play, Pause, RotateCcw, FastForward, CheckCircle2, Search, Database, FileText, BarChart3, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CrawlerStage from "@/components/journey-stages/crawler-stage";
import ProcessingStage from "@/components/journey-stages/processing-stage";
import IndexingStage from "@/components/journey-stages/indexing-stage";
import RankingStage from "@/components/journey-stages/ranking-stage";
import ResultsStage from "@/components/journey-stages/results-stage";

type Stage = "crawler" | "processing" | "indexing" | "ranking" | "results";

const STAGES: { id: Stage; label: string; icon: any; description: string }[] = [
  { id: "crawler", label: "Crawler", icon: Search, description: "Fetching web pages" },
  { id: "processing", label: "Processing", icon: Settings2, description: "Tokenizing & cleaning" },
  { id: "indexing", label: "Indexing", icon: Database, description: "Building inverted index" },
  { id: "ranking", label: "Ranking", icon: BarChart3, description: "Scoring with TF-IDF" },
  { id: "results", label: "Results", icon: FileText, description: "Displaying to user" },
];

export function JourneyPipeline() {
  const [activeStage, setActiveStage] = useState<Stage | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  const [progress, setProgress] = useState(0);
  const controls = useAnimationControls();
  
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const baseDuration = 3000; // 3 seconds per stage at 1x speed

  useEffect(() => {
    let mounted = true;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (isPlaying) {
        setProgress((prev) => {
          const newProgress = prev + (delta / (baseDuration * 5 / speed));
          if (newProgress >= 1) {
            setIsPlaying(false);
            return 1;
          }
          return newProgress;
        });
      }
      
      if (mounted) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      mounted = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, speed]);

  useEffect(() => {
    if (progress < 0.2) setActiveStage("crawler");
    else if (progress < 0.4) setActiveStage("processing");
    else if (progress < 0.6) setActiveStage("indexing");
    else if (progress < 0.8) setActiveStage("ranking");
    else if (progress < 1.0) setActiveStage("results");
    else setActiveStage(null);
  }, [progress]);

  const handleReset = () => {
    setProgress(0);
    setIsPlaying(true);
  };

  const getStageStatus = (index: number) => {
    const stageProgress = progress * 5;
    if (stageProgress > index + 1) return "completed";
    if (stageProgress >= index && stageProgress <= index + 1) return "active";
    return "upcoming";
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-12 py-8">
      {/* Visualizer Area */}
      <div className="relative min-h-[400px] md:min-h-[500px] bg-slate-900 rounded-2xl md:rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        {/* Background glow based on active stage */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 opacity-50"></div>
        
        <AnimatePresence mode="wait">
          {activeStage === "crawler" && <CrawlerStage key="crawler" isActive={true} />}
          {activeStage === "processing" && <ProcessingStage key="processing" isActive={true} />}
          {activeStage === "indexing" && <IndexingStage key="indexing" isActive={true} />}
          {activeStage === "ranking" && <RankingStage key="ranking" isActive={true} />}
          {activeStage === "results" && <ResultsStage key="results" isActive={true} />}
          {progress >= 1 && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-white text-center flex flex-col items-center gap-4 h-full justify-center p-8"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold">Search Complete</h3>
              <p className="text-slate-400">The information retrieval pipeline is finished.</p>
              <button 
                onClick={handleReset}
                className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Restart Journey
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pipeline Navigation */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="relative flex justify-between">
          {STAGES.map((stage, i) => {
            const status = getStageStatus(i);
            const Icon = stage.icon;
            
            return (
              <div key={stage.id} className="flex flex-col items-center gap-2 md:gap-3 w-12 md:w-20 lg:w-32 relative z-10">
                <motion.div
                  animate={{
                    scale: status === "active" ? 1.2 : 1,
                    backgroundColor: status === "completed" ? "hsl(var(--primary))" : status === "active" ? "hsl(var(--background))" : "hsl(var(--muted))",
                    borderColor: status === "active" ? "hsl(var(--primary))" : "transparent",
                    color: status === "completed" ? "hsl(var(--primary-foreground))" : status === "active" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"
                  }}
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                    status === "active" && "shadow-lg shadow-primary/30"
                  )}
                >
                  {status === "completed" ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" /> : <Icon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />}
                </motion.div>
                <div className="text-center">
                  <p className={cn(
                    "font-semibold text-[10px] md:text-xs lg:text-sm transition-colors duration-300",
                    status === "active" ? "text-primary" : status === "completed" ? "text-foreground" : "text-muted-foreground"
                  )}>{stage.label}</p>
                  <p className="text-[8px] md:text-[10px] lg:text-xs text-muted-foreground hidden md:block mt-1 opacity-70">
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 bg-card border rounded-full px-8 py-4 shadow-sm w-fit mx-auto">
        <button
          onClick={handleReset}
          className="text-muted-foreground hover:text-foreground transition-colors p-2"
          aria-label="Restart"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => progress < 1 ? setIsPlaying(!isPlaying) : handleReset()}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </button>

        <div className="flex items-center gap-1 bg-muted p-1 rounded-full">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s as any)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                speed === s ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
