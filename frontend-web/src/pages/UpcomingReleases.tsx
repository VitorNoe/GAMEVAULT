import React, { useState } from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

interface UpcomingGame {
    title: string;
    releaseDate: string;
    releasePeriod: string;
    platforms: string[];
    description: string;
    cover: string;
    hype: 'maximum' | 'high' | 'medium';
    month: string;
}

const UPCOMING_GAMES: UpcomingGame[] = [
    // February 2026
    {
        title: 'Nioh 3',
        releaseDate: 'February 6, 2026',
        releasePeriod: 'February 2026',
        platforms: ['PC', 'PS5'],
        description: 'Set in 1800s Kyoto, a new malevolent phenomenon called the "Crucible" has corrupted the land, transforming historic temples into macabre landscapes. Intense soulslike combat returns with new mechanics.',
        cover: 'https://placehold.co/300x400/1a1a2e/ef4444?text=Nioh+3',
        hype: 'high',
        month: 'February',
    },
    {
        title: 'Dragon Quest VII Reimagined',
        releaseDate: 'February 5, 2026',
        releasePeriod: 'February 2026',
        platforms: ['PS5', 'Xbox Series X|S', 'Switch', 'Switch 2', 'PC'],
        description: 'A complete reimagining of the classic JRPG with visual and quality-of-life improvements, promising hundreds of hours of exploration across fragmented worlds.',
        cover: 'https://placehold.co/300x400/1a1a2e/3b82f6?text=DQ+VII',
        hype: 'high',
        month: 'February',
    },
    {
        title: 'Mewgenics',
        releaseDate: 'February 10, 2026',
        releasePeriod: 'February 2026',
        platforms: ['PC'],
        description: 'From the creator of The Binding of Isaac, a quirky cat-breeding simulation with roguelike elements. Breed, collect, and mutate cats in a bizarre and hilarious world.',
        cover: 'https://placehold.co/300x400/1a1a2e/a855f7?text=Mewgenics',
        hype: 'medium',
        month: 'February',
    },
    {
        title: 'My Hero Academia: All\'s Justice',
        releaseDate: 'February 5, 2026',
        releasePeriod: 'February 2026',
        platforms: ['PC', 'PS5', 'Xbox Series X|S'],
        description: 'An action-packed fighting game based on the popular anime series. Play as your favorite heroes and villains in epic battles with manga-faithful special moves.',
        cover: 'https://placehold.co/300x400/1a1a2e/22c55e?text=MHA+Justice',
        hype: 'medium',
        month: 'February',
    },
    {
        title: 'Final Fantasy VII Part 3',
        releaseDate: 'February 27, 2026',
        releasePeriod: 'February 2026',
        platforms: ['PS5', 'PC'],
        description: 'The epic conclusion to the Final Fantasy VII Remake trilogy. Cloud and friends face their ultimate destiny in this climactic chapter of the beloved saga.',
        cover: 'https://placehold.co/300x400/1a1a2e/60a5fa?text=FF7+Part+3',
        hype: 'maximum',
        month: 'February',
    },
    {
        title: 'Resident Evil: Requiem',
        releaseDate: 'February 2026 (TBA)',
        releasePeriod: 'February 2026',
        platforms: ['PS5', 'Xbox Series X|S', 'PC'],
        description: 'The next terrifying chapter in the Resident Evil franchise. Details remain shrouded in mystery, but promises to deliver a fresh take on survival horror.',
        cover: 'https://placehold.co/300x400/1a1a2e/dc2626?text=RE+Requiem',
        hype: 'high',
        month: 'February',
    },
    {
        title: 'High On Life 2',
        releaseDate: 'February 2026 (TBA)',
        releasePeriod: 'February 2026',
        platforms: ['PC', 'Xbox Series X|S'],
        description: 'The sequel to the irreverent comedy shooter. More talking guns, more alien bounties, and even more absurd humor from Squanch Games.',
        cover: 'https://placehold.co/300x400/1a1a2e/84cc16?text=High+On+Life+2',
        hype: 'medium',
        month: 'February',
    },
    // March 2026
    {
        title: "Assassin's Creed Shadows",
        releaseDate: 'March 20, 2026',
        releasePeriod: 'March 2026',
        platforms: ['PC', 'PS5', 'Xbox Series X|S'],
        description: 'Set in feudal Japan, players explore themes of betrayal, mystery, and political intrigue. Play as both a shinobi and a samurai in an interconnected open world.',
        cover: 'https://placehold.co/300x400/1a1a2e/f59e0b?text=AC+Shadows',
        hype: 'high',
        month: 'March',
    },
    {
        title: 'Monster Hunter Stories 3',
        releaseDate: 'March 2026 (TBA)',
        releasePeriod: 'March 2026',
        platforms: ['Switch 2', 'PS5', 'PC'],
        description: 'The next chapter in the Monster Hunter RPG spin-off. Bond with monsters, explore new lands, and uncover a grand story in this turn-based adventure.',
        cover: 'https://placehold.co/300x400/1a1a2e/06b6d4?text=MH+Stories+3',
        hype: 'medium',
        month: 'March',
    },
    {
        title: 'Crimson Desert',
        releaseDate: 'March 2026 (TBA)',
        releasePeriod: 'March 2026',
        platforms: ['PC', 'PS5', 'Xbox Series X|S'],
        description: 'An open-world action-adventure from Pearl Abyss. Follow the story of mercenaries in a vast, beautifully realized fantasy world with intense real-time combat.',
        cover: 'https://placehold.co/300x400/1a1a2e/dc2626?text=Crimson+Desert',
        hype: 'high',
        month: 'March',
    },
    {
        title: '007 First Light',
        releaseDate: 'March 2026 (TBA)',
        releasePeriod: 'March 2026',
        platforms: ['PC', 'PS5', 'Xbox Series X|S'],
        description: 'A brand-new James Bond origin story from IO Interactive, creators of Hitman. Experience Bond\'s first mission as a 00 agent in an immersive stealth-action thriller.',
        cover: 'https://placehold.co/300x400/1a1a2e/64748b?text=007+First+Light',
        hype: 'high',
        month: 'March',
    },
    {
        title: 'Split Fiction',
        releaseDate: 'March 2026 (TBA)',
        releasePeriod: 'March 2026',
        platforms: ['PC', 'PS5', 'Xbox Series X|S'],
        description: 'The latest co-op adventure from Hazelight Studios (creators of It Takes Two). Two writers get trapped inside their own stories and must work together to escape.',
        cover: 'https://placehold.co/300x400/1a1a2e/ec4899?text=Split+Fiction',
        hype: 'high',
        month: 'March',
    },
    // Later 2026
    {
        title: 'DOOM: The Dark Ages',
        releaseDate: 'May 15, 2026',
        releasePeriod: 'May 2026',
        platforms: ['PC', 'PS5', 'Xbox Series X|S'],
        description: 'A medieval prequel to DOOM Eternal. The Doom Slayer battles demonic hordes in a dark fantasy setting with brutal melee combat, massive boss fights, and gothic castles.',
        cover: 'https://placehold.co/300x400/1a1a2e/ef4444?text=DOOM+Dark+Ages',
        hype: 'maximum',
        month: 'May',
    },
    {
        title: 'Ghost of Yōtei',
        releaseDate: '2026 (TBA)',
        releasePeriod: '2026',
        platforms: ['PS5'],
        description: 'The spiritual successor to Ghost of Tsushima. Set at the base of Mount Yōtei in 1603 Japan, follow a new protagonist in Sucker Punch\'s stunning open-world samurai epic.',
        cover: 'https://placehold.co/300x400/1a1a2e/22d3ee?text=Ghost+Yotei',
        hype: 'maximum',
        month: 'TBA',
    },
    {
        title: 'GTA VI',
        releaseDate: 'November 19, 2026',
        releasePeriod: 'November 2026',
        platforms: ['PS5', 'Xbox Series X|S'],
        description: 'The most anticipated game of the decade. Return to Vice City in a modern-day setting with dual protagonists. Rockstar Games\' magnum opus promises to redefine open-world gaming.',
        cover: 'https://placehold.co/300x400/1a1a2e/a855f7?text=GTA+VI',
        hype: 'maximum',
        month: 'November',
    },
];

const getHypeBadge = (hype: string): string => {
    switch (hype) {
        case 'maximum': return '🔥 Maximum Hype';
        case 'high': return '⚡ High Hype';
        case 'medium': return '✨ Notable';
        default: return '';
    }
};

const getHypeBadgeBg = (hype: string): string => {
    switch (hype) {
        case 'maximum': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'high': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'medium': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

export const UpcomingReleases: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredGames = UPCOMING_GAMES.filter((game) => {
        const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMonth = selectedMonth ? game.month === selectedMonth : true;
        return matchesSearch && matchesMonth;
    });

    const groupedByMonth = filteredGames.reduce((acc, game) => {
        const key = game.releasePeriod;
        if (!acc[key]) acc[key] = [];
        acc[key].push(game);
        return acc;
    }, {} as Record<string, UpcomingGame[]>);

    const availableMonths = [...new Set(UPCOMING_GAMES.map(g => g.month))];

    return (
        <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-4xl font-extrabold gradient-text mb-2">📅 Upcoming Releases</h1>
                <p className="text-gray-400 text-lg">
                    The most anticipated games coming in 2026
                </p>
            </motion.div>

            {/* Hype Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🎮</div>
                    <p className="text-2xl font-bold text-primary-400">{UPCOMING_GAMES.length}</p>
                    <p className="text-sm text-gray-400">Total Games</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🔥</div>
                    <p className="text-2xl font-bold text-red-400">{UPCOMING_GAMES.filter(g => g.hype === 'maximum').length}</p>
                    <p className="text-sm text-gray-400">Maximum Hype</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">📅</div>
                    <p className="text-2xl font-bold text-yellow-400">{availableMonths.length}</p>
                    <p className="text-sm text-gray-400">Release Windows</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🕹️</div>
                    <p className="text-2xl font-bold text-cyan-400">
                        {new Set(UPCOMING_GAMES.flatMap(g => g.platforms)).size}
                    </p>
                    <p className="text-sm text-gray-400">Platforms</p>
                </motion.div>
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants} className="space-y-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search upcoming games..."
                    className="w-full px-4 py-3 bg-dark-300 border border-dark-100 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <div className="flex gap-2 flex-wrap">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedMonth(null)}
                        className={`filter-btn ${selectedMonth === null ? 'active' : ''}`}
                    >
                        All
                    </motion.button>
                    {availableMonths.map((month) => (
                        <motion.button
                            key={month}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedMonth(month)}
                            className={`filter-btn ${selectedMonth === month ? 'active' : ''}`}
                        >
                            {month}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Games by Month */}
            {Object.entries(groupedByMonth).map(([period, games]) => (
                <motion.div key={period} variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-white">{period}</h2>
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-400 text-sm rounded-full font-medium">
                            {games.length} {games.length === 1 ? 'game' : 'games'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {games.map((game) => (
                            <motion.div
                                key={game.title}
                                className="game-card overflow-hidden"
                                whileHover={{ y: -5, borderColor: 'rgba(167, 139, 250, 0.6)' }}
                            >
                                <div className="flex flex-col sm:flex-row">
                                    {/* Cover */}
                                    <div className="sm:w-40 h-48 sm:h-auto flex-shrink-0 bg-dark-300 overflow-hidden relative">
                                        <img
                                            src={game.cover}
                                            alt={game.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 left-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${getHypeBadgeBg(game.hype)}`}>
                                                {getHypeBadge(game.hype)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 flex-1">
                                        <h3 className="text-xl font-bold text-white mb-1">{game.title}</h3>
                                        <p className="text-primary-400 text-sm font-medium mb-2">📅 {game.releaseDate}</p>
                                        <p className="text-gray-400 text-sm mb-3 line-clamp-3">{game.description}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {game.platforms.map((platform) => (
                                                <span
                                                    key={platform}
                                                    className="px-2 py-0.5 bg-dark-300 text-gray-300 text-xs rounded"
                                                >
                                                    {platform}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            ))}

            {filteredGames.length === 0 && (
                <motion.div
                    className="glass-card text-center py-16"
                    variants={itemVariants}
                >
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-2xl font-bold mb-2 text-white">No games found</h3>
                    <p className="text-gray-400">Try adjusting your search or month filter</p>
                </motion.div>
            )}

            {/* Most Anticipated Highlight */}
            <motion.div
                variants={itemVariants}
                className="glass-card p-8 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
                    border: '2px solid rgba(168, 85, 247, 0.3)',
                }}
            >
                <div className="absolute -right-10 -bottom-10 text-[120px] opacity-10">🎮</div>
                <div className="relative z-10">
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-sm font-bold mb-4 inline-block">
                        🔥 Most Anticipated
                    </span>
                    <h3 className="text-3xl font-extrabold text-white mb-2">GTA VI</h3>
                    <p className="text-gray-400 mb-4 max-w-2xl">
                        The most anticipated game of the decade returns to Vice City on November 19, 2026.
                        Rockstar Games promises to redefine open-world gaming with dual protagonists and a modern-day setting.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-sm">PS5</span>
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-sm">Xbox Series X|S</span>
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">November 19, 2026</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
