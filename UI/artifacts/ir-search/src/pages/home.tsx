import { Link } from "wouter";
import { motion } from "framer-motion";
import { SearchBar } from "@/components/search-bar";
import { Footer } from "@/components/footer";
import { ArrowUpRight, Database, Search, Sparkles, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden bg-gradient-to-b from-background to-muted/30">
      {/* Abstract Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto text-center space-y-10"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            className="w-20 h-20 mx-auto bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300"
          >
            <Search className="w-10 h-10" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">QueryFlow</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            A visual playground to explore how search engines crawl, process, index, and rank information.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full pt-4"
        >
          <SearchBar size="lg" autoFocus />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="pt-12 flex flex-col items-center gap-4"
        >
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Curious how it works under the hood?
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/journey"
              className="group flex items-center gap-2 px-6 py-3 bg-card hover:bg-muted border rounded-full shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-sm font-semibold"
            >
              <Sparkles className="w-4 h-4 text-primary group-hover:animate-pulse" />
              Take the Data Journey
              <span className="text-primary ml-1 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full shadow-sm hover:bg-primary/90 transition-all text-sm font-semibold"
            >
              <ArrowUpRight className="w-4 h-4" />
              Top Search Keywords
            </Link>
          </div>
        </motion.div>
      </motion.div>
      {/* Features grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 mb-16 px-4"
      >
        <FeatureCard
          icon={Database}
          title="Inverted Index"
          desc="See how text is tokenized and stored for O(1) lookup speeds."
        />
        <FeatureCard
          icon={Zap}
          title="TF-IDF Ranking"
          desc="Understand how term frequency and inverse document frequency calculate relevance."
        />
        <FeatureCard
          icon={Search}
          title="Real-time Search"
          desc="Experience a mock corpus search running entirely in your browser."
        />
      </motion.div>
      <Footer />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
