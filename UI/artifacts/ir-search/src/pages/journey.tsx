import { JourneyPipeline } from "@/components/journey-pipeline";
import { motion } from "framer-motion";
import { Sparkles, Info } from "lucide-react";

export default function Journey() {
  const queryParams = new URLSearchParams(window.location.search);
  const query = queryParams.get("q") || "";

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
            <Sparkles className="w-4 h-4" />
            Interactive Explainer
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            The Data Journey
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch how raw web pages are transformed into ranked search results. 
            {query && <span className="block mt-2 font-medium text-foreground">Showing context for: <span className="text-primary">"{query}"</span></span>}
          </p>
        </motion.div>

        <JourneyPipeline />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 text-left"
        >
          <InfoCard 
            title="Why does this matter?" 
            content="Search engines process billions of pages. To do this in milliseconds, they must pre-compute an Inverted Index—a mapping of words to the documents that contain them."
          />
          <InfoCard 
            title="How does ranking work?" 
            content="We use a simplified TF-IDF (Term Frequency-Inverse Document Frequency) model. It rewards terms that appear often in a specific document, but penalizes terms that appear in every document (like 'the')."
          />
        </motion.div>
      </div>
    </div>
  );
}

function InfoCard({ title, content }: { title: string, content: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all overflow-hidden"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Decorative gradient blob */}
      <div className="absolute -top-8 -right-8 w-16 h-16 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-300" />
      
      <div className="relative">
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ duration: 0.3 }}
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center shadow-lg shadow-primary/20 mb-4"
        >
          <Info className="w-6 h-6 text-white" />
        </motion.div>
        <h3 className="font-bold text-lg mb-3 text-foreground group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">
          {content}
        </p>
      </div>
    </motion.div>
  );
}
