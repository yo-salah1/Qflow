import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, ArrowUpRight, TrendingUp } from "lucide-react";
import { getTopSearchKeywords, SearchKeywordStat } from "@/lib/search-engine";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Dashboard() {
    const [topKeywords, setTopKeywords] = useState<SearchKeywordStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadKeywords = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await getTopSearchKeywords(10);
                setTopKeywords(data);
            } catch (err) {
                console.error(err);
                setError("Unable to load top search keywords.");
            } finally {
                setIsLoading(false);
            }
        };

        loadKeywords();
    }, []);

    return (
        <div className="flex-1 min-h-screen bg-slate-50 dark:bg-background text-foreground">
            <div className="container mx-auto px-4 py-10 max-w-5xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-primary font-semibold uppercase tracking-[0.3em]">Dashboard</p>
                        <h1 className="text-4xl font-extrabold tracking-tight">Top Search Keywords</h1>
                        <p className="mt-3 text-muted-foreground max-w-2xl">
                            Here are the most searched queries tracked from user search activity.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>

                <div className="grid gap-6">
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div>
                                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Search activity</p>
                                <h2 className="text-2xl font-semibold">Most Frequently Searched</h2>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-primary">
                                <TrendingUp className="w-4 h-4" />
                                Real-time
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : error ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                                {error}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {topKeywords.length === 0 ? (
                                    <div className="rounded-2xl border border-border/50 bg-muted/10 p-6 text-center text-muted-foreground">
                                        No search keyword data available yet.
                                    </div>
                                ) : (
                                    <motion.ul
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3"
                                    >
                                        {topKeywords.map((keyword, index) => (
                                            <motion.li
                                                key={keyword.query}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="rounded-3xl border border-border/70 bg-background p-5 shadow-sm flex items-center justify-between gap-4"
                                            >
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Rank #{index + 1}</p>
                                                    <p className="text-lg font-semibold">{keyword.query}</p>
                                                </div>
                                                <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                                                    {keyword.count} searches
                                                </div>
                                            </motion.li>
                                        ))}
                                    </motion.ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
