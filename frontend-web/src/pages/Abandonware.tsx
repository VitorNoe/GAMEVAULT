import React, { useState } from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.04 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

interface AbandonwareGame {
    title: string;
    year?: number;
    platform: string;
    category: string;
    genre: string;
    description: string;
    cover: string;
}

const ABANDONWARE_GAMES: AbandonwareGame[] = [
    // PC DOS/Windows - Adventure & Action
    { title: 'Prince of Persia', year: 1989, platform: 'PC (DOS)', category: 'pc-classic', genre: 'Action / Adventure', description: 'A groundbreaking cinematic platformer where players navigate deadly traps and sword fights to rescue a princess within 60 minutes. Revolutionary rotoscoped animation.', cover: 'https://placehold.co/300x400/1a1a2e/f59e0b?text=Prince+of+Persia' },
    { title: 'Another World', year: 1991, platform: 'PC (DOS)', category: 'pc-classic', genre: 'Action / Adventure', description: 'A visually stunning cinematic platformer created by Éric Chahi. A physicist is transported to an alien world and must survive using wits and determination.', cover: 'https://placehold.co/300x400/1a1a2e/3b82f6?text=Another+World' },
    { title: 'Flashback', year: 1992, platform: 'PC (DOS)', category: 'pc-classic', genre: 'Action / Adventure', description: 'A sci-fi cinematic platformer featuring rotoscoped animation. Agent Conrad Hart must recover his lost memories and uncover an alien conspiracy.', cover: 'https://placehold.co/300x400/1a1a2e/06b6d4?text=Flashback' },
    { title: 'Blackthorne', year: 1994, platform: 'PC (DOS)', category: 'pc-classic', genre: 'Action / Adventure', description: 'A dark action platformer by Blizzard Entertainment. Kyle Blackthorne returns to his homeworld to free his people from the evil Sarlac using a shotgun and acrobatics.', cover: 'https://placehold.co/300x400/1a1a2e/64748b?text=Blackthorne' },
    { title: 'Lemmings', year: 1991, platform: 'PC (DOS)', category: 'pc-classic', genre: 'Puzzle', description: 'Guide hordes of mindlessly walking lemmings to safety by assigning them skills. One of the most iconic puzzle games ever, requiring creative problem-solving.', cover: 'https://placehold.co/300x400/1a1a2e/22c55e?text=Lemmings' },
    { title: 'The Incredible Machine', year: 1993, platform: 'PC (DOS)', category: 'pc-classic', genre: 'Puzzle', description: 'A Rube Goldberg-style puzzle game where players construct elaborate machines from everyday objects to accomplish simple tasks in creative ways.', cover: 'https://placehold.co/300x400/1a1a2e/a855f7?text=Incredible+Machine' },

    // PC DOS/Windows - RPG
    { title: 'Ultima Series', year: 1981, platform: 'PC (DOS)', category: 'pc-classic', genre: 'RPG', description: 'Richard Garriott\'s legendary RPG series that defined the genre. Explore the land of Britannia, follow the virtues, and become the Avatar in this groundbreaking franchise.', cover: 'https://placehold.co/300x400/1a1a2e/eab308?text=Ultima' },
    { title: "King's Quest Series", year: 1984, platform: 'PC (DOS)', category: 'pc-classic', genre: 'Adventure / RPG', description: 'Sierra\'s flagship adventure game series featuring the royal family of Daventry. Pioneered the graphical adventure genre with puzzles, humor, and fairy-tale worlds.', cover: 'https://placehold.co/300x400/1a1a2e/ec4899?text=Kings+Quest' },
    { title: 'Kyrandia Series', year: 1992, platform: 'PC (DOS)', category: 'pc-classic', genre: 'Adventure / RPG', description: 'Westwood Studios\' fantasy adventure trilogy featuring beautiful hand-painted graphics and clever puzzles in the magical land of Kyrandia.', cover: 'https://placehold.co/300x400/1a1a2e/8b5cf6?text=Kyrandia' },
    { title: 'Alter Ego', year: 1986, platform: 'PC (DOS)', category: 'pc-classic', genre: 'RPG / Simulation', description: 'A unique life simulation RPG where you live an entire human life from birth to death. Make choices that shape your character\'s personality, career, and relationships.', cover: 'https://placehold.co/300x400/1a1a2e/14b8a6?text=Alter+Ego' },

    // PC DOS/Windows - Strategy
    { title: 'Civilization', year: 1991, platform: 'PC (DOS)', category: 'pc-classic', genre: 'Strategy', description: 'Sid Meier\'s legendary 4X strategy game. Build a civilization from scratch and guide it through the ages from the Stone Age to the Space Age. One more turn...', cover: 'https://placehold.co/300x400/1a1a2e/f97316?text=Civilization' },
    { title: 'SimCity', year: 1989, platform: 'PC (DOS)', category: 'pc-classic', genre: 'Strategy / Simulation', description: 'Will Wright\'s city-building masterpiece. Plan zones, manage budgets, and deal with disasters as you build the city of your dreams from the ground up.', cover: 'https://placehold.co/300x400/1a1a2e/22c55e?text=SimCity' },
    { title: 'Warcraft: Orcs & Humans', year: 1994, platform: 'PC (DOS)', category: 'pc-classic', genre: 'RTS', description: 'Blizzard\'s first RTS that launched one of gaming\'s biggest franchises. Command human or orc armies in a medieval fantasy war across the kingdom of Azeroth.', cover: 'https://placehold.co/300x400/1a1a2e/dc2626?text=Warcraft' },
    { title: 'Command & Conquer', year: 1995, platform: 'PC (DOS)', category: 'pc-classic', genre: 'RTS', description: 'Westwood Studios\' groundbreaking RTS that defined the genre. GDI vs NOD in a near-future conflict over Tiberium, featuring FMV cutscenes and addictive gameplay.', cover: 'https://placehold.co/300x400/1a1a2e/84cc16?text=C%26C' },

    // PC DOS/Windows - Arcade Classics
    { title: 'Pac-Man', year: 1980, platform: 'Arcade / PC', category: 'pc-classic', genre: 'Arcade', description: 'The iconic maze-chase game that defined the golden age of arcades. Navigate Pac-Man through mazes, eating dots and avoiding ghosts in this timeless classic.', cover: 'https://placehold.co/300x400/1a1a2e/eab308?text=Pac-Man' },
    { title: 'Arkanoid', year: 1986, platform: 'Arcade / PC', category: 'pc-classic', genre: 'Arcade / Breakout', description: 'The definitive brick-breaking game. Control the Vaus spacecraft and destroy blocks with a bouncing energy ball while collecting power-ups.', cover: 'https://placehold.co/300x400/1a1a2e/60a5fa?text=Arkanoid' },
    { title: 'Tetris', year: 1984, platform: 'PC / Multi', category: 'pc-classic', genre: 'Puzzle', description: 'Alexey Pajitnov\'s legendary puzzle game. Arrange falling tetrominoes to complete lines in one of the most played video games in history.', cover: 'https://placehold.co/300x400/1a1a2e/ef4444?text=Tetris' },
    { title: 'Galaxian', year: 1979, platform: 'Arcade / PC', category: 'pc-classic', genre: 'Arcade / Shooter', description: 'A pioneering space shooter that improved upon Space Invaders with colorful sprites and diving enemy attack patterns. A true arcade legend.', cover: 'https://placehold.co/300x400/1a1a2e/a855f7?text=Galaxian' },
    { title: 'Frogger', year: 1981, platform: 'Arcade / PC', category: 'pc-classic', genre: 'Arcade', description: 'Help a frog cross a busy road and navigate a river full of hazards. Simple concept, addictive gameplay that has endured for decades.', cover: 'https://placehold.co/300x400/1a1a2e/22c55e?text=Frogger' },
    { title: 'Xenon 2: Megablast', year: 1989, platform: 'PC (DOS)', category: 'pc-classic', genre: 'Shoot \'em up', description: 'A vertical scrolling shooter with a pounding soundtrack by Bomb the Bass. Features impressive graphics, varied enemies, and an upgradeable weapon system.', cover: 'https://placehold.co/300x400/1a1a2e/06b6d4?text=Xenon+2' },

    // PC - Racing
    { title: 'Test Drive Series', year: 1987, platform: 'PC (DOS)', category: 'pc-classic', genre: 'Racing', description: 'One of the first racing game franchises. Drive exotic supercars on treacherous mountain roads while evading police. Revolutionized the racing genre.', cover: 'https://placehold.co/300x400/1a1a2e/f59e0b?text=Test+Drive' },
    { title: 'Need for Speed (1994)', year: 1994, platform: 'PC', category: 'pc-classic', genre: 'Racing', description: 'The original Need for Speed that launched EA\'s biggest racing franchise. Drive exotic cars on scenic roads with groundbreaking 3D graphics for the time.', cover: 'https://placehold.co/300x400/1a1a2e/3b82f6?text=NFS+1994' },

    // PS2 - Action & Adventure
    { title: 'Grand Theft Auto: San Andreas', year: 2004, platform: 'PS2', category: 'ps2', genre: 'Action / Open World', description: 'Expanded the open-world genre with a massive map including cities, deserts, and forests. Follow CJ\'s story across the state of San Andreas in one of gaming\'s greatest adventures.', cover: 'https://placehold.co/300x400/1a1a2e/22c55e?text=GTA+SA' },
    { title: 'God of War (1 & 2)', year: 2005, platform: 'PS2', category: 'ps2', genre: 'Action / Adventure', description: 'Kratos rages against the gods of Olympus in this brutal, combo-driven action series. Greek mythology meets visceral gameplay with epic boss battles and cinematic spectacle.', cover: 'https://placehold.co/300x400/1a1a2e/dc2626?text=God+of+War' },
    { title: 'Devil May Cry (1, 2 & 3)', year: 2001, platform: 'PS2', category: 'ps2', genre: 'Action / Hack \'n\' Slash', description: 'Dante\'s stylish demon-hunting action defined the character action genre. DMC3 especially is considered one of the best action games ever made.', cover: 'https://placehold.co/300x400/1a1a2e/ef4444?text=Devil+May+Cry' },
    { title: 'Shadow of the Colossus', year: 2005, platform: 'PS2', category: 'ps2', genre: 'Action / Adventure', description: 'A masterpiece of minimalist design. Defeat 16 towering colossi across a desolate landscape to save a girl. Often cited as one of gaming\'s greatest artistic achievements.', cover: 'https://placehold.co/300x400/1a1a2e/64748b?text=Shadow+Colossus' },
    { title: 'Okami', year: 2006, platform: 'PS2', category: 'ps2', genre: 'Action / Adventure', description: 'Play as Amaterasu, the sun goddess in wolf form, using a celestial brush to restore life to a cursed Japan. Beautiful sumi-e art style and Zelda-like adventure.', cover: 'https://placehold.co/300x400/1a1a2e/eab308?text=Okami' },
    { title: 'Bully', year: 2006, platform: 'PS2', category: 'ps2', genre: 'Action / Adventure', description: 'Created by Rockstar, players control Jimmy Hopkins navigating the challenges of life at Bullworth Academy. A unique open-world experience in a school setting.', cover: 'https://placehold.co/300x400/1a1a2e/f97316?text=Bully' },
    { title: 'Prince of Persia: The Sands of Time', year: 2003, platform: 'PS2', category: 'ps2', genre: 'Action / Adventure', description: 'A brilliant reinvention of the classic franchise with time-manipulation mechanics, fluid acrobatic combat, and a charming story of a prince and princess.', cover: 'https://placehold.co/300x400/1a1a2e/a855f7?text=PoP+Sands' },

    // PS2 - RPG
    { title: 'Final Fantasy X', year: 2001, platform: 'PS2', category: 'ps2', genre: 'JRPG', description: 'Tidus and Yuna\'s emotional journey in Spira. The first fully-voiced Final Fantasy with the innovative Conditional Turn-Based battle system and a heartbreaking story.', cover: 'https://placehold.co/300x400/1a1a2e/60a5fa?text=FFX' },
    { title: 'Final Fantasy XII', year: 2006, platform: 'PS2', category: 'ps2', genre: 'JRPG', description: 'Set in the world of Ivalice, this entry introduced the Gambit system for AI control and real-time combat. A political epic with a vast open world to explore.', cover: 'https://placehold.co/300x400/1a1a2e/8b5cf6?text=FFXII' },
    { title: 'Kingdom Hearts', year: 2002, platform: 'PS2', category: 'ps2', genre: 'Action RPG', description: 'The magical crossover between Disney and Final Fantasy. Sora, Donald, and Goofy traverse Disney worlds fighting the Heartless in this beloved action RPG.', cover: 'https://placehold.co/300x400/1a1a2e/ec4899?text=Kingdom+Hearts' },

    // PS2 - Horror
    { title: 'Silent Hill 2', year: 2001, platform: 'PS2', category: 'ps2', genre: 'Survival Horror', description: 'A psychological horror masterpiece. James Sunderland journeys to Silent Hill after receiving a letter from his deceased wife. Atmospheric terror, iconic soundtrack, and groundbreaking plot twists.', cover: 'https://placehold.co/300x400/1a1a2e/64748b?text=Silent+Hill+2' },
    { title: 'Resident Evil 4', year: 2005, platform: 'PS2', category: 'ps2', genre: 'Survival Horror / Action', description: 'A revolutionary reimagining of the series with over-the-shoulder camera and intense action. Leon S. Kennedy rescues the president\'s daughter in rural Spain. Redefined the genre.', cover: 'https://placehold.co/300x400/1a1a2e/dc2626?text=RE4' },

    // PS2 - FPS
    { title: 'Black', year: 2006, platform: 'PS2', category: 'ps2', genre: 'FPS', description: 'A cinematic FPS pushing PS2 hardware to its limits. Explosive, destructible environments and incredible graphics that surpassed many titles of its generation. Often ranked in top 100 FPS.', cover: 'https://placehold.co/300x400/1a1a2e/1e293b?text=Black' },

    // PS2 - Racing
    { title: 'Need for Speed: Most Wanted (2005)', year: 2005, platform: 'PS2', category: 'ps2', genre: 'Racing', description: 'The definitive NFS experience. Open-world racing, intense police chases, and a memorable Blacklist of street racers to defeat. A fan-favorite that defined arcade racing.', cover: 'https://placehold.co/300x400/1a1a2e/eab308?text=NFS+MW' },
    { title: 'Need for Speed: Underground (1 & 2)', year: 2003, platform: 'PS2', category: 'ps2', genre: 'Racing', description: 'The underground street racing games that brought tuner culture to gaming. Deep car customization, neon-lit city racing, and a pulsing soundtrack.', cover: 'https://placehold.co/300x400/1a1a2e/3b82f6?text=NFS+Underground' },
    { title: 'Burnout 3: Takedown', year: 2004, platform: 'PS2', category: 'ps2', genre: 'Racing', description: 'The ultimate arcade racer with spectacular crashes and takedown mechanics. Insanely fast races, multiple game modes, and the most satisfying crashes in gaming history.', cover: 'https://placehold.co/300x400/1a1a2e/f97316?text=Burnout+3' },

    // PS2 - Sports
    { title: 'Pro Evolution Soccer (Winning Eleven)', year: 2001, platform: 'PS2', category: 'ps2', genre: 'Sports', description: 'Konami\'s legendary football simulation that dominated the PS2 era. Superior gameplay, Master League mode, and tight controls made it the definitive football game for a generation.', cover: 'https://placehold.co/300x400/1a1a2e/22c55e?text=PES' },

    // PS2 - Stealth
    { title: 'Metal Gear Solid 3: Snake Eater', year: 2004, platform: 'PS2', category: 'ps2', genre: 'Stealth / Action', description: 'Brought a completely new approach to the series with emphasis on jungle survival. The origin story of Big Boss features camouflage mechanics, hunting, and one of gaming\'s greatest stories.', cover: 'https://placehold.co/300x400/1a1a2e/84cc16?text=MGS3' },
];

const CATEGORIES = [
    { id: 'all', label: 'All Games', icon: '🎮' },
    { id: 'pc-classic', label: 'PC Classics (DOS/Windows)', icon: '💻' },
    { id: 'ps2', label: 'PS2 Classics', icon: '🕹️' },
];

const GENRES = [...new Set(ABANDONWARE_GAMES.map(g => g.genre))].sort();

export const Abandonware: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedGenre, setSelectedGenre] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredGames = ABANDONWARE_GAMES.filter((game) => {
        const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            game.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
        const matchesGenre = selectedGenre === 'all' || game.genre === selectedGenre;
        return matchesSearch && matchesCategory && matchesGenre;
    });

    const pcCount = ABANDONWARE_GAMES.filter(g => g.category === 'pc-classic').length;
    const ps2Count = ABANDONWARE_GAMES.filter(g => g.category === 'ps2').length;

    return (
        <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-4xl font-extrabold gradient-text mb-2">📦 Abandonware Collection</h1>
                <p className="text-gray-400 text-lg">
                    Preserving classic games — from DOS-era gems to PS2 legends
                </p>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">📦</div>
                    <p className="text-2xl font-bold text-primary-400">{ABANDONWARE_GAMES.length}</p>
                    <p className="text-sm text-gray-400">Classic Games</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">💻</div>
                    <p className="text-2xl font-bold text-blue-400">{pcCount}</p>
                    <p className="text-sm text-gray-400">PC Classics</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🕹️</div>
                    <p className="text-2xl font-bold text-green-400">{ps2Count}</p>
                    <p className="text-sm text-gray-400">PS2 Classics</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🎭</div>
                    <p className="text-2xl font-bold text-yellow-400">{GENRES.length}</p>
                    <p className="text-sm text-gray-400">Genres</p>
                </motion.div>
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants} className="space-y-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search classic games..."
                    className="w-full px-4 py-3 bg-dark-300 border border-dark-100 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />

                {/* Platform Filter */}
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map((cat) => (
                        <motion.button
                            key={cat.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                        >
                            {cat.icon} {cat.label}
                        </motion.button>
                    ))}
                </div>

                {/* Genre Filter */}
                <div className="flex gap-2 flex-wrap">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedGenre('all')}
                        className={`filter-btn text-xs ${selectedGenre === 'all' ? 'active' : ''}`}
                    >
                        All Genres
                    </motion.button>
                    {GENRES.map((genre) => (
                        <motion.button
                            key={genre}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedGenre(genre)}
                            className={`filter-btn text-xs ${selectedGenre === genre ? 'active' : ''}`}
                        >
                            {genre}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Games Grid */}
            {filteredGames.length > 0 ? (
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    variants={containerVariants}
                >
                    {filteredGames.map((game) => (
                        <motion.div
                            key={game.title}
                            className="game-card group overflow-hidden"
                            variants={itemVariants}
                            whileHover={{ y: -5, borderColor: 'rgba(167, 139, 250, 0.6)' }}
                        >
                            {/* Cover */}
                            <div className="relative h-48 bg-dark-300 overflow-hidden mb-4 rounded-lg">
                                <img
                                    src={game.cover}
                                    alt={game.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute top-2 left-2">
                                    <span className="px-2 py-1 rounded text-xs font-bold bg-amber-500/80 backdrop-blur-sm text-black">
                                        📦 {game.category === 'ps2' ? 'PS2 Classic' : 'PC Classic'}
                                    </span>
                                </div>
                                {game.year && (
                                    <div className="absolute top-2 right-2">
                                        <span className="px-2 py-1 rounded text-xs font-bold bg-black/70 backdrop-blur-sm text-white">
                                            {game.year}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-transparent to-transparent opacity-60" />
                            </div>

                            {/* Info */}
                            <div>
                                <h3 className="font-bold text-lg mb-1 text-white group-hover:text-primary-400 transition-colors line-clamp-1">
                                    {game.title}
                                </h3>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-lg">
                                        {game.genre}
                                    </span>
                                    <span className="px-2 py-0.5 bg-dark-300 text-gray-400 text-xs rounded-lg">
                                        {game.platform}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                                    {game.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    className="glass-card text-center py-16"
                    variants={itemVariants}
                >
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-2xl font-bold mb-2 text-white">No games found</h3>
                    <p className="text-gray-400">Try adjusting your search, platform, or genre filter</p>
                </motion.div>
            )}

            {/* Preservation Notice */}
            <motion.div
                variants={itemVariants}
                className="glass-card p-8 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                    border: '2px solid rgba(245, 158, 11, 0.3)',
                }}
            >
                <div className="absolute -right-10 -bottom-10 text-[120px] opacity-10">🏛️</div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-extrabold text-white mb-3">🏛️ About Game Preservation</h3>
                    <p className="text-gray-400 leading-relaxed max-w-3xl">
                        Abandonware refers to software that is no longer sold, supported, or maintained by its publisher.
                        These games represent important milestones in gaming history. Organizations like the Internet Archive,
                        GOG.com, and the Video Game History Foundation work to preserve these titles for future generations.
                        Many of these classic games have been re-released on modern platforms — always support official releases when available.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};
