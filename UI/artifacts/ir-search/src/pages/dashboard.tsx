import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, BarChart3, PieChart, Activity, Medal, Sparkles } from "lucide-react";
import { getTopSearchKeywords, SearchKeywordStat } from "@/lib/search-engine";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

export default function Dashboard() {
    const [topKeywords, setTopKeywords] = useState<SearchKeywordStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [topN, setTopN] = useState(10);

    useEffect(() => {
        const loadKeywords = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await getTopSearchKeywords(topN);
                setTopKeywords(data);
            } catch (err) {
                console.error(err);
                setError("Unable to load top search keywords.");
            } finally {
                setIsLoading(false);
            }
        };

        loadKeywords();
    }, [topN]);

    // Calculate statistics with safe defaults
    const totalSearches = topKeywords.reduce((sum, item) => sum + (item.count || 0), 0);
    const avgSearches = topKeywords.length > 0 ? (totalSearches / topKeywords.length).toFixed(1) : "0";
    const topKeyword = topKeywords.length > 0 ? topKeywords[0] : null;

    // Prepare chart data with safe mapping
    const barChartData = topKeywords.map((item, index) => ({
        name: item.query || 'Unknown',
        count: item.count || 0,
        rank: index + 1,
    }));

    // Prepare pie chart data safely - always show top 5 + others
    const pieChartData = topKeywords.slice(0, 5).map((item, index) => ({
        name: item.query || 'Unknown',
        value: item.count || 0,
    }));

    // Add "Others" category if there are more than 5 keywords
    if (topKeywords.length > 5) {
        const othersCount = topKeywords.slice(5).reduce((sum, item) => sum + (item.count || 0), 0);
        pieChartData.push({ name: 'Others', value: othersCount });
    }

    // Calculate dynamic chart height based on number of items
    const barChartHeight = Math.max(400, topKeywords.length * 30 + 100);

    return (
        <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-background dark:via-background/95 dark:to-background/90 text-foreground">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-sm font-semibold text-primary uppercase tracking-[0.2em]">Analytics Dashboard</p>
                            </div>
                            <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                                Search Insights
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                                Real-time analytics of user search behavior and trending queries
                            </p>
                        </div>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Search
                        </Link>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {[
                        { icon: BarChart3, label: 'Total Keywords', value: topKeywords.length, color: 'from-blue-500 to-blue-600' },
                        { icon: Activity, label: 'Total Searches', value: totalSearches.toLocaleString(), color: 'from-emerald-500 to-emerald-600' },
                        { icon: TrendingUp, label: 'Top Keyword', value: topKeyword?.query || 'N/A', subvalue: `${topKeyword?.count || 0} searches`, color: 'from-violet-500 to-violet-600' },
                        { icon: PieChart, label: 'Avg Searches', value: avgSearches, color: 'from-amber-500 to-amber-600' },
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg shadow-${stat.color.split('-')[1]}-500/25`}>
                                        <stat.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                                </div>
                                <p className="text-4xl font-black bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                                    {stat.value}
                                </p>
                                {stat.subvalue && (
                                    <p className="text-sm font-semibold text-primary mt-1">{stat.subvalue}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-3 p-2 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
                        <span className="px-4 text-sm font-semibold text-foreground">Display:</span>
                        <div className="flex gap-1">
                            {[5, 10, 15, 20, 25].map((value) => (
                                <button
                                    key={value}
                                    onClick={() => setTopN(value)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                        topN === value
                                            ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30 scale-105'
                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                    }`}
                                >
                                    Top {value}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Bar Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 shadow-xl hover:shadow-2xl transition-all duration-500"
                    >
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                                    <BarChart3 className="w-4 h-4 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    Search Frequency
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground">Horizontal distribution of search counts per keyword</p>
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : error ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-8 text-red-700 dark:text-red-400 text-center">
                                <p className="font-semibold">{error}</p>
                            </div>
                        ) : topKeywords.length === 0 ? (
                            <div className="rounded-2xl border border-border/30 bg-muted/20 p-12 text-center">
                                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                <p className="text-muted-foreground font-medium">No search data available</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={barChartHeight}>
                                <BarChart data={barChartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" opacity={0.3} />
                                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} fontWeight={500} />
                                    <YAxis dataKey="name" type="category" width={150} stroke="hsl(var(--muted-foreground))" fontSize={11} fontWeight={500} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '16px',
                                            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
                                            padding: '16px',
                                        }}
                                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 8, 8, 0]} />
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="hsl(var(--primary))" />
                                            <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>

                    {/* Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 shadow-xl hover:shadow-2xl transition-all duration-500"
                    >
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                                    <PieChart className="w-4 h-4 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    Distribution
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground">Market share of top search keywords</p>
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : error ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-8 text-red-700 dark:text-red-400 text-center">
                                <p className="font-semibold">{error}</p>
                            </div>
                        ) : topKeywords.length === 0 ? (
                            <div className="rounded-2xl border border-border/30 bg-muted/20 p-12 text-center">
                                <PieChart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                <p className="text-muted-foreground font-medium">No search data available</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={400}>
                                <RechartsPieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={140}
                                        innerRadius={70}
                                        fill="#8884d8"
                                        dataKey="value"
                                        paddingAngle={3}
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '16px',
                                            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
                                            padding: '16px',
                                        }}
                                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                                        labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={40}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: 12, fontWeight: 500 }}
                                    />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>
                </div>

                {/* Keyword List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 shadow-xl hover:shadow-2xl transition-all duration-500"
                >
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                                <Medal className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Rankings
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground">Complete leaderboard of search keywords</p>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-8 text-red-700 dark:text-red-400 text-center">
                            <p className="font-semibold">{error}</p>
                        </div>
                    ) : topKeywords.length === 0 ? (
                        <div className="rounded-2xl border border-border/30 bg-muted/20 p-12 text-center">
                            <Medal className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-muted-foreground font-medium">No search data available</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topKeywords.map((keyword, index) => (
                                <motion.div
                                    key={keyword.query}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 hover:bg-background p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-r ${
                                        index === 0 ? 'from-yellow-500/5 to-transparent' :
                                        index === 1 ? 'from-slate-400/5 to-transparent' :
                                        index === 2 ? 'from-amber-600/5 to-transparent' :
                                        'from-transparent'
                                    } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                    <div className="relative flex items-center justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg ${
                                                index === 0 ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white shadow-yellow-500/30' :
                                                index === 1 ? 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 text-white shadow-slate-400/30' :
                                                index === 2 ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-amber-600/30' :
                                                'bg-muted text-muted-foreground'
                                            }`}>
                                                {index === 0 ? <Medal className="w-6 h-6" /> : index + 1}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-lg">{keyword.query}</p>
                                                <p className="text-sm text-muted-foreground font-medium">
                                                    {totalSearches > 0 ? ((keyword.count / totalSearches) * 100).toFixed(1) : '0'}% share
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-3 text-sm font-bold text-primary border border-primary/20 shadow-sm">
                                            {keyword.count.toLocaleString()} searches
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
