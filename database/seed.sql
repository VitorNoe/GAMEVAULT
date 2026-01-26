-- ============================================
-- GAMEVAULT DATABASE SEED DATA
-- Sample data for development and testing
-- ============================================

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

-- Insert sample users
INSERT INTO users (name, email, password_hash, user_type, created_at, updated_at) VALUES
('Admin User', 'admin@gamevault.com', '$2b$10$hFQCk5STnxro6F.UqrybsOBbj6v5k3O3i0L3MqN1zI7FIwofH3u/W', 'admin', NOW(), NOW()),
('John Doe', 'john@example.com', '$2b$10$hFQCk5STnxro6F.UqrybsOBbj6v5k3O3i0L3MqN1zI7FIwofH3u/W', 'regular', NOW(), NOW()),
('Jane Smith', 'jane@example.com', '$2b$10$hFQCk5STnxro6F.UqrybsOBbj6v5k3O3i0L3MqN1zI7FIwofH3u/W', 'regular', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert sample platforms
INSERT INTO platforms (name, slug, manufacturer, platform_type, generation, release_year, created_at, updated_at) VALUES
('PlayStation 5', 'ps5', 'Sony', 'console', 9, 2020, NOW(), NOW()),
('Xbox Series X', 'xbox-series-x', 'Microsoft', 'console', 9, 2020, NOW(), NOW()),
('Nintendo Switch', 'nintendo-switch', 'Nintendo', 'handheld', 8, 2017, NOW(), NOW()),
('PC', 'pc', 'Various', 'pc', NULL, NULL, NOW(), NOW()),
('PlayStation 4', 'ps4', 'Sony', 'console', 8, 2013, NOW(), NOW()),
('Xbox One', 'xbox-one', 'Microsoft', 'console', 8, 2013, NOW(), NOW()),
('Nintendo 3DS', 'nintendo-3ds', 'Nintendo', 'handheld', 8, 2011, NOW(), NOW()),
('iOS', 'ios', 'Apple', 'mobile', NULL, 2007, NOW(), NOW()),
('Android', 'android', 'Google', 'mobile', NULL, 2008, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insert sample companies (developers/publishers)
INSERT INTO companies (name, slug, country, founded_year, status, website, created_at, updated_at) VALUES
('Nintendo', 'nintendo', 'Japan', 1889, 'active', 'https://www.nintendo.com', NOW(), NOW()),
('Sony Interactive Entertainment', 'sony-interactive', 'Japan', 1993, 'active', 'https://www.sie.com', NOW(), NOW()),
('Microsoft Studios', 'microsoft-studios', 'USA', 2002, 'active', 'https://www.xbox.com/games', NOW(), NOW()),
('CD Projekt Red', 'cd-projekt-red', 'Poland', 2002, 'active', 'https://www.cdprojektred.com', NOW(), NOW()),
('Rockstar Games', 'rockstar-games', 'USA', 1998, 'active', 'https://www.rockstargames.com', NOW(), NOW()),
('Valve', 'valve', 'USA', 1996, 'active', 'https://www.valvesoftware.com', NOW(), NOW()),
('FromSoftware', 'fromsoftware', 'Japan', 1986, 'active', 'https://www.fromsoftware.jp', NOW(), NOW()),
('Bethesda Game Studios', 'bethesda-game-studios', 'USA', 2001, 'active', 'https://bethesdagamestudios.com', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insert sample games
INSERT INTO games (
  title, slug, description, synopsis, release_year, release_date,
  cover_url, release_status, availability_status, age_rating, created_at, updated_at
) VALUES
(
  'The Legend of Zelda: Breath of the Wild',
  'zelda-breath-of-the-wild',
  'An open-world action-adventure game set in a fantasy world where players explore, fight enemies, and solve puzzles.',
  'Step into a world of discovery, exploration, and adventure in The Legend of Zelda: Breath of the Wild.',
  2017,
  '2017-03-03',
  'https://example.com/zelda-botw.jpg',
  'released',
  'available',
  'E10+',
  NOW(),
  NOW()
),
(
  'Cyberpunk 2077',
  'cyberpunk-2077',
  'An open-world, action-adventure RPG set in the megalopolis of Night City.',
  'In Night City, a mercenary known as V navigates a dark future where violence and cyberware are commonplace.',
  2020,
  '2020-12-10',
  'https://example.com/cyberpunk2077.jpg',
  'released',
  'available',
  'M',
  NOW(),
  NOW()
),
(
  'Elden Ring',
  'elden-ring',
  'A dark fantasy action RPG with vast world exploration and challenging combat.',
  'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring.',
  2022,
  '2022-02-25',
  'https://example.com/eldenring.jpg',
  'released',
  'available',
  'M',
  NOW(),
  NOW()
),
(
  'The Last of Us Part II',
  'the-last-of-us-part-2',
  'An action-adventure game set in a post-apocalyptic world.',
  'Five years after their dangerous journey across the post-pandemic United States, Ellie and Joel have settled down.',
  2020,
  '2020-06-19',
  'https://example.com/tlou2.jpg',
  'released',
  'available',
  'M',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Insert genres
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
('Fighting', 'fighting', 'One-on-one combat games', NOW())
ON CONFLICT (slug) DO NOTHING;

COMMIT;
