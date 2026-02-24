import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { gameService } from '../services/gameService';
import { preservationService, PreservationSource, RereleaseRequest } from '../services/preservationService';
import { useAuth } from '../hooks/useAuth';
import { Pagination } from '../components/common/Pagination';
import { Game } from '../types/game.types';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

type Tab = 'catalog' | 'sources' | 'voting';

export const Abandonware: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('catalog');

    // ----- Catalog state -----
    const [games, setGames] = useState<Game[]>([]);
    const [gamesLoading, setGamesLoading] = useState(true);
    const [gamesError, setGamesError] = useState<string | null>(null);
    const [gamesPage, setGamesPage] = useState(1);
    const [gamesTotalPages, setGamesTotalPages] = useState(1);
    const [gamesTotal, setGamesTotal] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // ----- Sources state -----
    const [sources, setSources] = useState<PreservationSource[]>([]);
    const [sourcesLoading, setSourcesLoading] = useState(false);
    const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('');

    // ----- Re-release voting state -----
    const [rereleases, setRereleases] = useState<RereleaseRequest[]>([]);
    const [rereleasesLoading, setRereleasesLoading] = useState(false);
    const [votingFor, setVotingFor] = useState<number | null>(null);

    // ===== Fetch abandonware catalog =====
    const fetchGames = useCallback(async () => {
        setGamesLoading(true);
        setGamesError(null);
        try {
            const params: any = { page: gamesPage, limit: 20 };
            if (searchQuery) params.search = searchQuery;
            const response = await gameService.getAbandonwareGames(params);
            const data = response.data || response;
            setGames((data as any).games || []);
            setGamesTotalPages((data as any).pagination?.totalPages || 1);
            setGamesTotal((data as any).pagination?.total || 0);
        } catch (err) {
            console.error('Failed to load abandonware:', err);
            setGamesError('Failed to load abandonware catalog.');
        } finally {
            setGamesLoading(false);
        }
    }, [gamesPage, searchQuery]);

    useEffect(() => {
        if (activeTab === 'catalog') fetchGames();
    }, [fetchGames, activeTab]);

    useEffect(() => {
        const timer = setTimeout(() => { setSearchQuery(searchInput); setGamesPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // ===== Fetch preservation sources =====
    const fetchSources = useCallback(async () => {
        setSourcesLoading(true);
        try {
            const params: any = {};
            if (sourceTypeFilter) params.source_type = sourceTypeFilter;
            const response = await preservationService.getSources(params);
            const data = response.data || response;
            setSources(Array.isArray(data) ? data : data.sources || []);
        } catch (err) {
            console.error('Failed to load preservation sources:', err);
        } finally {
            setSourcesLoading(false);
        }
    }, [sourceTypeFilter]);

    useEffect(() => {
        if (activeTab === 'sources') fetchSources();
    }, [fetchSources, activeTab]);

    // ===== Fetch rereleases =====
    const fetchRereleases = useCallback(async () => {
        setRereleasesLoading(true);
        try {
            const response = await preservationService.getMostVoted(30);
            const data = response.data || response;
            setRereleases(Array.isArray(data) ? data : data.requests || []);
        } catch (err) {
            console.error('Failed to load rereleases:', err);
        } finally {
            setRereleasesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'voting') fetchRereleases();
    }, [fetchRereleases, activeTab]);

    // ===== Vote handler =====
    const handleVote = async (gameId: number) => {
        if (!isAuthenticated) return;
        setVotingFor(gameId);
        try {
            await preservationService.vote(gameId);
            fetchRereleases();
        } catch (err) {
            console.error('Vote failed:', err);
        } finally {
            setVotingFor(null);
        }
    };

    const TABS: { id: Tab; label: string; icon: string }[] = [
        { id: 'catalog', label: 'Abandonware Catalog', icon: '📦' },
        { id: 'sources', label: 'Preservation Sources', icon: '🏛️' },
        { id: 'voting', label: 'Re-release Voting', icon: '🗳️' },
    ];

    return (
        <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-4xl font-extrabold gradient-text mb-2">🏛️ Abandonware Museum</h1>
                <p className="text-gray-400 text-lg">
                    Preserving gaming history — explore abandoned classics, discover preservation efforts, and vote for re-releases
                </p>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">📦</div>
                    <p className="text-2xl font-bold text-amber-400">{gamesTotal}</p>
                    <p className="text-sm text-gray-400">Abandonware Titles</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🏛️</div>
                    <p className="text-2xl font-bold text-blue-400">{sources.length || '—'}</p>
                    <p className="text-sm text-gray-400">Preservation Sources</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🗳️</div>
                    <p className="text-2xl font-bold text-green-400">{rereleases.length || '—'}</p>
                    <p className="text-sm text-gray-400">Re-release Requests</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">❤️</div>
                    <p className="text-2xl font-bold text-red-400">
                        {rereleases.reduce((sum, r) => sum + (r.total_votes || 0), 0) || '—'}
                    </p>
                    <p className="text-sm text-gray-400">Total Votes</p>
                </motion.div>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants} className="flex gap-2 flex-wrap border-b border-dark-100 pb-2">
                {TABS.map((tab) => (
                    <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-all ${
                            activeTab === tab.id
                                ? 'bg-primary-500/20 text-primary-400 border-b-2 border-primary-500'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </motion.button>
                ))}
            </motion.div>

            <AnimatePresence mode="wait">
                {/* ===== CATALOG TAB ===== */}
                {activeTab === 'catalog' && (
                    <motion.div key="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search abandonware games..."
                            className="w-full px-4 py-3 bg-dark-300 border border-dark-100 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />

                        {gamesLoading && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div key={i} className="glass-card overflow-hidden animate-pulse">
                                        <div className="h-48 bg-white/5" />
                                        <div className="p-4 space-y-2">
                                            <div className="h-5 bg-white/5 rounded w-3/4" />
                                            <div className="h-3 bg-white/5 rounded w-1/2" />
                                            <div className="h-3 bg-white/5 rounded w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {gamesError && !gamesLoading && (
                            <div className="glass-card text-center py-12">
                                <div className="text-5xl mb-4">⚠️</div>
                                <h3 className="text-xl font-bold text-white mb-2">{gamesError}</h3>
                                <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={fetchGames}
                                    className="mt-4 px-6 py-2 rounded-lg bg-primary-500 text-white font-medium"
                                >
                                    Retry
                                </motion.button>
                            </div>
                        )}

                        {!gamesLoading && !gamesError && games.length > 0 && (
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                variants={containerVariants}
                                initial="hidden" animate="visible"
                            >
                                {games.map((game) => (
                                    <motion.div
                                        key={game.id}
                                        className="game-card group overflow-hidden"
                                        variants={itemVariants}
                                        whileHover={{ y: -5, borderColor: 'rgba(245, 158, 11, 0.6)' }}
                                    >
                                        <Link to={`/games/${game.id}`}>
                                            <div className="relative h-48 bg-dark-300 overflow-hidden mb-4 rounded-lg">
                                                <img
                                                    src={game.cover_url || `https://placehold.co/300x400/1a1a2e/f59e0b?text=${encodeURIComponent(game.title.substring(0, 15))}`}
                                                    alt={game.title}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://placehold.co/300x400/1a1a2e/f59e0b?text=${encodeURIComponent(game.title.substring(0, 15))}`;
                                                    }}
                                                />
                                                <div className="absolute top-2 left-2">
                                                    <span className="px-2 py-1 rounded text-xs font-bold bg-amber-500/80 backdrop-blur-sm text-black">
                                                        📦 Abandonware
                                                    </span>
                                                </div>
                                                {game.release_year && (
                                                    <div className="absolute top-2 right-2">
                                                        <span className="px-2 py-1 rounded text-xs font-bold bg-black/70 backdrop-blur-sm text-white">
                                                            {game.release_year}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-transparent to-transparent opacity-60" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg mb-1 text-white group-hover:text-primary-400 transition-colors line-clamp-1">
                                                    {game.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-lg capitalize">
                                                        {game.availability_status?.replace(/_/g, ' ')}
                                                    </span>
                                                    {game.was_rereleased && (
                                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-lg">
                                                            ✅ Re-released
                                                        </span>
                                                    )}
                                                </div>
                                                {game.description && (
                                                    <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                                                        {game.description}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {!gamesLoading && !gamesError && games.length === 0 && (
                            <div className="glass-card text-center py-16">
                                <div className="text-6xl mb-4">📦</div>
                                <h3 className="text-2xl font-bold mb-2 text-white">No abandonware games found</h3>
                                <p className="text-gray-400">Try adjusting your search</p>
                            </div>
                        )}

                        {!gamesLoading && gamesTotalPages > 1 && (
                            <Pagination currentPage={gamesPage} totalPages={gamesTotalPages} onPageChange={setGamesPage} />
                        )}
                    </motion.div>
                )}

                {/* ===== SOURCES TAB ===== */}
                {activeTab === 'sources' && (
                    <motion.div key="sources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        {/* Source type filter */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: '', label: 'All Sources', icon: '📚' },
                                { value: 'museum', label: 'Museums', icon: '🏛️' },
                                { value: 'archive', label: 'Archives', icon: '📁' },
                                { value: 'organization', label: 'Organizations', icon: '🏢' },
                            ].map((opt) => (
                                <motion.button
                                    key={opt.value}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSourceTypeFilter(opt.value)}
                                    className={`filter-btn ${sourceTypeFilter === opt.value ? 'active' : ''}`}
                                >
                                    {opt.icon} {opt.label}
                                </motion.button>
                            ))}
                        </div>

                        {sourcesLoading && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="glass-card p-6 animate-pulse space-y-3">
                                        <div className="h-6 bg-white/5 rounded w-3/4" />
                                        <div className="h-4 bg-white/5 rounded w-1/2" />
                                        <div className="h-4 bg-white/5 rounded w-full" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!sourcesLoading && sources.length > 0 && (
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                variants={containerVariants}
                                initial="hidden" animate="visible"
                            >
                                {sources.map((source) => (
                                    <motion.div
                                        key={source.id}
                                        className="glass-card p-6"
                                        variants={itemVariants}
                                        whileHover={{ y: -4, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                                    >
                                        <div className="flex items-start gap-4 mb-3">
                                            {source.logo_url ? (
                                                <img
                                                    src={source.logo_url}
                                                    alt={source.name}
                                                    className="w-12 h-12 rounded-lg object-cover bg-dark-300"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-2xl">
                                                    {source.source_type === 'museum' ? '🏛️' : source.source_type === 'archive' ? '📁' : '🏢'}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-white text-lg truncate">{source.name}</h3>
                                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-lg capitalize">
                                                    {source.source_type}
                                                </span>
                                            </div>
                                        </div>
                                        {source.description && (
                                            <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                                                {source.description}
                                            </p>
                                        )}
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
                                        >
                                            🔗 Visit Website
                                            <span className="text-xs text-gray-600">↗</span>
                                        </a>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {!sourcesLoading && sources.length === 0 && (
                            <div className="glass-card text-center py-16">
                                <div className="text-6xl mb-4">🏛️</div>
                                <h3 className="text-2xl font-bold mb-2 text-white">No preservation sources found</h3>
                                <p className="text-gray-400">Sources will appear as they are added by administrators</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ===== VOTING TAB ===== */}
                {activeTab === 'voting' && (
                    <motion.div key="voting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="glass-card p-4 bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/20">
                            <p className="text-gray-300 text-sm">
                                🗳️ <strong className="text-green-400">Vote for games you want re-released!</strong>{' '}
                                Help publishers know which abandonware titles deserve a modern comeback.
                                {!isAuthenticated && (
                                    <span className="text-yellow-400 ml-1">
                                        <Link to="/login" className="underline hover:text-yellow-300">Log in</Link> to vote.
                                    </span>
                                )}
                            </p>
                        </div>

                        {rereleasesLoading && (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="glass-card p-4 animate-pulse flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white/5 rounded-lg flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-5 bg-white/5 rounded w-1/3" />
                                            <div className="h-3 bg-white/5 rounded w-1/4" />
                                        </div>
                                        <div className="w-20 h-10 bg-white/5 rounded" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!rereleasesLoading && rereleases.length > 0 && (
                            <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                                {rereleases.map((req, idx) => (
                                    <motion.div
                                        key={req.id}
                                        variants={itemVariants}
                                        className="glass-card p-4 flex items-center gap-4"
                                        whileHover={{ borderColor: 'rgba(34, 197, 94, 0.4)' }}
                                    >
                                        {/* Rank */}
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-lg flex-shrink-0 ${
                                            idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                            idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                                            idx === 2 ? 'bg-amber-700/20 text-amber-600' :
                                            'bg-dark-300 text-gray-500'
                                        }`}>
                                            #{idx + 1}
                                        </div>

                                        {/* Game info */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {req.Game?.cover_url && (
                                                <img
                                                    src={req.Game.cover_url}
                                                    alt={req.Game?.title}
                                                    className="w-12 h-16 rounded object-cover flex-shrink-0 bg-dark-300"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            )}
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-white truncate">
                                                    {req.Game ? (
                                                        <Link to={`/games/${req.Game.id}`} className="hover:text-primary-400 transition-colors">
                                                            {req.Game.title}
                                                        </Link>
                                                    ) : `Game #${req.game_id}`}
                                                </h4>
                                                {req.Game?.developer && (
                                                    <p className="text-sm text-gray-500">{req.Game.developer.name}</p>
                                                )}
                                                {req.Game?.release_year && (
                                                    <p className="text-xs text-gray-600">Released: {req.Game.release_year}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Vote count + button */}
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <div className="text-center">
                                                <p className="text-xl font-bold text-green-400">{req.total_votes}</p>
                                                <p className="text-xs text-gray-500">votes</p>
                                            </div>

                                            {req.status === 'fulfilled' ? (
                                                <span className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium">
                                                    ✅ Fulfilled
                                                </span>
                                            ) : isAuthenticated ? (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleVote(req.game_id)}
                                                    disabled={votingFor === req.game_id}
                                                    className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium transition-colors disabled:opacity-50"
                                                >
                                                    {votingFor === req.game_id ? '...' : '👍 Vote'}
                                                </motion.button>
                                            ) : null}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {!rereleasesLoading && rereleases.length === 0 && (
                            <div className="glass-card text-center py-16">
                                <div className="text-6xl mb-4">🗳️</div>
                                <h3 className="text-2xl font-bold mb-2 text-white">No re-release requests yet</h3>
                                <p className="text-gray-400">Be the first to request a re-release for an abandonware game!</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preservation Info Banner */}
            <motion.div
                variants={itemVariants}
                className="glass-card p-8 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                    border: '2px solid rgba(245, 158, 11, 0.2)',
                }}
            >
                <div className="absolute -right-10 -bottom-10 text-[120px] opacity-10">🏛️</div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-extrabold text-white mb-3">🏛️ About Game Preservation</h3>
                    <p className="text-gray-400 leading-relaxed max-w-3xl">
                        Abandonware refers to software no longer sold, supported, or maintained by its publisher.
                        These games represent important milestones in gaming history. Organizations like the Internet Archive,
                        GOG.com, and the Video Game History Foundation work to preserve these titles for future generations.
                        Always support official releases when available.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};
