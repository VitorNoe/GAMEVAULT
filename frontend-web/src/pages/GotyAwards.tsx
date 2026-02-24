import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { gameService, GameWithAwards, Award } from '../services/gameService';
import { Pagination } from '../components/common/Pagination';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const getScoreBg = (score: number): string => {
    if (score >= 90) return 'bg-green-500/80';
    if (score >= 80) return 'bg-yellow-500/80';
    if (score >= 70) return 'bg-orange-500/80';
    return 'bg-red-500/80';
};

export const GotyAwards: React.FC = () => {
    const [games, setGames] = useState<GameWithAwards[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedAward, setSelectedAward] = useState<string | null>(null);
    const [allYears, setAllYears] = useState<number[]>([]);
    const [allAwardNames, setAllAwardNames] = useState<string[]>([]);

    const fetchGames = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = { page, limit: 20, awards: true };
            if (searchQuery) params.search = searchQuery;
            if (selectedYear) params.year = selectedYear;

            const response = await gameService.getGotyGames(params);
            const data = response.data || response;
            let fetchedGames: GameWithAwards[] = data.games || data || [];

            if (selectedAward) {
                fetchedGames = fetchedGames.filter((g: GameWithAwards) =>
                    g.awards?.some((a: Award) => a.name === selectedAward)
                );
            }

            setGames(fetchedGames);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotal(data.pagination?.total || fetchedGames.length);

            const years = new Set<number>();
            const awardNames = new Set<string>();
            fetchedGames.forEach((g: GameWithAwards) => {
                if (g.release_year) years.add(g.release_year);
                g.awards?.forEach((a: Award) => {
                    if (a.year) years.add(a.year);
                    if (a.name) awardNames.add(a.name);
                });
            });
            setAllYears(Array.from(years).sort((a, b) => b - a));
            setAllAwardNames(Array.from(awardNames).sort());
        } catch (err: any) {
            console.error('Failed to load GOTY games:', err);
            setError('Failed to load award winners. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, selectedYear, selectedAward]);

    useEffect(() => { fetchGames(); }, [fetchGames]);

    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => { setSearchQuery(searchInput); setPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const gamesByYear = games.reduce((acc, game) => {
        const years = game.awards?.map(a => a.year) || [game.release_year || 0];
        const mainYear = Math.max(...years);
        if (!acc[mainYear]) acc[mainYear] = [];
        acc[mainYear].push(game);
        return acc;
    }, {} as Record<number, GameWithAwards[]>);

    const sortedYears = Object.keys(gamesByYear).map(Number).sort((a, b) => b - a);

    return (
        <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-4xl font-extrabold gradient-text mb-2">🏆 GOTY Hall of Fame</h1>
                <p className="text-gray-400 text-lg">
                    Award-winning games celebrated across the industry
                </p>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🏆</div>
                    <p className="text-2xl font-bold text-yellow-400">{total}</p>
                    <p className="text-sm text-gray-400">Award Winners</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">📅</div>
                    <p className="text-2xl font-bold text-primary-400">
                        {allYears.length > 0 ? `${allYears[allYears.length - 1]}–${allYears[0]}` : '—'}
                    </p>
                    <p className="text-sm text-gray-400">Year Range</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">⭐</div>
                    <p className="text-2xl font-bold text-green-400">
                        {games.filter(g => g.metacritic_score).length > 0
                            ? Math.round(games.reduce((s, g) => s + (g.metacritic_score || 0), 0) / games.filter(g => g.metacritic_score).length)
                            : '—'}
                    </p>
                    <p className="text-sm text-gray-400">Avg Metacritic</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🎮</div>
                    <p className="text-2xl font-bold text-cyan-400">{allAwardNames.length}</p>
                    <p className="text-sm text-gray-400">Award Shows</p>
                </motion.div>
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants} className="space-y-4">
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by title or developer..."
                    className="w-full px-4 py-3 bg-dark-300 border border-dark-100 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <div className="flex flex-wrap gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedYear(null); setPage(1); }}
                        className={`filter-btn ${selectedYear === null ? 'active' : ''}`}
                    >
                        All Years
                    </motion.button>
                    {allYears.slice(0, 15).map((y) => (
                        <motion.button
                            key={y} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => { setSelectedYear(y); setPage(1); }}
                            className={`filter-btn ${selectedYear === y ? 'active' : ''}`}
                        >
                            {y}
                        </motion.button>
                    ))}
                </div>
                {allAwardNames.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => { setSelectedAward(null); setPage(1); }}
                            className={`filter-btn text-xs ${selectedAward === null ? 'active' : ''}`}
                        >
                            All Awards
                        </motion.button>
                        {allAwardNames.map((name) => (
                            <motion.button
                                key={name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => { setSelectedAward(name); setPage(1); }}
                                className={`filter-btn text-xs ${selectedAward === name ? 'active' : ''}`}
                            >
                                🏆 {name}
                            </motion.button>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Loading skeleton */}
            {loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="glass-card p-0 overflow-hidden animate-pulse">
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-48 h-48 bg-white/5" />
                                <div className="p-6 flex-1 space-y-3">
                                    <div className="h-6 bg-white/5 rounded w-3/4" />
                                    <div className="h-4 bg-white/5 rounded w-1/2" />
                                    <div className="h-4 bg-white/5 rounded w-full" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <motion.div variants={itemVariants} className="glass-card text-center py-12">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={fetchGames}
                        className="mt-4 px-6 py-2 rounded-lg bg-primary-500 text-white font-medium"
                    >
                        Retry
                    </motion.button>
                </motion.div>
            )}

            {/* Hall of Fame Timeline */}
            {!loading && !error && games.length > 0 && (
                <motion.div className="space-y-10" variants={containerVariants}>
                    {sortedYears.map((year) => (
                        <motion.div key={year} variants={itemVariants} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
                                >
                                    <span className="text-2xl font-extrabold text-yellow-400">{year}</span>
                                </motion.div>
                                <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/30 to-transparent" />
                                <span className="text-sm text-gray-500">
                                    {gamesByYear[year].length} {gamesByYear[year].length === 1 ? 'winner' : 'winners'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {gamesByYear[year].map((game) => (
                                    <motion.div
                                        key={game.id}
                                        className="glass-card p-0 overflow-hidden"
                                        whileHover={{ y: -4, borderColor: 'rgba(234, 179, 8, 0.5)' }}
                                    >
                                        <Link to={`/games/${game.id}`} className="flex flex-col md:flex-row">
                                            <div className="md:w-48 h-48 md:h-auto flex-shrink-0 bg-dark-300 overflow-hidden relative">
                                                <img
                                                    src={game.cover_url || `https://placehold.co/300x400/1a1a2e/a78bfa?text=${encodeURIComponent(game.title.substring(0, 15))}`}
                                                    alt={game.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://placehold.co/300x400/1a1a2e/a78bfa?text=${encodeURIComponent(game.title.substring(0, 15))}`;
                                                    }}
                                                />
                                                <div className="absolute top-2 left-2">
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-500/90 backdrop-blur-sm text-black">
                                                        🏆 GOTY
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-5 flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white mb-1 hover:text-primary-400 transition-colors">
                                                            {game.title}
                                                        </h3>
                                                        {game.developer && (
                                                            <p className="text-primary-400 font-medium text-sm">{game.developer.name}</p>
                                                        )}
                                                    </div>
                                                    {game.metacritic_score && (
                                                        <div className={`px-3 py-1 rounded-lg text-white font-bold text-lg flex-shrink-0 ${getScoreBg(game.metacritic_score)}`}>
                                                            {game.metacritic_score}
                                                        </div>
                                                    )}
                                                </div>
                                                {game.description && (
                                                    <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">
                                                        {game.description}
                                                    </p>
                                                )}
                                                {game.awards && game.awards.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                                        {game.awards.map((award) => (
                                                            <span
                                                                key={award.id}
                                                                className="px-2 py-0.5 text-xs rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                                                title={`${award.name} — ${award.category} (${award.year})`}
                                                            >
                                                                🏅 {award.category}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {game.platforms && game.platforms.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {game.platforms.map((p) => (
                                                            <span key={p.id} className="px-2 py-0.5 bg-dark-300 text-gray-300 text-xs rounded-lg">
                                                                {p.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Empty */}
            {!loading && !error && games.length === 0 && (
                <motion.div className="glass-card text-center py-16" variants={itemVariants}>
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-2xl font-bold mb-2 text-white">No award winners found</h3>
                    <p className="text-gray-400">Try adjusting your search or filters</p>
                </motion.div>
            )}

            {!loading && totalPages > 1 && (
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}

            {/* Hall of Fame CTA */}
            <motion.div
                variants={itemVariants}
                className="glass-card p-8 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                    border: '2px solid rgba(234, 179, 8, 0.2)',
                }}
            >
                <div className="absolute -right-10 -bottom-10 text-[120px] opacity-10">🏆</div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-extrabold text-white mb-3">🏛️ The Hall of Fame</h3>
                    <p className="text-gray-400 leading-relaxed max-w-3xl">
                        This hall showcases games recognized with prestigious awards across the industry.
                        From The Game Awards to BAFTA Games Awards, these titles represent the very best in
                        interactive entertainment — the games that defined their era and pushed the medium forward.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};
