import sequelize from '../config/database';
import {
  User, Developer, Publisher, Genre, Platform, Game, Award, PreservationSource,
  UserCollection, Wishlist, Review, Notification, RereleaseRequest, RereleaseVote,
  GamePlatform, GameGenre, GameAward, GamePreservation, UserActivity, GameStatusHistory,
} from '../models';
import bcrypt from 'bcrypt';

/**
 * Seeds the database with sample data for development.
 * Uses upsert-like pattern: insert if not exists, then query actual records.
 */

async function seed(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    console.log('🌱 Seeding database...\n');

    // ============================================
    // USERS
    // ============================================
    const passwordHash = await bcrypt.hash('Password123!', 10);
    await User.bulkCreate([
      { name: 'Admin User', email: 'admin@gamevault.com', password_hash: passwordHash, type: 'admin', email_verified: true },
      { name: 'John Doe', email: 'john@example.com', password_hash: passwordHash, type: 'regular', email_verified: true },
      { name: 'Jane Smith', email: 'jane@example.com', password_hash: passwordHash, type: 'regular', email_verified: true },
      { name: 'Retro Gamer', email: 'retro@example.com', password_hash: passwordHash, type: 'regular', email_verified: false },
    ], { ignoreDuplicates: true });
    const users = await User.findAll({ order: [['id', 'ASC']], limit: 10 });
    console.log(`✅ Users ready (${users.length} total)`);

    // ============================================
    // DEVELOPERS
    // ============================================
    await Developer.bulkCreate([
      { name: 'Nintendo EPD', slug: 'nintendo-epd', status: 'active', foundation_year: 2015, website: 'https://www.nintendo.com' },
      { name: 'Sony Interactive Entertainment', slug: 'sony-interactive', status: 'active', foundation_year: 1993, website: 'https://www.sie.com' },
      { name: 'CD Projekt Red', slug: 'cd-projekt-red', status: 'active', foundation_year: 2002, website: 'https://www.cdprojektred.com' },
      { name: 'Rockstar Games', slug: 'rockstar-games', status: 'active', foundation_year: 1998, website: 'https://www.rockstargames.com' },
      { name: 'FromSoftware', slug: 'fromsoftware', status: 'active', foundation_year: 1986, website: 'https://www.fromsoftware.jp' },
      { name: 'Naughty Dog', slug: 'naughty-dog', status: 'active', foundation_year: 1984, website: 'https://www.naughtydog.com' },
      { name: 'Valve', slug: 'valve', status: 'active', foundation_year: 1996, website: 'https://www.valvesoftware.com' },
      { name: 'Bethesda Game Studios', slug: 'bethesda-game-studios', status: 'active', foundation_year: 2001, website: 'https://bethesdagamestudios.com' },
      { name: 'Larian Studios', slug: 'larian-studios', status: 'active', foundation_year: 1996, website: 'https://larian.com' },
      { name: 'Supergiant Games', slug: 'supergiant-games', status: 'active', foundation_year: 2009, website: 'https://www.supergiantgames.com' },
      { name: 'Capcom', slug: 'capcom', status: 'active', foundation_year: 1979, website: 'https://www.capcom.com' },
      { name: 'Insomniac Games', slug: 'insomniac-games', status: 'active', foundation_year: 1994, website: 'https://insomniac.games' },
      { name: 'Team Cherry', slug: 'team-cherry', status: 'active', foundation_year: 2014, website: 'https://teamcherry.com.au' },
      { name: 'Westwood Studios', slug: 'westwood-studios', status: 'closed', foundation_year: 1985, closure_year: 2003 },
      { name: 'LucasArts', slug: 'lucasarts', status: 'closed', foundation_year: 1982, closure_year: 2013 },
    ], { ignoreDuplicates: true });
    // Build slug → record map for reliable FK lookups
    const allDevs = await Developer.findAll();
    const devBySlug = Object.fromEntries(allDevs.map(d => [d.getDataValue('slug'), d]));
    console.log(`✅ Developers ready (${allDevs.length} total)`);

    // ============================================
    // PUBLISHERS
    // ============================================
    await Publisher.bulkCreate([
      { name: 'Nintendo', slug: 'nintendo', status: 'active', foundation_year: 1889, website: 'https://www.nintendo.com' },
      { name: 'Sony Interactive Entertainment', slug: 'sony-interactive', status: 'active', foundation_year: 1993, website: 'https://www.sie.com' },
      { name: 'Microsoft Studios', slug: 'microsoft-studios', status: 'active', foundation_year: 2002, website: 'https://www.xbox.com/games' },
      { name: 'CD Projekt', slug: 'cd-projekt', status: 'active', foundation_year: 1994, website: 'https://www.cdprojekt.com' },
      { name: 'Rockstar Games', slug: 'rockstar-games', status: 'active', foundation_year: 1998, website: 'https://www.rockstargames.com' },
      { name: 'Bandai Namco', slug: 'bandai-namco', status: 'active', foundation_year: 2006, website: 'https://www.bandainamcoent.com' },
      { name: 'Valve', slug: 'valve', status: 'active', foundation_year: 1996, website: 'https://www.valvesoftware.com' },
      { name: 'Bethesda Softworks', slug: 'bethesda-softworks', status: 'active', foundation_year: 1986, website: 'https://bethesda.net' },
      { name: 'Capcom', slug: 'capcom', status: 'active', foundation_year: 1979, website: 'https://www.capcom.com' },
      { name: 'Larian Studios', slug: 'larian-studios', status: 'active', foundation_year: 1996, website: 'https://larian.com' },
    ], { ignoreDuplicates: true });
    const allPubs = await Publisher.findAll();
    const pubBySlug = Object.fromEntries(allPubs.map(p => [p.getDataValue('slug'), p]));
    console.log(`✅ Publishers ready (${allPubs.length} total)`);

    // ============================================
    // PLATFORMS
    // ============================================
    await Platform.bulkCreate([
      { name: 'PC', slug: 'pc', manufacturer: 'Various', type: 'pc' },
      { name: 'PlayStation 5', slug: 'ps5', manufacturer: 'Sony', type: 'console', generation: 9, release_year: 2020 },
      { name: 'PlayStation 4', slug: 'ps4', manufacturer: 'Sony', type: 'console', generation: 8, release_year: 2013 },
      { name: 'PlayStation 3', slug: 'ps3', manufacturer: 'Sony', type: 'console', generation: 7, release_year: 2006, discontinuation_year: 2017 },
      { name: 'PlayStation 2', slug: 'ps2', manufacturer: 'Sony', type: 'console', generation: 6, release_year: 2000, discontinuation_year: 2013 },
      { name: 'PlayStation', slug: 'ps1', manufacturer: 'Sony', type: 'console', generation: 5, release_year: 1994, discontinuation_year: 2006 },
      { name: 'Xbox Series X|S', slug: 'xbox-series-x', manufacturer: 'Microsoft', type: 'console', generation: 9, release_year: 2020 },
      { name: 'Xbox One', slug: 'xbox-one', manufacturer: 'Microsoft', type: 'console', generation: 8, release_year: 2013 },
      { name: 'Xbox 360', slug: 'xbox-360', manufacturer: 'Microsoft', type: 'console', generation: 7, release_year: 2005, discontinuation_year: 2016 },
      { name: 'Nintendo Switch', slug: 'nintendo-switch', manufacturer: 'Nintendo', type: 'handheld', generation: 8, release_year: 2017 },
      { name: 'Nintendo Wii U', slug: 'wii-u', manufacturer: 'Nintendo', type: 'console', generation: 8, release_year: 2012, discontinuation_year: 2017 },
      { name: 'Nintendo 64', slug: 'n64', manufacturer: 'Nintendo', type: 'console', generation: 5, release_year: 1996, discontinuation_year: 2002 },
      { name: 'Sega Dreamcast', slug: 'dreamcast', manufacturer: 'Sega', type: 'console', generation: 6, release_year: 1998, discontinuation_year: 2001 },
      { name: 'Nintendo 3DS', slug: 'nintendo-3ds', manufacturer: 'Nintendo', type: 'handheld', generation: 8, release_year: 2011, discontinuation_year: 2020 },
      { name: 'iOS', slug: 'ios', manufacturer: 'Apple', type: 'mobile', release_year: 2007 },
      { name: 'Android', slug: 'android', manufacturer: 'Google', type: 'mobile', release_year: 2008 },
    ], { ignoreDuplicates: true });
    const allPlats = await Platform.findAll();
    const platBySlug = Object.fromEntries(allPlats.map(p => [p.getDataValue('slug'), p]));
    console.log(`✅ Platforms ready (${allPlats.length} total)`);

    // ============================================
    // GENRES
    // ============================================
    await Genre.bulkCreate([
      { name: 'Action', slug: 'action', description: 'Fast-paced gameplay with physical challenges' },
      { name: 'Adventure', slug: 'adventure', description: 'Exploration and story-driven gameplay' },
      { name: 'RPG', slug: 'rpg', description: 'Role-playing games with character progression' },
      { name: 'Strategy', slug: 'strategy', description: 'Games requiring tactical planning' },
      { name: 'Simulation', slug: 'simulation', description: 'Games that simulate real-world activities' },
      { name: 'Puzzle', slug: 'puzzle', description: 'Games focused on problem-solving' },
      { name: 'Horror', slug: 'horror', description: 'Games designed to frighten and create tension' },
      { name: 'Shooter', slug: 'shooter', description: 'Games centered around gun combat' },
      { name: 'Platformer', slug: 'platformer', description: 'Games focused on jumping between platforms' },
      { name: 'Racing', slug: 'racing', description: 'Vehicle racing games' },
      { name: 'Fighting', slug: 'fighting', description: 'One-on-one combat games' },
      { name: 'Survival', slug: 'survival', description: 'Resource management and survival gameplay' },
      { name: 'Stealth', slug: 'stealth', description: 'Games emphasizing avoiding detection' },
      { name: 'Roguelike', slug: 'roguelike', description: 'Procedurally generated with permadeath' },
      { name: 'Metroidvania', slug: 'metroidvania', description: 'Exploration-focused with ability-gated progression' },
      { name: 'Sandbox', slug: 'sandbox', description: 'Open-world games with creative freedom' },
      { name: 'Sports', slug: 'sports', description: 'Athletic and competitive games' },
      { name: 'MMORPG', slug: 'mmorpg', description: 'Massively multiplayer online role-playing games' },
      { name: 'Visual Novel', slug: 'visual-novel', description: 'Story-driven narrative experiences' },
      { name: 'Open World', slug: 'open-world', description: 'Games with large open-world environments' },
    ], { ignoreDuplicates: true });
    const allGenres = await Genre.findAll();
    const genreBySlug = Object.fromEntries(allGenres.map(g => [g.getDataValue('slug'), g]));
    console.log(`✅ Genres ready (${allGenres.length} total)`);

    // ============================================
    // GAMES (with slug-based FK lookups)
    // ============================================
    await Game.bulkCreate([
      {
        title: 'The Legend of Zelda: Breath of the Wild', slug: 'zelda-breath-of-the-wild',
        description: 'An open-world action-adventure game set in a vast fantasy world.',
        release_year: 2017, release_date: new Date('2017-03-03'),
        release_status: 'released', availability_status: 'available',
        age_rating: 'E10+', metacritic_score: 97,
        developer_id: devBySlug['nintendo-epd']?.id, publisher_id: pubBySlug['nintendo']?.id,
      },
      {
        title: 'Elden Ring', slug: 'elden-ring',
        description: 'A dark fantasy action RPG with vast world exploration.',
        release_year: 2022, release_date: new Date('2022-02-25'),
        release_status: 'released', availability_status: 'available',
        age_rating: 'M', metacritic_score: 96,
        developer_id: devBySlug['fromsoftware']?.id, publisher_id: pubBySlug['bandai-namco']?.id,
      },
      {
        title: "Baldur's Gate 3", slug: 'baldurs-gate-3',
        description: 'A story-rich RPG with turn-based combat in the DnD universe.',
        release_year: 2023, release_date: new Date('2023-08-03'),
        release_status: 'released', availability_status: 'available',
        age_rating: 'M', metacritic_score: 96,
        developer_id: devBySlug['larian-studios']?.id, publisher_id: pubBySlug['larian-studios']?.id,
      },
      {
        title: 'The Last of Us Part II', slug: 'the-last-of-us-part-2',
        description: 'An emotionally charged action-adventure game.',
        release_year: 2020, release_date: new Date('2020-06-19'),
        release_status: 'released', availability_status: 'available',
        age_rating: 'M', metacritic_score: 93,
        developer_id: devBySlug['naughty-dog']?.id, publisher_id: pubBySlug['sony-interactive']?.id,
      },
      {
        title: 'Hades', slug: 'hades',
        description: 'A rogue-like dungeon crawler.',
        release_year: 2020, release_date: new Date('2020-09-17'),
        release_status: 'released', availability_status: 'available',
        age_rating: 'T', metacritic_score: 93,
        developer_id: devBySlug['supergiant-games']?.id, publisher_id: pubBySlug['larian-studios']?.id,
      },
      {
        title: 'Resident Evil 4 Remake', slug: 'resident-evil-4-remake',
        description: 'A modern reimagining of the survival horror classic.',
        release_year: 2023, release_date: new Date('2023-03-24'),
        release_status: 'released', availability_status: 'available',
        age_rating: 'M', metacritic_score: 93,
        developer_id: devBySlug['capcom']?.id, publisher_id: pubBySlug['capcom']?.id,
      },
      {
        title: 'The Witcher 3: Wild Hunt', slug: 'the-witcher-3',
        description: 'An epic open-world RPG following Geralt of Rivia.',
        release_year: 2015, release_date: new Date('2015-05-19'),
        release_status: 'released', availability_status: 'available',
        age_rating: 'M', metacritic_score: 93,
        developer_id: devBySlug['cd-projekt-red']?.id, publisher_id: pubBySlug['cd-projekt']?.id,
      },
      {
        title: 'Half-Life 2', slug: 'half-life-2',
        description: 'A groundbreaking first-person shooter.',
        release_year: 2004, release_date: new Date('2004-11-16'),
        release_status: 'released', availability_status: 'available',
        age_rating: 'M', metacritic_score: 96,
        developer_id: devBySlug['valve']?.id, publisher_id: pubBySlug['valve']?.id,
      },
      {
        title: 'Hollow Knight', slug: 'hollow-knight',
        description: 'A beautifully crafted Metroidvania.',
        release_year: 2017, release_date: new Date('2017-02-24'),
        release_status: 'released', availability_status: 'available',
        age_rating: 'E10+', metacritic_score: 87,
        developer_id: devBySlug['team-cherry']?.id,
      },
      {
        title: "Marvel's Spider-Man 2", slug: 'spider-man-2-ps5',
        description: "Swing through Marvel's New York.",
        release_year: 2023, release_date: new Date('2023-10-20'),
        release_status: 'released', availability_status: 'available',
        age_rating: 'T', metacritic_score: 90,
        developer_id: devBySlug['insomniac-games']?.id, publisher_id: pubBySlug['sony-interactive']?.id,
      },
      {
        title: 'Starfield', slug: 'starfield',
        description: "Bethesda's expansive space exploration RPG.",
        release_year: 2023, release_date: new Date('2023-09-06'),
        release_status: 'released', availability_status: 'available',
        age_rating: 'M', metacritic_score: 83,
        developer_id: devBySlug['bethesda-game-studios']?.id, publisher_id: pubBySlug['bethesda-softworks']?.id,
      },
      {
        title: 'Command & Conquer: Red Alert', slug: 'command-conquer-red-alert',
        description: 'Classic real-time strategy game.',
        release_year: 1996, release_date: new Date('1996-10-31'),
        release_status: 'released', availability_status: 'abandonware',
        age_rating: 'T', metacritic_score: 88,
        discontinuation_date: new Date('2008-01-01'),
        official_abandonment_date: new Date('2010-01-01'),
        abandonment_reason: 'Developer closed, franchise dormant',
        developer_id: devBySlug['westwood-studios']?.id,
      },
      {
        title: 'Grim Fandango', slug: 'grim-fandango',
        description: 'An adventure game masterpiece set in the Land of the Dead.',
        release_year: 1998, release_date: new Date('1998-10-30'),
        release_status: 'released', availability_status: 'rereleased',
        was_rereleased: true, rerelease_date: new Date('2015-01-27'),
        age_rating: 'T', metacritic_score: 94,
        developer_id: devBySlug['lucasarts']?.id,
      },
      {
        title: 'Hollow Knight: Silksong', slug: 'hollow-knight-silksong',
        description: 'The highly anticipated sequel to Hollow Knight.',
        release_status: 'in_development', availability_status: 'available',
        developer_id: devBySlug['team-cherry']?.id,
      },
    ], { ignoreDuplicates: true });
    const allGames = await Game.findAll();
    const gameBySlug = Object.fromEntries(allGames.map(g => [g.getDataValue('slug'), g]));
    console.log(`✅ Games ready (${allGames.length} total)`);

    // ============================================
    // AWARDS
    // ============================================
    await Award.bulkCreate([
      { name: 'The Game Awards', slug: 'tga-goty', year: 2023, category: 'Game of the Year', relevance: 10 },
      { name: 'The Game Awards', slug: 'tga-goty', year: 2022, category: 'Game of the Year', relevance: 10 },
      { name: 'The Game Awards', slug: 'tga-goty', year: 2021, category: 'Game of the Year', relevance: 10 },
      { name: 'The Game Awards', slug: 'tga-goty', year: 2020, category: 'Game of the Year', relevance: 10 },
      { name: 'The Game Awards', slug: 'tga-goty', year: 2017, category: 'Game of the Year', relevance: 10 },
      { name: 'Golden Joystick Awards', slug: 'golden-joystick', year: 2023, category: 'Ultimate Game of the Year', relevance: 8 },
      { name: 'BAFTA Games Awards', slug: 'bafta-games', year: 2023, category: 'Best Game', relevance: 9 },
      { name: 'DICE Awards', slug: 'dice-awards', year: 2022, category: 'Game of the Year', relevance: 8 },
    ], { ignoreDuplicates: true });
    const allAwards = await Award.findAll();
    // Map by slug+year for unique lookup
    const awardByKey = Object.fromEntries(allAwards.map(a => [`${a.getDataValue('slug')}_${a.getDataValue('year')}_${a.getDataValue('category')}`, a]));
    console.log(`✅ Awards ready (${allAwards.length} total)`);

    // ============================================
    // PRESERVATION SOURCES
    // ============================================
    await PreservationSource.bulkCreate([
      { name: 'Internet Archive', slug: 'internet-archive', url: 'https://archive.org', source_type: 'archive', description: 'Digital library of Internet sites and cultural artifacts' },
      { name: 'Video Game History Foundation', slug: 'vghf', url: 'https://gamehistory.org', source_type: 'organization', description: 'Non-profit dedicated to preserving video game history' },
      { name: 'The National Videogame Museum', slug: 'national-videogame-museum', url: 'https://nvmusa.org', source_type: 'museum', description: 'Museum dedicated to the history of video games' },
      { name: 'GOG.com', slug: 'gog-com', url: 'https://www.gog.com', source_type: 'archive', description: 'DRM-free digital distribution preserving classic games' },
    ], { ignoreDuplicates: true });
    const allSources = await PreservationSource.findAll();
    const srcBySlug = Object.fromEntries(allSources.map(s => [s.getDataValue('slug'), s]));
    console.log(`✅ Preservation sources ready (${allSources.length} total)`);

    // Helper: get IDs safely
    const gid = (slug: string) => gameBySlug[slug]?.id;
    const pid = (slug: string) => platBySlug[slug]?.id;
    const genId = (slug: string) => genreBySlug[slug]?.id;

    // ============================================
    // GAMES_PLATFORMS (N:N) - slug-based lookups
    // ============================================
    const gamePlatformData = [
      { game_id: gid('zelda-breath-of-the-wild'), platform_id: pid('nintendo-switch'), exclusivity: 'permanent' as const },
      { game_id: gid('elden-ring'), platform_id: pid('pc'), exclusivity: 'none' as const },
      { game_id: gid('elden-ring'), platform_id: pid('ps5'), exclusivity: 'none' as const },
      { game_id: gid('elden-ring'), platform_id: pid('xbox-series-x'), exclusivity: 'none' as const },
      { game_id: gid('baldurs-gate-3'), platform_id: pid('pc'), exclusivity: 'none' as const },
      { game_id: gid('baldurs-gate-3'), platform_id: pid('ps5'), exclusivity: 'none' as const },
      { game_id: gid('the-last-of-us-part-2'), platform_id: pid('ps4'), exclusivity: 'temporary' as const },
      { game_id: gid('the-last-of-us-part-2'), platform_id: pid('ps5'), exclusivity: 'none' as const },
      { game_id: gid('hades'), platform_id: pid('pc'), exclusivity: 'none' as const },
      { game_id: gid('hades'), platform_id: pid('ps5'), exclusivity: 'none' as const },
      { game_id: gid('hades'), platform_id: pid('nintendo-switch'), exclusivity: 'none' as const },
      { game_id: gid('resident-evil-4-remake'), platform_id: pid('pc'), exclusivity: 'none' as const },
      { game_id: gid('resident-evil-4-remake'), platform_id: pid('ps5'), exclusivity: 'none' as const },
      { game_id: gid('the-witcher-3'), platform_id: pid('pc'), exclusivity: 'none' as const },
      { game_id: gid('the-witcher-3'), platform_id: pid('ps4'), exclusivity: 'none' as const },
      { game_id: gid('the-witcher-3'), platform_id: pid('xbox-one'), exclusivity: 'none' as const },
      { game_id: gid('the-witcher-3'), platform_id: pid('nintendo-switch'), exclusivity: 'none' as const },
      { game_id: gid('half-life-2'), platform_id: pid('pc'), exclusivity: 'none' as const },
      { game_id: gid('hollow-knight'), platform_id: pid('pc'), exclusivity: 'none' as const },
      { game_id: gid('hollow-knight'), platform_id: pid('ps4'), exclusivity: 'none' as const },
      { game_id: gid('hollow-knight'), platform_id: pid('nintendo-switch'), exclusivity: 'none' as const },
      { game_id: gid('spider-man-2-ps5'), platform_id: pid('ps5'), exclusivity: 'permanent' as const },
      { game_id: gid('starfield'), platform_id: pid('pc'), exclusivity: 'none' as const },
      { game_id: gid('starfield'), platform_id: pid('xbox-series-x'), exclusivity: 'none' as const },
    ].filter(r => r.game_id && r.platform_id);
    await GamePlatform.bulkCreate(gamePlatformData, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${gamePlatformData.length} game-platform links`);

    // ============================================
    // GAMES_GENRES (N:N)
    // ============================================
    const gameGenreData = [
      { game_id: gid('zelda-breath-of-the-wild'), genre_id: genId('action') },
      { game_id: gid('zelda-breath-of-the-wild'), genre_id: genId('adventure') },
      { game_id: gid('zelda-breath-of-the-wild'), genre_id: genId('open-world') },
      { game_id: gid('elden-ring'), genre_id: genId('action') },
      { game_id: gid('elden-ring'), genre_id: genId('rpg') },
      { game_id: gid('elden-ring'), genre_id: genId('open-world') },
      { game_id: gid('baldurs-gate-3'), genre_id: genId('rpg') },
      { game_id: gid('baldurs-gate-3'), genre_id: genId('strategy') },
      { game_id: gid('baldurs-gate-3'), genre_id: genId('adventure') },
      { game_id: gid('the-last-of-us-part-2'), genre_id: genId('action') },
      { game_id: gid('the-last-of-us-part-2'), genre_id: genId('adventure') },
      { game_id: gid('the-last-of-us-part-2'), genre_id: genId('survival') },
      { game_id: gid('the-last-of-us-part-2'), genre_id: genId('horror') },
      { game_id: gid('hades'), genre_id: genId('action') },
      { game_id: gid('hades'), genre_id: genId('roguelike') },
      { game_id: gid('resident-evil-4-remake'), genre_id: genId('action') },
      { game_id: gid('resident-evil-4-remake'), genre_id: genId('horror') },
      { game_id: gid('resident-evil-4-remake'), genre_id: genId('shooter') },
      { game_id: gid('the-witcher-3'), genre_id: genId('rpg') },
      { game_id: gid('the-witcher-3'), genre_id: genId('action') },
      { game_id: gid('the-witcher-3'), genre_id: genId('open-world') },
      { game_id: gid('the-witcher-3'), genre_id: genId('adventure') },
      { game_id: gid('hollow-knight'), genre_id: genId('metroidvania') },
      { game_id: gid('hollow-knight'), genre_id: genId('platformer') },
      { game_id: gid('hollow-knight'), genre_id: genId('action') },
    ].filter(r => r.game_id && r.genre_id);
    await GameGenre.bulkCreate(gameGenreData, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${gameGenreData.length} game-genre links`);

    // ============================================
    // GAMES_AWARDS (N:N)
    // ============================================
    const gameAwardData = [
      { game_id: gid('baldurs-gate-3'), award_id: awardByKey['tga-goty_2023_Game of the Year']?.id },
      { game_id: gid('elden-ring'), award_id: awardByKey['tga-goty_2022_Game of the Year']?.id },
      { game_id: gid('the-last-of-us-part-2'), award_id: awardByKey['tga-goty_2020_Game of the Year']?.id },
      { game_id: gid('zelda-breath-of-the-wild'), award_id: awardByKey['tga-goty_2017_Game of the Year']?.id },
      { game_id: gid('baldurs-gate-3'), award_id: awardByKey['golden-joystick_2023_Ultimate Game of the Year']?.id },
    ].filter(r => r.game_id && r.award_id);
    await GameAward.bulkCreate(gameAwardData, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${gameAwardData.length} game-award links`);

    // ============================================
    // GAMES_PRESERVATION
    // ============================================
    const gamePreservationData = [
      { game_id: gid('command-conquer-red-alert'), source_id: srcBySlug['internet-archive']?.id, available: true, notes: 'Free download available' },
      { game_id: gid('command-conquer-red-alert'), source_id: srcBySlug['vghf']?.id, available: true },
      { game_id: gid('grim-fandango'), source_id: srcBySlug['gog-com']?.id, available: true, specific_url: 'https://www.gog.com/game/grim_fandango_remastered', notes: 'Remastered version available' },
    ].filter(r => r.game_id && r.source_id);
    await GamePreservation.bulkCreate(gamePreservationData, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${gamePreservationData.length} game-preservation links`);

    // ============================================
    // USER_COLLECTION
    // ============================================
    const u1 = users.find(u => u.getDataValue('email') === 'john@example.com') || users[1];
    const u2 = users.find(u => u.getDataValue('email') === 'jane@example.com') || users[2];

    if (u1 && u2) {
      const collectionData = [
        { user_id: u1.id, game_id: gid('zelda-breath-of-the-wild'), platform_id: pid('nintendo-switch'), status: 'completed' as const, format: 'digital' as const, hours_played: 150, personal_notes: 'Amazing open world!' },
        { user_id: u1.id, game_id: gid('elden-ring'), platform_id: pid('pc'), status: 'playing' as const, format: 'digital' as const, hours_played: 85 },
        { user_id: u1.id, game_id: gid('the-witcher-3'), platform_id: pid('pc'), status: 'completed' as const, format: 'digital' as const, hours_played: 200, personal_notes: 'Best RPG ever' },
        { user_id: u2.id, game_id: gid('baldurs-gate-3'), platform_id: pid('pc'), status: 'playing' as const, format: 'digital' as const, hours_played: 60 },
        { user_id: u2.id, game_id: gid('the-last-of-us-part-2'), platform_id: pid('ps5'), status: 'completed' as const, format: 'physical' as const, hours_played: 30 },
        { user_id: u2.id, game_id: gid('hollow-knight'), platform_id: pid('nintendo-switch'), status: 'completed' as const, format: 'digital' as const, hours_played: 45 },
      ].filter(r => r.game_id && r.platform_id);
      await UserCollection.bulkCreate(collectionData, { ignoreDuplicates: true });
      console.log(`✅ Seeded ${collectionData.length} collection entries`);

      // WISHLIST
      const wishlistData = [
        { user_id: u1.id, game_id: gid('baldurs-gate-3'), priority: 'high' as const, notes: 'Waiting for sale' },
        { user_id: u1.id, game_id: gid('resident-evil-4-remake'), priority: 'medium' as const, max_price: 39.99 },
        { user_id: u2.id, game_id: gid('elden-ring'), priority: 'high' as const },
        { user_id: u2.id, game_id: gid('starfield'), priority: 'low' as const, max_price: 29.99 },
      ].filter(r => r.game_id);
      await Wishlist.bulkCreate(wishlistData, { ignoreDuplicates: true });
      console.log(`✅ Seeded ${wishlistData.length} wishlist entries`);

      // REVIEWS
      const reviewData = [
        { user_id: u1.id, game_id: gid('zelda-breath-of-the-wild'), rating: 9.5, review_text: 'Revolutionary open world design.', has_spoilers: false, hours_played: 150, recommends: true },
        { user_id: u1.id, game_id: gid('the-witcher-3'), rating: 9.8, review_text: 'The best RPG ever crafted.', has_spoilers: false, hours_played: 200, recommends: true },
        { user_id: u2.id, game_id: gid('baldurs-gate-3'), rating: 9.7, review_text: 'DnD brought to life.', has_spoilers: false, hours_played: 60, recommends: true },
        { user_id: u2.id, game_id: gid('the-last-of-us-part-2'), rating: 9.0, review_text: 'Bold narrative choices.', has_spoilers: true, hours_played: 30, recommends: true },
        { user_id: u2.id, game_id: gid('hollow-knight'), rating: 9.2, review_text: 'A masterpiece of Metroidvania.', has_spoilers: false, hours_played: 45, recommends: true },
      ].filter(r => r.game_id);
      await Review.bulkCreate(reviewData, { ignoreDuplicates: true });
      console.log(`✅ Seeded ${reviewData.length} reviews`);

      // NOTIFICATIONS
      await Notification.bulkCreate([
        { user_id: u1.id, notification_type: 'release' as const, game_id: gid('hollow-knight-silksong'), title: 'Upcoming Release', message: 'Silksong has no release date yet!' },
        { user_id: u1.id, notification_type: 'goty' as const, game_id: gid('baldurs-gate-3'), title: 'GOTY Winner!', message: "BG3 won GOTY at The Game Awards 2023!" },
        { user_id: u2.id, notification_type: 'milestone' as const, title: 'Collection Milestone', message: 'You have 3 games in your collection.' },
      ].filter(r => r.user_id));
      console.log('✅ Seeded 3 notifications');

      // RERELEASE REQUESTS
      const ccRAId = gid('command-conquer-red-alert');
      if (ccRAId) {
        const rereleaseRequests = await RereleaseRequest.bulkCreate([
          { game_id: ccRAId, total_votes: 2, status: 'active' },
        ], { ignoreDuplicates: true });
        const req = rereleaseRequests[0]?.id ? rereleaseRequests[0] : await RereleaseRequest.findOne({ where: { game_id: ccRAId } });
        if (req) {
          await RereleaseVote.bulkCreate([
            { request_id: req.id, user_id: u1.id, comment: 'Classic RTS that deserves a modern release!' },
            { request_id: req.id, user_id: u2.id, comment: 'Would love to play this again.' },
          ], { ignoreDuplicates: true });
          console.log('✅ Seeded rerelease requests and votes');
        }
      }

      // USER ACTIVITY
      await UserActivity.bulkCreate([
        { user_id: u1.id, activity_type: 'collection_add', entity_type: 'game', entity_id: gid('zelda-breath-of-the-wild'), description: 'Added Zelda: BotW to collection' },
        { user_id: u1.id, activity_type: 'review_create', entity_type: 'review', description: 'Wrote review for The Witcher 3' },
        { user_id: u2.id, activity_type: 'collection_add', entity_type: 'game', entity_id: gid('baldurs-gate-3'), description: "Added BG3 to collection" },
        { user_id: u2.id, activity_type: 'wishlist_add', entity_type: 'game', entity_id: gid('elden-ring'), description: 'Added Elden Ring to wishlist' },
      ]);
      console.log('✅ Seeded 4 user activities');

      // GAME STATUS HISTORY
      if (gid('command-conquer-red-alert') && gid('grim-fandango') && gid('hollow-knight-silksong')) {
        await GameStatusHistory.bulkCreate([
          { game_id: gid('command-conquer-red-alert')!, previous_availability_status: 'available' as const, new_availability_status: 'discontinued' as const, change_reason: 'Removed from stores' },
          { game_id: gid('command-conquer-red-alert')!, previous_availability_status: 'discontinued' as const, new_availability_status: 'abandonware' as const, change_reason: 'Westwood closed, IP dormant' },
          { game_id: gid('grim-fandango')!, previous_availability_status: 'abandonware' as const, new_availability_status: 'rereleased' as const, change_reason: 'Remastered by Double Fine' },
          { game_id: gid('hollow-knight-silksong')!, previous_release_status: 'in_development' as const, new_release_status: 'in_development' as const, change_reason: 'Development update' },
        ]);
        console.log('✅ Seeded 4 game status history entries');
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
