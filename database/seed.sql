-- ============================================
-- GAMEVAULT DATABASE SEED DATA (ENHANCED)
-- Comprehensive game data covering PC and multiple console generations
-- ============================================

BEGIN;

-- Create companies table if not exists (compatibility)
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    logo_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    country VARCHAR(100),
    founded_year INTEGER,
    closure_year INTEGER,
    acquired_by INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    website VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USERS
-- ============================================
INSERT INTO users (name, email, password_hash, user_type, created_at, updated_at) VALUES
('Admin User', 'admin@gamevault.com', '$2b$10$hFQCk5STnxro6F.UqrybsOBbj6v5k3O3i0L3MqN1zI7FIwofH3u/W', 'admin', NOW(), NOW()),
('John Doe', 'john@example.com', '$2b$10$hFQCk5STnxro6F.UqrybsOBbj6v5k3O3i0L3MqN1zI7FIwofH3u/W', 'regular', NOW(), NOW()),
('Jane Smith', 'jane@example.com', '$2b$10$hFQCk5STnxro6F.UqrybsOBbj6v5k3O3i0L3MqN1zI7FIwofH3u/W', 'regular', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- PLATFORMS (All generations)
-- ============================================
INSERT INTO platforms (name, slug, manufacturer, platform_type, generation, release_year, discontinuation_year, created_at, updated_at) VALUES
-- PC
('PC', 'pc', 'Various', 'pc', NULL, NULL, NULL, NOW(), NOW()),

-- PlayStation
('PlayStation', 'ps1', 'Sony', 'console', 5, 1994, 2006, NOW(), NOW()),
('PlayStation 2', 'ps2', 'Sony', 'console', 6, 2000, 2013, NOW(), NOW()),
('PlayStation 3', 'ps3', 'Sony', 'console', 7, 2006, 2017, NOW(), NOW()),
('PlayStation 4', 'ps4', 'Sony', 'console', 8, 2013, NULL, NOW(), NOW()),
('PlayStation 5', 'ps5', 'Sony', 'console', 9, 2020, NULL, NOW(), NOW()),
('PlayStation Portable', 'psp', 'Sony', 'handheld', 7, 2004, 2014, NOW(), NOW()),
('PlayStation Vita', 'ps-vita', 'Sony', 'handheld', 8, 2011, 2019, NOW(), NOW()),

-- Xbox
('Xbox', 'xbox', 'Microsoft', 'console', 6, 2001, 2009, NOW(), NOW()),
('Xbox 360', 'xbox-360', 'Microsoft', 'console', 7, 2005, 2016, NOW(), NOW()),
('Xbox One', 'xbox-one', 'Microsoft', 'console', 8, 2013, NULL, NOW(), NOW()),
('Xbox Series X', 'xbox-series-x', 'Microsoft', 'console', 9, 2020, NULL, NOW(), NOW()),
('Xbox Series S', 'xbox-series-s', 'Microsoft', 'console', 9, 2020, NULL, NOW(), NOW()),

-- Nintendo
('Nintendo 64', 'n64', 'Nintendo', 'console', 5, 1996, 2002, NOW(), NOW()),
('Nintendo GameCube', 'gamecube', 'Nintendo', 'console', 6, 2001, 2007, NOW(), NOW()),
('Nintendo Wii', 'wii', 'Nintendo', 'console', 7, 2006, 2013, NOW(), NOW()),
('Nintendo Wii U', 'wii-u', 'Nintendo', 'console', 8, 2012, 2017, NOW(), NOW()),
('Nintendo Switch', 'nintendo-switch', 'Nintendo', 'handheld', 8, 2017, NULL, NOW(), NOW()),
('Game Boy Advance', 'gba', 'Nintendo', 'handheld', 6, 2001, 2008, NOW(), NOW()),
('Nintendo DS', 'nintendo-ds', 'Nintendo', 'handheld', 7, 2004, 2013, NOW(), NOW()),
('Nintendo 3DS', 'nintendo-3ds', 'Nintendo', 'handheld', 8, 2011, 2020, NOW(), NOW()),

-- Sega
('Sega Genesis', 'genesis', 'Sega', 'console', 4, 1988, 1997, NOW(), NOW()),
('Sega Dreamcast', 'dreamcast', 'Sega', 'console', 6, 1998, 2001, NOW(), NOW()),

-- Mobile
('iOS', 'ios', 'Apple', 'mobile', NULL, 2007, NULL, NOW(), NOW()),
('Android', 'android', 'Google', 'mobile', NULL, 2008, NULL, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- COMPANIES (Developers/Publishers)
-- ============================================
INSERT INTO companies (name, slug, country, founded_year, status, website, created_at, updated_at) VALUES
-- Major Publishers/Developers
('Nintendo', 'nintendo', 'Japan', 1889, 'active', 'https://www.nintendo.com', NOW(), NOW()),
('Sony Interactive Entertainment', 'sony-interactive', 'Japan', 1993, 'active', 'https://www.sie.com', NOW(), NOW()),
('Microsoft Studios', 'microsoft-studios', 'USA', 2002, 'active', 'https://www.xbox.com/games', NOW(), NOW()),
('CD Projekt Red', 'cd-projekt-red', 'Poland', 2002, 'active', 'https://www.cdprojektred.com', NOW(), NOW()),
('Rockstar Games', 'rockstar-games', 'USA', 1998, 'active', 'https://www.rockstargames.com', NOW(), NOW()),
('Valve', 'valve', 'USA', 1996, 'active', 'https://www.valvesoftware.com', NOW(), NOW()),
('FromSoftware', 'fromsoftware', 'Japan', 1986, 'active', 'https://www.fromsoftware.jp', NOW(), NOW()),
('Bethesda Game Studios', 'bethesda-game-studios', 'USA', 2001, 'active', 'https://bethesdagamestudios.com', NOW(), NOW()),
('Naughty Dog', 'naughty-dog', 'USA', 1984, 'active', 'https://www.naughtydog.com', NOW(), NOW()),
('Insomniac Games', 'insomniac-games', 'USA', 1994, 'active', 'https://insomniac.games', NOW(), NOW()),
('Square Enix', 'square-enix', 'Japan', 2003, 'active', 'https://www.square-enix.com', NOW(), NOW()),
('Capcom', 'capcom', 'Japan', 1979, 'active', 'https://www.capcom.com', NOW(), NOW()),
('Konami', 'konami', 'Japan', 1969, 'active', 'https://www.konami.com', NOW(), NOW()),
('Sega', 'sega', 'Japan', 1960, 'active', 'https://www.sega.com', NOW(), NOW()),
('Bungie', 'bungie', 'USA', 1991, 'active', 'https://www.bungie.net', NOW(), NOW()),
('Epic Games', 'epic-games', 'USA', 1991, 'active', 'https://www.epicgames.com', NOW(), NOW()),
('BioWare', 'bioware', 'Canada', 1995, 'active', 'https://www.bioware.com', NOW(), NOW()),
('Ubisoft', 'ubisoft', 'France', 1986, 'active', 'https://www.ubisoft.com', NOW(), NOW()),
('Activision', 'activision', 'USA', 1979, 'active', 'https://www.activision.com', NOW(), NOW()),
('Blizzard Entertainment', 'blizzard', 'USA', 1991, 'active', 'https://www.blizzard.com', NOW(), NOW()),
('id Software', 'id-software', 'USA', 1991, 'active', 'https://www.idsoftware.com', NOW(), NOW()),
('Team Cherry', 'team-cherry', 'Australia', 2014, 'active', 'https://teamcherry.com.au', NOW(), NOW()),
('Supergiant Games', 'supergiant-games', 'USA', 2009, 'active', 'https://www.supergiantgames.com', NOW(), NOW()),
('Larian Studios', 'larian-studios', 'Belgium', 1996, 'active', 'https://larian.com', NOW(), NOW()),
('Mojang Studios', 'mojang', 'Sweden', 2009, 'active', 'https://www.minecraft.net', NOW(), NOW()),
('Remedy Entertainment', 'remedy', 'Finland', 1995, 'active', 'https://www.remedygames.com', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- GENRES
-- ============================================
INSERT INTO genres (name, slug, description, created_at) VALUES
('Action', 'action', 'Fast-paced gameplay with physical challenges', NOW()),
('Adventure', 'adventure', 'Exploration and story-driven gameplay', NOW()),
('RPG', 'rpg', 'Role-playing games with character progression', NOW()),
('Strategy', 'strategy', 'Games requiring tactical planning', NOW()),
('Simulation', 'simulation', 'Games that simulate real-world activities', NOW()),
('Sports', 'sports', 'Athletic and competitive games', NOW()),
('Puzzle', 'puzzle', 'Games focused on problem-solving', NOW()),
('Horror', 'horror', 'Games designed to frighten and create tension', NOW()),
('Shooter', 'shooter', 'Games centered around gun combat', NOW()),
('Fighting', 'fighting', 'One-on-one combat games', NOW()),
('Platformer', 'platformer', 'Games focused on jumping between platforms', NOW()),
('Racing', 'racing', 'Vehicle racing games', NOW()),
('Survival', 'survival', 'Resource management and survival gameplay', NOW()),
('Stealth', 'stealth', 'Games emphasizing avoiding detection', NOW()),
('MMORPG', 'mmorpg', 'Massively multiplayer online role-playing games', NOW()),
('MOBA', 'moba', 'Multiplayer online battle arena games', NOW()),
('Sandbox', 'sandbox', 'Open-world games with creative freedom', NOW()),
('Roguelike', 'roguelike', 'Procedurally generated with permadeath', NOW()),
('Metroidvania', 'metroidvania', 'Exploration-focused with ability-gated progression', NOW()),
('Visual Novel', 'visual-novel', 'Story-driven narrative experiences', NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- AWARDS
-- ============================================
INSERT INTO awards (name, slug, year, category, relevance, created_at) VALUES
-- Game of the Year Awards
('The Game Awards', 'tga-goty', 2023, 'Game of the Year', 10, NOW()),
('The Game Awards', 'tga-goty', 2022, 'Game of the Year', 10, NOW()),
('The Game Awards', 'tga-goty', 2021, 'Game of the Year', 10, NOW()),
('The Game Awards', 'tga-goty', 2020, 'Game of the Year', 10, NOW()),
('The Game Awards', 'tga-goty', 2019, 'Game of the Year', 10, NOW()),
('The Game Awards', 'tga-goty', 2018, 'Game of the Year', 10, NOW()),
('The Game Awards', 'tga-goty', 2017, 'Game of the Year', 10, NOW()),
('The Game Awards', 'tga-goty', 2016, 'Game of the Year', 10, NOW()),
('The Game Awards', 'tga-goty', 2015, 'Game of the Year', 10, NOW()),
('The Game Awards', 'tga-goty', 2014, 'Game of the Year', 10, NOW())
ON CONFLICT (slug, year, category) DO NOTHING;

-- ============================================
-- GAMES - COMPREHENSIVE DATABASE
-- ============================================
INSERT INTO games (
  title, slug, description, synopsis, release_year, release_date,
  cover_url, release_status, availability_status, age_rating, metacritic_score, created_at, updated_at
) VALUES

-- ============================================
-- RECENT AAA GAMES (2020-2024)
-- ============================================
(
  'The Last of Us Part II',
  'the-last-of-us-part-2',
  'An emotionally charged action-adventure game with visceral combat and a mature narrative.',
  'Five years after their dangerous journey across the post-pandemic United States, Ellie and Joel have settled down.',
  2020,
  '2020-06-19',
  'https://upload.wikimedia.org/wikipedia/en/4/4f/TLOU_P2_Box_Art_2.png',
  'released',
  'available',
  'M',
  93,
  NOW(),
  NOW()
),
(
  'Ghost of Tsushima',
  'ghost-of-tsushima',
  'An open-world samurai adventure set in feudal Japan during the Mongol invasion.',
  'In the late 13th century, the Mongol empire has laid waste to entire nations. As one of the last samurai standing, you must rise.',
  2020,
  '2020-07-17',
  'https://upload.wikimedia.org/wikipedia/en/b/b6/Ghost_of_Tsushima.jpg',
  'released',
  'available',
  'M',
  83,
  NOW(),
  NOW()
),
(
  'Hades',
  'hades',
  'A rogue-like dungeon crawler where you battle out of Hell as the son of Hades.',
  'Defy the god of the dead as you hack and slash your way out of the Underworld in this rogue-like dungeon crawler.',
  2020,
  '2020-09-17',
  'https://upload.wikimedia.org/wikipedia/en/c/cc/Hades_cover_art.jpg',
  'released',
  'available',
  'T',
  93,
  NOW(),
  NOW()
),
(
  'Baldur''s Gate 3',
  'baldurs-gate-3',
  'A story-rich RPG with turn-based combat set in the Dungeons & Dragons universe.',
  'Gather your party and return to the Forgotten Realms in a tale of fellowship, betrayal, sacrifice, and survival.',
  2023,
  '2023-08-03',
  'https://upload.wikimedia.org/wikipedia/en/6/68/Baldur%27s_Gate_3_cover_art.jpg',
  'released',
  'available',
  'M',
  96,
  NOW(),
  NOW()
),
(
  'Elden Ring',
  'elden-ring',
  'A dark fantasy action RPG with vast world exploration and challenging combat.',
  'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord.',
  2022,
  '2022-02-25',
  'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg',
  'released',
  'available',
  'M',
  96,
  NOW(),
  NOW()
),
(
  'God of War Ragnarök',
  'god-of-war-ragnarok',
  'Kratos and Atreus embark on a mythic journey for answers and allies before Ragnarök arrives.',
  'Join Kratos and Atreus in the emotional and visceral conclusion to the Norse Saga.',
  2022,
  '2022-11-09',
  'https://upload.wikimedia.org/wikipedia/en/e/ee/God_of_War_Ragnar%C3%B6k_cover.jpg',
  'released',
  'available',
  'M',
  94,
  NOW(),
  NOW()
),
(
  'Horizon Forbidden West',
  'horizon-forbidden-west',
  'Explore a lush post-apocalyptic world filled with robotic creatures and ancient mysteries.',
  'Join Aloy as she braves the Forbidden West – a majestic but dangerous frontier.',
  2022,
  '2022-02-18',
  'https://upload.wikimedia.org/wikipedia/en/1/12/Horizon_Forbidden_West_cover_art.jpg',
  'released',
  'available',
  'T',
  88,
  NOW(),
  NOW()
),
(
  'Spider-Man 2',
  'spider-man-2-ps5',
  'Swing through Marvel''s New York as both Peter Parker and Miles Morales.',
  'The incredible power of the symbiote forces Peter and Miles to face the ultimate test of strength.',
  2023,
  '2023-10-20',
  'https://upload.wikimedia.org/wikipedia/en/c/cf/Spider-Man_2_%282023_video_game%29_cover_art.png',
  'released',
  'available',
  'T',
  90,
  NOW(),
  NOW()
),
(
  'Starfield',
  'starfield',
  'Bethesda''s first new universe in 25 years - an expansive space exploration RPG.',
  'In this next generation role-playing game, create your character and explore with freedom.',
  2023,
  '2023-09-06',
  'https://upload.wikimedia.org/wikipedia/en/4/4c/Starfield_cover_art.jpg',
  'released',
  'available',
  'M',
  83,
  NOW(),
  NOW()
),
(
  'Resident Evil 4 Remake',
  'resident-evil-4-remake',
  'A modern reimagining of the survival horror classic with updated graphics and gameplay.',
  'Survival is just the beginning. Six years have passed since the bioterror incident in Raccoon City.',
  2023,
  '2023-03-24',
  'https://upload.wikimedia.org/wikipedia/en/4/40/Resident_Evil_4_remake.jpg',
  'released',
  'available',
  'M',
  93,
  NOW(),
  NOW()
),
(
  'The Legend of Zelda: Breath of the Wild',
  'zelda-breath-of-the-wild',
  'An open-world action-adventure game set in a vast fantasy world.',
  'Step into a world of discovery, exploration, and adventure in The Legend of Zelda: Breath of the Wild.',
  2017,
  '2017-03-03',
  'https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg',
  'released',
  'available',
  'E10+',
  97,
  NOW(),
  NOW()
),
(
  'The Legend of Zelda: Tears of the Kingdom',
  'zelda-tears-of-the-kingdom',
  'An epic adventure across the land and skies of Hyrule awaits.',
  'Explore the vast land—and skies—of Hyrule in this sequel to Breath of the Wild.',
  2023,
  '2023-05-12',
  'https://upload.wikimedia.org/wikipedia/en/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg',
  'released',
  'available',
  'E10+',
  96,
  NOW(),
  NOW()
),

-- ============================================
-- NINTENDO CLASSICS & MODERN
-- ============================================
(
  'Super Mario Odyssey',
  'super-mario-odyssey',
  'Join Mario on a massive, globe-trotting 3D adventure.',
  'Mario embarks on a new journey through unknown worlds to save Princess Peach from Bowser.',
  2017,
  '2017-10-27',
  'https://upload.wikimedia.org/wikipedia/en/8/8d/Super_Mario_Odyssey.jpg',
  'released',
  'available',
  'E10+',
  97,
  NOW(),
  NOW()
),
(
  'Super Mario 64',
  'super-mario-64',
  'The revolutionary 3D platformer that defined a generation.',
  'Mario leaps into 3D for the first time in this revolutionary platformer for the Nintendo 64.',
  1996,
  '1996-06-23',
  'https://upload.wikimedia.org/wikipedia/en/6/6a/Super_Mario_64_box_cover.jpg',
  'released',
  'available',
  'E',
  94,
  NOW(),
  NOW()
),
(
  'The Legend of Zelda: Ocarina of Time',
  'zelda-ocarina-of-time',
  'An epic action-adventure that set the standard for 3D games.',
  'Link travels through time to stop Ganondorf in this legendary adventure.',
  1998,
  '1998-11-21',
  'https://upload.wikimedia.org/wikipedia/en/5/57/The_Legend_of_Zelda_Ocarina_of_Time.jpg',
  'released',
  'available',
  'E',
  99,
  NOW(),
  NOW()
),
(
  'Metroid Prime',
  'metroid-prime',
  'A first-person adventure that brought Samus into 3D.',
  'Samus explores the planet Tallon IV in this atmospheric first-person adventure.',
  2002,
  '2002-11-17',
  'https://upload.wikimedia.org/wikipedia/en/4/44/Metroid_Prime_boxart.jpg',
  'released',
  'available',
  'T',
  97,
  NOW(),
  NOW()
),
(
  'Super Smash Bros. Ultimate',
  'super-smash-bros-ultimate',
  'The ultimate crossover fighting game featuring Nintendo characters and beyond.',
  'Legendary game worlds and fighters collide in the ultimate showdown.',
  2018,
  '2018-12-07',
  'https://upload.wikimedia.org/wikipedia/en/5/50/Super_Smash_Bros._Ultimate.jpg',
  'released',
  'available',
  'E10+',
  93,
  NOW(),
  NOW()
),
(
  'Animal Crossing: New Horizons',
  'animal-crossing-new-horizons',
  'Escape to a deserted island and create your own paradise.',
  'Build your community from scratch on a deserted island brimming with possibility.',
  2020,
  '2020-03-20',
  'https://upload.wikimedia.org/wikipedia/en/1/1f/Animal_Crossing_New_Horizons.jpg',
  'released',
  'available',
  'E',
  90,
  NOW(),
  NOW()
),
(
  'Metroid Dread',
  'metroid-dread',
  'Join Samus as she escapes a deadly alien world plagued by a mechanical menace.',
  'Samus faces her most terrifying mission yet in this 2D Metroid adventure.',
  2021,
  '2021-10-08',
  'https://upload.wikimedia.org/wikipedia/en/6/6e/Metroid_Dread_Cover_Art.jpg',
  'released',
  'available',
  'T',
  88,
  NOW(),
  NOW()
),

-- ============================================
-- PLAYSTATION CLASSICS (PS1-PS3)
-- ============================================
(
  'Final Fantasy VII',
  'final-fantasy-7',
  'A legendary RPG that defined a generation with its epic story and memorable characters.',
  'Cloud Strife joins an eco-terrorist group to stop the megacorporation Shinra from draining the planet.',
  1997,
  '1997-01-31',
  'https://upload.wikimedia.org/wikipedia/en/c/c2/Final_Fantasy_VII_Box_Art.jpg',
  'released',
  'available',
  'T',
  92,
  NOW(),
  NOW()
),
(
  'Metal Gear Solid',
  'metal-gear-solid',
  'A stealth action game that revolutionized storytelling in video games.',
  'Solid Snake infiltrates a nuclear weapons facility to neutralize a terrorist threat.',
  1998,
  '1998-09-03',
  'https://upload.wikimedia.org/wikipedia/en/4/4d/Metal_Gear_Solid_cover_art.png',
  'released',
  'available',
  'M',
  94,
  NOW(),
  NOW()
),
(
  'Crash Bandicoot',
  'crash-bandicoot',
  'A classic platformer featuring the iconic marsupial on his quest to stop Dr. Neo Cortex.',
  'Spin, jump, and crash through obstacles as Crash Bandicoot.',
  1996,
  '1996-09-09',
  'https://upload.wikimedia.org/wikipedia/en/1/11/Crash_Bandicoot_Cover.png',
  'released',
  'available',
  'E',
  80,
  NOW(),
  NOW()
),
(
  'Spyro the Dragon',
  'spyro-the-dragon',
  'A colorful platformer starring a young purple dragon.',
  'Help Spyro free his fellow dragons from crystal prisons.',
  1998,
  '1998-09-09',
  'https://upload.wikimedia.org/wikipedia/en/0/08/Spyro_the_Dragon_Cover.png',
  'released',
  'available',
  'E',
  85,
  NOW(),
  NOW()
),
(
  'Gran Turismo',
  'gran-turismo',
  'The real driving simulator that set the standard for racing games.',
  'Experience the most realistic racing simulation on PlayStation.',
  1997,
  '1997-12-23',
  'https://upload.wikimedia.org/wikipedia/en/b/be/Gran_Turismo_1_box_art.jpg',
  'released',
  'available',
  'E',
  96,
  NOW(),
  NOW()
),
(
  'God of War',
  'god-of-war-2005',
  'Kratos embarks on a brutal quest for vengeance against the Greek gods.',
  'As Kratos, seek revenge against Ares, the God of War.',
  2005,
  '2005-03-22',
  'https://upload.wikimedia.org/wikipedia/en/4/42/GodofWarBox.jpg',
  'released',
  'available',
  'M',
  94,
  NOW(),
  NOW()
),
(
  'Shadow of the Colossus',
  'shadow-of-the-colossus',
  'An atmospheric adventure about defeating massive colossi to save a loved one.',
  'Journey through forbidden lands to resurrect your lost love by defeating 16 colossi.',
  2005,
  '2005-10-18',
  'https://upload.wikimedia.org/wikipedia/en/5/58/Shadow_of_the_Colossus.jpg',
  'released',
  'available',
  'T',
  91,
  NOW(),
  NOW()
),
(
  'Uncharted 2: Among Thieves',
  'uncharted-2',
  'Nathan Drake''s greatest adventure across the globe in search of ancient treasures.',
  'Drake returns to find the legendary Cintamani Stone and the lost city of Shambhala.',
  2009,
  '2009-10-13',
  'https://upload.wikimedia.org/wikipedia/en/b/ba/Uncharted_2_box_artwork.jpg',
  'released',
  'available',
  'T',
  96,
  NOW(),
  NOW()
),
(
  'The Last of Us',
  'the-last-of-us',
  'A post-apocalyptic survival game following Joel and Ellie across a ravaged America.',
  'Joel must escort Ellie across the United States in a harrowing journey through a pandemic-ravaged civilization.',
  2013,
  '2013-06-14',
  'https://upload.wikimedia.org/wikipedia/en/4/46/Video_Game_Cover_-_The_Last_of_Us.jpg',
  'released',
  'available',
  'M',
  95,
  NOW(),
  NOW()
),

-- ============================================
-- XBOX CLASSICS
-- ============================================
(
  'Halo: Combat Evolved',
  'halo-combat-evolved',
  'The legendary FPS that defined Xbox and revolutionized console shooters.',
  'Master Chief arrives on the mysterious ringworld Halo to battle the Covenant.',
  2001,
  '2001-11-15',
  'https://upload.wikimedia.org/wikipedia/en/8/80/Halo_-_Combat_Evolved_%28XBox_version_-_box_art%29.jpg',
  'released',
  'available',
  'M',
  97,
  NOW(),
  NOW()
),
(
  'Halo 2',
  'halo-2',
  'Master Chief returns to defend Earth from the Covenant invasion.',
  'The Covenant has arrived at Earth, and the fight for survival continues.',
  2004,
  '2004-11-09',
  'https://upload.wikimedia.org/wikipedia/en/6/68/Halo_2_cover.jpg',
  'released',
  'available',
  'M',
  95,
  NOW(),
  NOW()
),
(
  'Halo 3',
  'halo-3',
  'The epic conclusion to the original Halo trilogy.',
  'Finish the fight as Master Chief in the final chapter of the original trilogy.',
  2007,
  '2007-09-25',
  'https://upload.wikimedia.org/wikipedia/en/b/bb/Halo3-cover.jpg',
  'released',
  'available',
  'M',
  94,
  NOW(),
  NOW()
),
(
  'Gears of War',
  'gears-of-war',
  'A brutal third-person shooter on the war-torn planet Sera.',
  'Marcus Fenix leads Delta Squad against the Locust Horde.',
  2006,
  '2006-11-07',
  'https://upload.wikimedia.org/wikipedia/en/9/93/Gears_of_War_cover.png',
  'released',
  'available',
  'M',
  94,
  NOW(),
  NOW()
),
(
  'Fable',
  'fable',
  'An action RPG where your choices shape your destiny and appearance.',
  'Become a hero or villain in this groundbreaking RPG.',
  2004,
  '2004-09-14',
  'https://upload.wikimedia.org/wikipedia/en/0/0e/Fable_cover.jpg',
  'released',
  'available',
  'M',
  85,
  NOW(),
  NOW()
),

-- ============================================
-- PC CLASSICS
-- ============================================
(
  'Half-Life',
  'half-life',
  'A revolutionary FPS that changed storytelling in gaming forever.',
  'Dr. Gordon Freeman fights for survival after a scientific experiment goes wrong.',
  1998,
  '1998-11-19',
  'https://upload.wikimedia.org/wikipedia/en/f/fa/Half-Life_Cover_Art.jpg',
  'released',
  'available',
  'M',
  96,
  NOW(),
  NOW()
),
(
  'Half-Life 2',
  'half-life-2',
  'The groundbreaking sequel featuring revolutionary physics and storytelling.',
  'Gordon Freeman awakens in a dystopian City 17 to lead a resistance against the Combine.',
  2004,
  '2004-11-16',
  'https://upload.wikimedia.org/wikipedia/en/2/25/Half-Life_2_cover.jpg',
  'released',
  'available',
  'M',
  96,
  NOW(),
  NOW()
),
(
  'Portal',
  'portal',
  'A mind-bending puzzle game with innovative portal mechanics.',
  'Use the portal gun to solve puzzles and escape the Aperture Science facility.',
  2007,
  '2007-10-10',
  'https://upload.wikimedia.org/wikipedia/en/6/63/Portal1_favicon.png',
  'released',
  'available',
  'T',
  90,
  NOW(),
  NOW()
),
(
  'Portal 2',
  'portal-2',
  'The sequel expands on the original with co-op and more complex puzzles.',
  'Return to Aperture Science for more mind-bending puzzles with a hilarious AI companion.',
  2011,
  '2011-04-19',
  'https://upload.wikimedia.org/wikipedia/en/f/f9/Portal2cover.jpg',
  'released',
  'available',
  'E10+',
  95,
  NOW(),
  NOW()
),
(
  'The Witcher 3: Wild Hunt',
  'the-witcher-3-wild-hunt',
  'An open-world action RPG set in a visually stunning fantasy universe.',
  'Geralt of Rivia hunts for his adopted daughter in a war-torn continent.',
  2015,
  '2015-05-19',
  'https://upload.wikimedia.org/wikipedia/en/0/0c/Witcher_3_cover_art.jpg',
  'released',
  'available',
  'M',
  93,
  NOW(),
  NOW()
),
(
  'Dark Souls',
  'dark-souls',
  'A brutally challenging action RPG that spawned a genre.',
  'Explore the cursed land of Lordran in this punishing but rewarding adventure.',
  2011,
  '2011-09-22',
  'https://upload.wikimedia.org/wikipedia/en/8/8d/Dark_Souls_Cover_Art.jpg',
  'released',
  'available',
  'M',
  89,
  NOW(),
  NOW()
),
(
  'Dark Souls III',
  'dark-souls-3',
  'The epic conclusion to the Dark Souls trilogy.',
  'As fires fade and the world falls into ruin, journey through a universe of colossal enemies.',
  2016,
  '2016-04-12',
  'https://upload.wikimedia.org/wikipedia/en/b/bb/Dark_souls_3_cover_art.jpg',
  'released',
  'available',
  'M',
  89,
  NOW(),
  NOW()
),
(
  'Minecraft',
  'minecraft',
  'A sandbox game where you can build and explore infinite worlds.',
  'Mine, craft, and build in this blocky sandbox phenomenon.',
  2011,
  '2011-11-18',
  'https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png',
  'released',
  'available',
  'E10+',
  93,
  NOW(),
  NOW()
),
(
  'Terraria',
  'terraria',
  'A 2D sandbox adventure game with exploration, crafting, and combat.',
  'Dig, fight, explore, and build in this action-packed adventure game.',
  2011,
  '2011-05-16',
  'https://upload.wikimedia.org/wikipedia/en/b/be/Terraria_cover.jpg',
  'released',
  'available',
  'T',
  83,
  NOW(),
  NOW()
),
(
  'Doom',
  'doom-1993',
  'The game that defined the FPS genre.',
  'Fight demons from Hell in this legendary first-person shooter.',
  1993,
  '1993-12-10',
  'https://upload.wikimedia.org/wikipedia/en/5/57/Doom_cover_art.jpg',
  'released',
  'abandonware',
  'M',
  NULL,
  NOW(),
  NOW()
),
(
  'Doom Eternal',
  'doom-eternal',
  'The ultimate combination of speed and power with the next leap in first-person combat.',
  'Rip and tear through demons as the DOOM Slayer.',
  2020,
  '2020-03-20',
  'https://upload.wikimedia.org/wikipedia/en/9/9a/Doom_Eternal.jpg',
  'released',
  'available',
  'M',
  88,
  NOW(),
  NOW()
),
(
  'Cyberpunk 2077',
  'cyberpunk-2077',
  'An open-world RPG set in the megalopolis of Night City.',
  'Become a cyberpunk mercenary in Night City, a megalopolis obsessed with power and body modification.',
  2020,
  '2020-12-10',
  'https://upload.wikimedia.org/wikipedia/en/9/9f/Cyberpunk_2077_box_art.jpg',
  'released',
  'available',
  'M',
  86,
  NOW(),
  NOW()
),
(
  'Disco Elysium',
  'disco-elysium',
  'A groundbreaking RPG with deep narrative choices and no combat.',
  'Become a detective with a unique skill system in this revolutionary RPG.',
  2019,
  '2019-10-15',
  'https://upload.wikimedia.org/wikipedia/en/e/e1/Disco_Elysium_cover_art.jpg',
  'released',
  'available',
  'M',
  91,
  NOW(),
  NOW()
),

-- ============================================
-- INDIE GEMS
-- ============================================
(
  'Hollow Knight',
  'hollow-knight',
  'A beautifully crafted metroidvania set in a haunting insect kingdom.',
  'Descend into Hallownest: a beautiful, ruined kingdom of insects.',
  2017,
  '2017-02-24',
  'https://upload.wikimedia.org/wikipedia/en/0/04/Hollow_Knight_first_cover_art.webp',
  'released',
  'available',
  'E10+',
  90,
  NOW(),
  NOW()
),
(
  'Celeste',
  'celeste',
  'A challenging platformer about climbing a mountain with a touching story.',
  'Help Madeline survive her inner demons on her journey to the top of Celeste Mountain.',
  2018,
  '2018-01-25',
  'https://upload.wikimedia.org/wikipedia/commons/0/0f/Celeste_box_art_full.png',
  'released',
  'available',
  'E10+',
  94,
  NOW(),
  NOW()
),
(
  'Stardew Valley',
  'stardew-valley',
  'A farming simulation RPG where you build your farm and connect with the community.',
  'Build the farm of your dreams, raise animals, and become part of the local community.',
  2016,
  '2016-02-26',
  'https://upload.wikimedia.org/wikipedia/en/f/fd/Stardew_Valley_Cover_Art.png',
  'released',
  'available',
  'E10+',
  89,
  NOW(),
  NOW()
),
(
  'Undertale',
  'undertale',
  'A unique RPG where you can choose to spare your enemies.',
  'The RPG game where you don''t have to destroy anyone.',
  2015,
  '2015-09-15',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Undertale_cover.png/220px-Undertale_cover.png',
  'released',
  'available',
  'E10+',
  92,
  NOW(),
  NOW()
),
(
  'Dead Cells',
  'dead-cells',
  'A rogue-lite metroidvania with intense action and permadeath.',
  'Explore a sprawling, ever-changing castle in this challenging action-platformer.',
  2018,
  '2018-08-07',
  'https://upload.wikimedia.org/wikipedia/en/d/db/Dead_Cells_cover_art.png',
  'released',
  'available',
  'T',
  89,
  NOW(),
  NOW()
),

-- ============================================
-- RETRO/ABANDONWARE CLASSICS
-- ============================================
(
  'Chrono Trigger',
  'chrono-trigger',
  'A legendary RPG where a group of time travelers journey across eras.',
  'Travel through time to prevent the apocalypse in this JRPG masterpiece.',
  1995,
  '1995-03-11',
  'https://upload.wikimedia.org/wikipedia/en/a/a7/Chrono_Trigger.jpg',
  'released',
  'available',
  'E',
  92,
  NOW(),
  NOW()
),
(
  'Super Metroid',
  'super-metroid',
  'One of the greatest 2D action-adventure games ever made.',
  'Samus returns to Planet Zebes to rescue the last Metroid from Space Pirates.',
  1994,
  '1994-03-19',
  'https://upload.wikimedia.org/wikipedia/en/e/e4/Super_Metroid_Box.jpg',
  'released',
  'available',
  'E',
  96,
  NOW(),
  NOW()
),
(
  'Castlevania: Symphony of the Night',
  'castlevania-sotn',
  'A gothic action-adventure that defined the metroidvania genre.',
  'Alucard explores Dracula''s castle in this genre-defining masterpiece.',
  1997,
  '1997-03-20',
  'https://upload.wikimedia.org/wikipedia/en/8/87/Castlevania_-_Symphony_of_the_Night_%28NA%29.jpg',
  'released',
  'available',
  'T',
  93,
  NOW(),
  NOW()
),
(
  'Deus Ex',
  'deus-ex',
  'A cyberpunk RPG-shooter that offers unprecedented player choice.',
  'Play as JC Denton in a conspiracy-driven cyberpunk thriller.',
  2000,
  '2000-06-23',
  'https://upload.wikimedia.org/wikipedia/en/3/3e/Deus_Ex_cover.png',
  'released',
  'abandonware',
  'M',
  90,
  NOW(),
  NOW()
),
(
  'System Shock 2',
  'system-shock-2',
  'A sci-fi horror RPG that influenced a generation of games.',
  'Survive aboard a starship invaded by a hostile alien presence.',
  1999,
  '1999-08-11',
  'https://upload.wikimedia.org/wikipedia/en/e/e3/System_Shock_2_Game_Cover.jpg',
  'released',
  'abandonware',
  'M',
  92,
  NOW(),
  NOW()
),

-- ============================================
-- UPCOMING / COMING SOON
-- ============================================
(
  'GTA VI',
  'gta-6',
  'The next installment in the legendary Grand Theft Auto series.',
  'Return to Vice City in the most immersive Grand Theft Auto yet.',
  2025,
  '2025-10-01',
  'https://i.imgur.com/placeholder-gta6.jpg',
  'coming_soon',
  'available',
  'M',
  NULL,
  NOW(),
  NOW()
),
(
  'Hollow Knight: Silksong',
  'silksong',
  'The highly anticipated sequel to Hollow Knight.',
  'Play as Hornet and descend into a new haunted kingdom.',
  2025,
  NULL,
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.jpg',
  'in_development',
  'available',
  'E10+',
  NULL,
  NOW(),
  NOW()
),
(
  'Metroid Prime 4: Beyond',
  'metroid-prime-4',
  'The next chapter in the Metroid Prime series.',
  'Samus returns in a brand-new first-person adventure.',
  2025,
  '2025-12-31',
  'https://images.igdb.com/igdb/image/upload/t_cover_big/co1ycw.jpg',
  'in_development',
  'available',
  'T',
  NULL,
  NOW(),
  NOW()
),
(
  'The Elder Scrolls VI',
  'elder-scrolls-6',
  'The next epic chapter in the Elder Scrolls saga.',
  'Explore a new realm in Tamriel in this anticipated RPG.',
  2026,
  NULL,
  'https://i.imgur.com/placeholder-tes6.jpg',
  'in_development',
  'available',
  'M',
  NULL,
  NOW(),
  NOW()
),

-- ============================================
-- MORE MODERN GAMES
-- ============================================
(
  'Red Dead Redemption 2',
  'red-dead-redemption-2',
  'An epic tale of life in America at the dawn of the modern age.',
  'Arthur Morgan and the Van der Linde gang are on the run in this western epic.',
  2018,
  '2018-10-26',
  'https://upload.wikimedia.org/wikipedia/en/4/44/Red_Dead_Redemption_II.jpg',
  'released',
  'available',
  'M',
  97,
  NOW(),
  NOW()
),
(
  'Grand Theft Auto V',
  'gta-5',
  'An action-adventure game in the fictional city of Los Santos.',
  'Experience the lives of three criminals in the sprawling city of Los Santos.',
  2013,
  '2013-09-17',
  'https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png',
  'released',
  'available',
  'M',
  97,
  NOW(),
  NOW()
),
(
  'Sekiro: Shadows Die Twice',
  'sekiro',
  'A challenging action-adventure set in Sengoku-era Japan.',
  'Take revenge, restore your honor, and kill ingeniously in this FromSoftware masterpiece.',
  2019,
  '2019-03-22',
  'https://upload.wikimedia.org/wikipedia/en/6/6e/Sekiro_art.jpg',
  'released',
  'available',
  'M',
  90,
  NOW(),
  NOW()
),
(
  'Bloodborne',
  'bloodborne',
  'A dark gothic action RPG exclusive to PlayStation.',
  'Hunt beasts in the cursed city of Yharnam in this atmospheric horror game.',
  2015,
  '2015-03-24',
  'https://upload.wikimedia.org/wikipedia/en/3/3d/Bloodborne_Cover_Wallpaper.jpg',
  'released',
  'available',
  'M',
  92,
  NOW(),
  NOW()
),
(
  'BioShock',
  'bioshock',
  'A shooter set in the underwater dystopia of Rapture.',
  'Discover the failed utopia beneath the sea where idealism has turned to madness.',
  2007,
  '2007-08-21',
  'https://upload.wikimedia.org/wikipedia/en/6/6d/BioShock_cover.jpg',
  'released',
  'available',
  'M',
  96,
  NOW(),
  NOW()
),
(
  'Mass Effect 2',
  'mass-effect-2',
  'Commander Shepard assembles a team for a suicide mission.',
  'Recruit and lead an elite team to save the galaxy from the Collectors.',
  2010,
  '2010-01-26',
  'https://upload.wikimedia.org/wikipedia/en/0/05/MassEffect2_cover.PNG',
  'released',
  'available',
  'M',
  94,
  NOW(),
  NOW()
),
(
  'Skyrim',
  'skyrim',
  'An open-world fantasy RPG in the land of Skyrim.',
  'As Dragonborn, use your power to stand against the dragons.',
  2011,
  '2011-11-11',
  'https://upload.wikimedia.org/wikipedia/en/1/15/The_Elder_Scrolls_V_Skyrim_cover.png',
  'released',
  'available',
  'M',
  94,
  NOW(),
  NOW()
),
(
  'Fallout 4',
  'fallout-4',
  'A post-apocalyptic RPG in the ruins of Boston.',
  'Search for your son in the nuclear wasteland of the Commonwealth.',
  2015,
  '2015-11-10',
  'https://upload.wikimedia.org/wikipedia/en/4/44/Fallout_4_cover_art.jpg',
  'released',
  'available',
  'M',
  87,
  NOW(),
  NOW()
),
(
  'Control',
  'control',
  'A supernatural third-person action-adventure.',
  'Become the Director of the Federal Bureau of Control and harness supernatural abilities.',
  2019,
  '2019-08-27',
  'https://upload.wikimedia.org/wikipedia/en/4/45/Control_cover_art.jpg',
  'released',
  'available',
  'M',
  85,
  NOW(),
  NOW()
),
(
  'It Takes Two',
  'it-takes-two',
  'A co-op adventure game built purely for two players.',
  'Embark on a genre-bending platform adventure built purely for co-op.',
  2021,
  '2021-03-26',
  'https://upload.wikimedia.org/wikipedia/en/b/bb/It_Takes_Two_cover_art.jpg',
  'released',
  'available',
  'T',
  88,
  NOW(),
  NOW()
),
(
  'Outer Wilds',
  'outer-wilds',
  'An open-world mystery about a solar system trapped in a time loop.',
  'Explore a strange, evolving solar system in this award-winning adventure.',
  2019,
  '2019-05-28',
  'https://upload.wikimedia.org/wikipedia/en/e/e6/Outer_Wilds_cover_art.png',
  'released',
  'available',
  'E10+',
  85,
  NOW(),
  NOW()
),
(
  'Persona 5 Royal',
  'persona-5-royal',
  'A stylish JRPG about high school students who are Phantom Thieves.',
  'Don the mask and join the Phantom Thieves of Hearts.',
  2020,
  '2020-03-31',
  'https://upload.wikimedia.org/wikipedia/en/5/5f/Persona_5_Royal_cover_art.jpg',
  'released',
  'available',
  'M',
  95,
  NOW(),
  NOW()
),
(
  'Monster Hunter: World',
  'monster-hunter-world',
  'Hunt massive monsters in diverse ecosystems.',
  'Take on epic hunts and track down ferocious monsters.',
  2018,
  '2018-01-26',
  'https://upload.wikimedia.org/wikipedia/en/1/1b/Monster_Hunter_World_cover_art.jpg',
  'released',
  'available',
  'T',
  90,
  NOW(),
  NOW()
),
(
  'Destiny 2',
  'destiny-2',
  'A sci-fi looter shooter with MMO elements.',
  'Become a Guardian and defend the last safe city on Earth.',
  2017,
  '2017-09-06',
  'https://upload.wikimedia.org/wikipedia/en/0/05/Destiny_2_%28artwork%29.jpg',
  'released',
  'available',
  'T',
  85,
  NOW(),
  NOW()
),
(
  'Overwatch 2',
  'overwatch-2',
  'A team-based hero shooter with diverse characters.',
  'Rally your team in this evolved hero shooter.',
  2022,
  '2022-10-04',
  'https://upload.wikimedia.org/wikipedia/en/7/79/Overwatch_2_Steam_App_Capsule.jpg',
  'released',
  'available',
  'T',
  79,
  NOW(),
  NOW()
),
(
  'Apex Legends',
  'apex-legends',
  'A free-to-play battle royale with unique legends.',
  'Master an ever-growing roster of legendary characters in this competitive shooter.',
  2019,
  '2019-02-04',
  'https://upload.wikimedia.org/wikipedia/en/d/db/Apex_legends_cover.jpg',
  'released',
  'available',
  'T',
  88,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- LINK GAMES TO AWARDS (GOTY Winners)
-- ============================================
INSERT INTO games_awards (game_id, award_id)
SELECT g.id, a.id FROM games g, awards a
WHERE g.slug = 'baldurs-gate-3' AND a.slug = 'tga-goty' AND a.year = 2023
ON CONFLICT DO NOTHING;

INSERT INTO games_awards (game_id, award_id)
SELECT g.id, a.id FROM games g, awards a
WHERE g.slug = 'elden-ring' AND a.slug = 'tga-goty' AND a.year = 2022
ON CONFLICT DO NOTHING;

INSERT INTO games_awards (game_id, award_id)
SELECT g.id, a.id FROM games g, awards a
WHERE g.slug = 'it-takes-two' AND a.slug = 'tga-goty' AND a.year = 2021
ON CONFLICT DO NOTHING;

INSERT INTO games_awards (game_id, award_id)
SELECT g.id, a.id FROM games g, awards a
WHERE g.slug = 'the-last-of-us-part-2' AND a.slug = 'tga-goty' AND a.year = 2020
ON CONFLICT DO NOTHING;

INSERT INTO games_awards (game_id, award_id)
SELECT g.id, a.id FROM games g, awards a
WHERE g.slug = 'sekiro' AND a.slug = 'tga-goty' AND a.year = 2019
ON CONFLICT DO NOTHING;

INSERT INTO games_awards (game_id, award_id)
SELECT g.id, a.id FROM games g, awards a
WHERE g.slug = 'god-of-war-2005' AND a.slug = 'tga-goty' AND a.year = 2018
ON CONFLICT DO NOTHING;

INSERT INTO games_awards (game_id, award_id)
SELECT g.id, a.id FROM games g, awards a
WHERE g.slug = 'zelda-breath-of-the-wild' AND a.slug = 'tga-goty' AND a.year = 2017
ON CONFLICT DO NOTHING;

INSERT INTO games_awards (game_id, award_id)
SELECT g.id, a.id FROM games g, awards a
WHERE g.slug = 'overwatch-2' AND a.slug = 'tga-goty' AND a.year = 2016
ON CONFLICT DO NOTHING;

INSERT INTO games_awards (game_id, award_id)
SELECT g.id, a.id FROM games g, awards a
WHERE g.slug = 'the-witcher-3-wild-hunt' AND a.slug = 'tga-goty' AND a.year = 2015
ON CONFLICT DO NOTHING;

-- ============================================
-- LINK GAMES TO PLATFORMS (Sample - add more as needed)
-- ============================================
-- Baldur's Gate 3
INSERT INTO games_platforms (game_id, platform_id, platform_release_date)
SELECT g.id, p.id, '2023-08-03'
FROM games g, platforms p
WHERE g.slug = 'baldurs-gate-3' AND p.slug IN ('pc', 'ps5', 'xbox-series-x')
ON CONFLICT DO NOTHING;

-- Elden Ring
INSERT INTO games_platforms (game_id, platform_id, platform_release_date)
SELECT g.id, p.id, '2022-02-25'
FROM games g, platforms p
WHERE g.slug = 'elden-ring' AND p.slug IN ('pc', 'ps4', 'ps5', 'xbox-one', 'xbox-series-x')
ON CONFLICT DO NOTHING;

-- The Last of Us Part II
INSERT INTO games_platforms (game_id, platform_id, platform_release_date)
SELECT g.id, p.id, '2020-06-19'
FROM games g, platforms p
WHERE g.slug = 'the-last-of-us-part-2' AND p.slug IN ('ps4', 'ps5')
ON CONFLICT DO NOTHING;

-- Zelda: Breath of the Wild
INSERT INTO games_platforms (game_id, platform_id, platform_release_date)
SELECT g.id, p.id, '2017-03-03'
FROM games g, platforms p
WHERE g.slug = 'zelda-breath-of-the-wild' AND p.slug IN ('nintendo-switch', 'wii-u')
ON CONFLICT DO NOTHING;

-- Halo: Combat Evolved
INSERT INTO games_platforms (game_id, platform_id, platform_release_date)
SELECT g.id, p.id, '2001-11-15'
FROM games g, platforms p
WHERE g.slug = 'halo-combat-evolved' AND p.slug IN ('xbox', 'pc')
ON CONFLICT DO NOTHING;

-- Super Mario 64
INSERT INTO games_platforms (game_id, platform_id, platform_release_date)
SELECT g.id, p.id, '1996-06-23'
FROM games g, platforms p
WHERE g.slug = 'super-mario-64' AND p.slug = 'n64'
ON CONFLICT DO NOTHING;

-- Final Fantasy VII
INSERT INTO games_platforms (game_id, platform_id, platform_release_date)
SELECT g.id, p.id, '1997-01-31'
FROM games g, platforms p
WHERE g.slug = 'final-fantasy-7' AND p.slug IN ('ps1', 'pc')
ON CONFLICT DO NOTHING;

-- Minecraft (Multi-platform)
INSERT INTO games_platforms (game_id, platform_id, platform_release_date)
SELECT g.id, p.id, '2011-11-18'
FROM games g, platforms p
WHERE g.slug = 'minecraft' AND p.slug IN ('pc', 'ps4', 'ps5', 'xbox-one', 'xbox-series-x', 'nintendo-switch', 'ios', 'android')
ON CONFLICT DO NOTHING;

COMMIT;
