import React, { useState } from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

interface GotyWinner {
    year: number;
    title: string;
    cover: string;
    developer: string;
    description: string;
    metacritic?: number;
    platforms: string[];
}

const GOTY_WINNERS: GotyWinner[] = [
    {
        year: 2025,
        title: 'Clair Obscur: Expedition 33',
        cover: 'https://gaming-cdn.com/images/products/17015/616x353/clair-obscur-expedition-33-pc-steam-cover.jpg?v=1750336145',
        developer: 'Sandfall Interactive',
        description: 'A stunning turn-based RPG set in a painterly world where art comes to life. Players embark on Expedition 33, a desperate mission to destroy the Paintress before she can erase more of humanity.',
        metacritic: 88,
        platforms: ['PC', 'PS5', 'Xbox Series X|S'],
    },
    {
        year: 2024,
        title: 'Astro Bot',
        cover: 'https://upload.wikimedia.org/wikipedia/en/4/4f/Astro_Bot_cover_art.jpg',
        developer: 'Team Asobi',
        description: 'A delightful 3D platformer that showcases the PS5\'s capabilities with inventive gameplay, charming characters, and masterful level design that pays homage to PlayStation\'s legacy.',
        metacritic: 94,
        platforms: ['PS5'],
    },
    {
        year: 2023,
        title: "Baldur's Gate 3",
        cover: 'https://upload.wikimedia.org/wikipedia/en/6/68/Baldur%27s_Gate_3_cover_art.jpg',
        developer: 'Larian Studios',
        description: 'An epic RPG masterpiece based on D&D 5th Edition. Features unprecedented player choice, deep narrative branching, and tactical turn-based combat in a richly detailed fantasy world.',
        metacritic: 96,
        platforms: ['PC', 'PS5', 'Xbox Series X|S'],
    },
    {
        year: 2022,
        title: 'Elden Ring',
        cover: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg',
        developer: 'FromSoftware',
        description: 'A groundbreaking open-world action RPG created by Hidetaka Miyazaki and George R.R. Martin. Explores the Lands Between with challenging combat and deep lore in a vast, interconnected world.',
        metacritic: 96,
        platforms: ['PC', 'PS5', 'PS4', 'Xbox Series X|S', 'Xbox One'],
    },
    {
        year: 2021,
        title: 'It Takes Two',
        cover: 'https://upload.wikimedia.org/wikipedia/en/b/bb/It_Takes_Two_cover_art.jpg',
        developer: 'Hazelight Studios',
        description: 'A genre-bending co-op adventure about a couple turned into dolls by their daughter\'s wish. Each level introduces completely unique gameplay mechanics in a heartwarming journey.',
        metacritic: 88,
        platforms: ['PC', 'PS5', 'PS4', 'Xbox Series X|S', 'Xbox One', 'Switch'],
    },
    {
        year: 2020,
        title: 'The Last of Us Part II',
        cover: 'https://upload.wikimedia.org/wikipedia/en/4/4f/TLOU_P2_Box_Art_2.png',
        developer: 'Naughty Dog',
        description: 'A harrowing tale of vengeance and redemption. Ellie sets out to find justice after a devastating event, pushing the boundaries of interactive storytelling with brutal, emotional gameplay.',
        metacritic: 93,
        platforms: ['PS4', 'PS5', 'PC'],
    },
    {
        year: 2019,
        title: 'Sekiro: Shadows Die Twice',
        cover: 'https://upload.wikimedia.org/wikipedia/en/6/6e/Sekiro_art.jpg',
        developer: 'FromSoftware',
        description: 'A fierce action-adventure set in Sengoku Japan. Play as the "one-armed wolf" shinobi in a world of swordplay, stealth, and resurrection mechanics that redefine the action genre.',
        metacritic: 90,
        platforms: ['PC', 'PS4', 'Xbox One'],
    },
    {
        year: 2018,
        title: 'God of War',
        cover: 'https://upload.wikimedia.org/wikipedia/en/a/a7/God_of_War_4_cover.jpg',
        developer: 'Santa Monica Studio',
        description: 'A bold reimagining of the series following Kratos and his son Atreus in Norse mythology. Features a single-shot camera, visceral combat, and an emotionally resonant father-son story.',
        metacritic: 94,
        platforms: ['PS4', 'PC'],
    },
    {
        year: 2017,
        title: 'The Legend of Zelda: Breath of the Wild',
        cover: 'https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg',
        developer: 'Nintendo EPD',
        description: 'A revolutionary open-world action-adventure that redefined the Zelda franchise. Explore the vast kingdom of Hyrule with unprecedented freedom in physics-based puzzle solving and exploration.',
        metacritic: 97,
        platforms: ['Switch', 'Wii U'],
    },
    {
        year: 2016,
        title: 'Overwatch',
        cover: 'https://upload.wikimedia.org/wikipedia/en/5/51/Overwatch_cover_art.jpg',
        developer: 'Blizzard Entertainment',
        description: 'A team-based multiplayer FPS featuring a diverse cast of heroes with unique abilities. Defined a generation of competitive gaming with its accessible yet deep gameplay.',
        metacritic: 91,
        platforms: ['PC', 'PS4', 'Xbox One'],
    },
    {
        year: 2015,
        title: 'The Witcher 3: Wild Hunt',
        cover: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Witcher_3_cover_art.jpg',
        developer: 'CD Projekt Red',
        description: 'An epic open-world RPG following Geralt of Rivia in his search for his adopted daughter. Features rich storytelling, morally complex choices, and a breathtaking open world.',
        metacritic: 93,
        platforms: ['PC', 'PS4', 'Xbox One', 'Switch', 'PS5', 'Xbox Series X|S'],
    },
    {
        year: 2014,
        title: 'Dragon Age: Inquisition',
        cover: 'https://upload.wikimedia.org/wikipedia/en/9/91/Dragon_Age_Inquisition_BoxArt.jpg',
        developer: 'BioWare',
        description: 'An epic RPG where you lead the Inquisition to restore order across Thedas. Features deep character customization, tactical combat, and meaningful choices that shape the world.',
        metacritic: 85,
        platforms: ['PC', 'PS4', 'PS3', 'Xbox One', 'Xbox 360'],
    },
];

const getScoreColor = (score: number): string => {
    if (score >= 90) return 'from-green-400 to-emerald-500';
    if (score >= 80) return 'from-yellow-400 to-amber-500';
    if (score >= 70) return 'from-orange-400 to-orange-500';
    return 'from-red-400 to-red-500';
};

const getScoreBg = (score: number): string => {
    if (score >= 90) return 'bg-green-500/80';
    if (score >= 80) return 'bg-yellow-500/80';
    if (score >= 70) return 'bg-orange-500/80';
    return 'bg-red-500/80';
};

export const GotyAwards: React.FC = () => {
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredWinners = GOTY_WINNERS.filter((winner) => {
        const matchesSearch = winner.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            winner.developer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesYear = selectedYear ? winner.year === selectedYear : true;
        return matchesSearch && matchesYear;
    });

    return (
        <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-4xl font-extrabold gradient-text mb-2">🏆 The Game Awards — GOTY Winners</h1>
                <p className="text-gray-400 text-lg">
                    Celebrating the greatest games of each year, as voted at The Game Awards
                </p>
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants} className="space-y-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title or developer..."
                    className="w-full px-4 py-3 bg-dark-300 border border-dark-100 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <div className="flex gap-2 flex-wrap">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedYear(null)}
                        className={`filter-btn ${selectedYear === null ? 'active' : ''}`}
                    >
                        All Years
                    </motion.button>
                    {GOTY_WINNERS.map((w) => (
                        <motion.button
                            key={w.year}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedYear(w.year)}
                            className={`filter-btn ${selectedYear === w.year ? 'active' : ''}`}
                        >
                            {w.year}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Timeline View */}
            <motion.div className="space-y-8" variants={containerVariants}>
                {filteredWinners.map((winner, index) => (
                    <motion.div
                        key={winner.year}
                        variants={itemVariants}
                        className="relative"
                    >
                        {/* Year Badge */}
                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0 w-20 text-center">
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className="inline-block px-4 py-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
                                >
                                    <span className="text-2xl font-extrabold text-yellow-400">{winner.year}</span>
                                </motion.div>
                                {index < filteredWinners.length - 1 && (
                                    <div className="w-0.5 h-full bg-gradient-to-b from-yellow-500/30 to-transparent mx-auto mt-2 min-h-[40px]" />
                                )}
                            </div>

                            {/* Game Card */}
                            <motion.div
                                className="flex-1 glass-card p-0 overflow-hidden"
                                whileHover={{ y: -4, borderColor: 'rgba(234, 179, 8, 0.5)' }}
                            >
                                <div className="flex flex-col md:flex-row">
                                    {/* Cover */}
                                    <div className="md:w-48 h-48 md:h-auto flex-shrink-0 bg-dark-300 overflow-hidden relative">
                                        <img
                                            src={winner.cover}
                                            alt={winner.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = `https://placehold.co/300x400/1a1a2e/a78bfa?text=${encodeURIComponent(winner.title.substring(0, 15))}`;
                                            }}
                                        />
                                        <div className="absolute top-2 left-2">
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-500/90 backdrop-blur-sm text-black">
                                                🏆 GOTY
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-6 flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-2xl font-bold text-white mb-1">{winner.title}</h3>
                                                <p className="text-primary-400 font-medium">{winner.developer}</p>
                                            </div>
                                            {winner.metacritic && (
                                                <div className={`px-3 py-1 rounded-lg text-white font-bold text-lg ${getScoreBg(winner.metacritic)}`}>
                                                    {winner.metacritic}
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-gray-400 mb-4 leading-relaxed">
                                            {winner.description}
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {winner.platforms.map((platform) => (
                                                <span
                                                    key={platform}
                                                    className="px-2 py-1 bg-dark-300 text-gray-300 text-xs rounded-lg"
                                                >
                                                    {platform}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {filteredWinners.length === 0 && (
                <motion.div
                    className="glass-card text-center py-16"
                    variants={itemVariants}
                >
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-2xl font-bold mb-2 text-white">No results found</h3>
                    <p className="text-gray-400">Try adjusting your search or year filter</p>
                </motion.div>
            )}

            {/* Stats Summary */}
            <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🏆</div>
                    <p className="text-2xl font-bold text-yellow-400">{GOTY_WINNERS.length}</p>
                    <p className="text-sm text-gray-400">Awards Tracked</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">📅</div>
                    <p className="text-2xl font-bold text-primary-400">{GOTY_WINNERS[0]?.year} - {GOTY_WINNERS[GOTY_WINNERS.length - 1]?.year}</p>
                    <p className="text-sm text-gray-400">Year Range</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">⭐</div>
                    <p className="text-2xl font-bold text-green-400">
                        {Math.round(GOTY_WINNERS.reduce((sum, w) => sum + (w.metacritic || 0), 0) / GOTY_WINNERS.length)}
                    </p>
                    <p className="text-sm text-gray-400">Avg Metacritic</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🎮</div>
                    <p className="text-2xl font-bold text-cyan-400">
                        {new Set(GOTY_WINNERS.map(w => w.developer)).size}
                    </p>
                    <p className="text-sm text-gray-400">Unique Studios</p>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};
