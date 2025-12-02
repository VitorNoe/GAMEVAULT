-- ============================================
-- GAMEVAULT DATABASE SCHEMA
-- Complete Platform for Game Management and Preservation
-- ============================================
-- Version: 1.0
-- Created: November 2025
-- Database: PostgreSQL / MySQL
-- ============================================

-- ============================================
-- ENUM TYPES (PostgreSQL syntax)
-- For MySQL, use ENUM in column definition
-- ============================================

-- User types
CREATE TYPE user_type AS ENUM ('regular', 'admin');

-- Release status for games
CREATE TYPE release_status AS ENUM (
    'released',           -- Complete and available game
    'early_access',       -- Playable but in development
    'open_beta',          -- Public testing phase
    'closed_beta',        -- Restricted testing phase
    'alpha',              -- Early development phase
    'coming_soon',        -- Confirmed date
    'in_development',     -- Announced without date
    'cancelled'           -- Abandoned project
);

-- Commercial availability status
CREATE TYPE availability_status AS ENUM (
    'available',          -- Can be legally purchased
    'out_of_catalog',     -- No longer sold, but license active
    'expired_license',    -- Copyright in limbo
    'abandonware',        -- Officially abandoned
    'public_domain',      -- Expired rights (rare)
    'discontinued',       -- Permanently removed
    'rereleased'          -- Was abandonware but returned
);

-- Platform types
CREATE TYPE platform_type AS ENUM (
    'console',
    'handheld',
    'pc',
    'mobile'
);

-- Company status
CREATE TYPE company_status AS ENUM (
    'active',
    'closed',
    'acquired'
);

-- Collection item status
CREATE TYPE collection_status AS ENUM (
    'playing',
    'completed',
    'paused',
    'abandoned',
    'not_started',
    'wishlist'
);

-- Game format
CREATE TYPE game_format AS ENUM (
    'physical',
    'digital'
);

-- Platform exclusivity
CREATE TYPE exclusivity_type AS ENUM (
    'permanent',
    'temporary',
    'none'
);

-- Wishlist priority
CREATE TYPE wishlist_priority AS ENUM (
    'high',
    'medium',
    'low'
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
    'release',
    'rerelease',
    'update',
    'goty',
    'review_like',
    'status_change',
    'milestone'
);

-- Re-release request status
CREATE TYPE rerelease_status AS ENUM (
    'active',
    'fulfilled',
    'archived'
);

-- Preservation source types
CREATE TYPE source_type AS ENUM (
    'museum',
    'archive',
    'organization'
);

-- Review like types
CREATE TYPE like_type AS ENUM (
    'like',
    'dislike'
);

-- ============================================
-- MAIN TABLES
-- ============================================

-- USERS TABLE
-- Stores user account information
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    user_type user_type NOT NULL DEFAULT 'regular',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    notification_push BOOLEAN NOT NULL DEFAULT TRUE,
    notification_email BOOLEAN NOT NULL DEFAULT TRUE,
    notification_in_app BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);

-- DEVELOPERS TABLE
-- Stores game development companies
CREATE TABLE developers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    logo_url VARCHAR(500),
    status company_status NOT NULL DEFAULT 'active',
    acquired_by INTEGER REFERENCES developers(id) ON DELETE SET NULL,
    foundation_year INTEGER,
    closure_year INTEGER,
    history TEXT,
    website VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_developers_slug ON developers(slug);
CREATE INDEX idx_developers_status ON developers(status);

-- PUBLISHERS TABLE
-- Stores game publishing companies
CREATE TABLE publishers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    logo_url VARCHAR(500),
    status company_status NOT NULL DEFAULT 'active',
    acquired_by INTEGER REFERENCES publishers(id) ON DELETE SET NULL,
    foundation_year INTEGER,
    closure_year INTEGER,
    website VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_publishers_slug ON publishers(slug);
CREATE INDEX idx_publishers_status ON publishers(status);

-- PLATFORMS TABLE
-- Stores gaming platforms (consoles, PC, mobile)
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    manufacturer VARCHAR(100),
    platform_type platform_type NOT NULL,
    generation INTEGER,
    release_year INTEGER,
    discontinuation_year INTEGER,
    logo_url VARCHAR(500),
    primary_color VARCHAR(7),  -- Hex color code
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_platforms_slug ON platforms(slug);
CREATE INDEX idx_platforms_type ON platforms(platform_type);
CREATE INDEX idx_platforms_generation ON platforms(generation);

-- GENRES TABLE
-- Stores game genres
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_genres_slug ON genres(slug);

-- GAMES TABLE
-- Main table storing all games
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    synopsis TEXT,
    release_year INTEGER,
    release_date DATE,
    cover_url VARCHAR(500),
    banner_url VARCHAR(500),
    trailer_url VARCHAR(500),
    developer_id INTEGER REFERENCES developers(id) ON DELETE SET NULL,
    publisher_id INTEGER REFERENCES publishers(id) ON DELETE SET NULL,
    release_status release_status NOT NULL DEFAULT 'released',
    availability_status availability_status NOT NULL DEFAULT 'available',
    discontinuation_date DATE,
    official_abandonment_date DATE,
    rerelease_date DATE,
    abandonment_reason TEXT,
    development_percentage INTEGER CHECK (development_percentage >= 0 AND development_percentage <= 100),
    age_rating VARCHAR(20),
    average_rating DECIMAL(3,2) CHECK (average_rating >= 0 AND average_rating <= 10),
    total_reviews INTEGER NOT NULL DEFAULT 0,
    is_early_access BOOLEAN NOT NULL DEFAULT FALSE,
    was_rereleased BOOLEAN NOT NULL DEFAULT FALSE,
    rawg_id INTEGER,
    metacritic_score INTEGER CHECK (metacritic_score >= 0 AND metacritic_score <= 100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_games_slug ON games(slug);
CREATE INDEX idx_games_title ON games(title);
CREATE INDEX idx_games_developer ON games(developer_id);
CREATE INDEX idx_games_publisher ON games(publisher_id);
CREATE INDEX idx_games_release_status ON games(release_status);
CREATE INDEX idx_games_availability_status ON games(availability_status);
CREATE INDEX idx_games_release_year ON games(release_year);
CREATE INDEX idx_games_average_rating ON games(average_rating);
CREATE INDEX idx_games_rawg_id ON games(rawg_id);

-- AWARDS TABLE
-- Stores game awards (GOTY, etc.)
CREATE TABLE awards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    year INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL,
    relevance INTEGER CHECK (relevance >= 1 AND relevance <= 10),
    website VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(slug, year, category)
);

CREATE INDEX idx_awards_slug ON awards(slug);
CREATE INDEX idx_awards_year ON awards(year);
CREATE INDEX idx_awards_category ON awards(category);

-- PRESERVATION_SOURCES TABLE
-- Stores legal preservation sources (Internet Archive, etc.)
CREATE TABLE preservation_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    url VARCHAR(500) NOT NULL,
    source_type source_type NOT NULL,
    logo_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_preservation_sources_slug ON preservation_sources(slug);

-- ============================================
-- USER-RELATED TABLES
-- ============================================

-- USER_COLLECTION TABLE
-- Stores user's game collection
CREATE TABLE user_collection (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    format game_format NOT NULL DEFAULT 'digital',
    status collection_status NOT NULL DEFAULT 'not_started',
    acquisition_date DATE,
    price_paid DECIMAL(10,2),
    hours_played INTEGER DEFAULT 0,
    personal_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id, platform_id)
);

CREATE INDEX idx_user_collection_user ON user_collection(user_id);
CREATE INDEX idx_user_collection_game ON user_collection(game_id);
CREATE INDEX idx_user_collection_platform ON user_collection(platform_id);
CREATE INDEX idx_user_collection_status ON user_collection(status);

-- WISHLIST TABLE
-- Stores user's wishlist
CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL,
    priority wishlist_priority NOT NULL DEFAULT 'medium',
    max_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

CREATE INDEX idx_wishlist_user ON wishlist(user_id);
CREATE INDEX idx_wishlist_game ON wishlist(game_id);
CREATE INDEX idx_wishlist_priority ON wishlist(priority);

-- REVIEWS TABLE
-- Stores user reviews for games
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL,
    rating DECIMAL(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 10),
    review_text TEXT,
    has_spoilers BOOLEAN NOT NULL DEFAULT FALSE,
    hours_played INTEGER,
    recommends BOOLEAN,
    likes_count INTEGER NOT NULL DEFAULT 0,
    dislikes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_game ON reviews(game_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_likes ON reviews(likes_count);

-- REVIEW_LIKES TABLE
-- Stores likes/dislikes on reviews
CREATE TABLE review_likes (
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    like_type like_type NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id, user_id)
);

CREATE INDEX idx_review_likes_review ON review_likes(review_id);
CREATE INDEX idx_review_likes_user ON review_likes(user_id);

-- NOTIFICATIONS TABLE
-- Stores user notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================
-- RE-RELEASE REQUEST TABLES
-- ============================================

-- RERELEASE_REQUESTS TABLE
-- Stores community requests for game re-releases
CREATE TABLE rerelease_requests (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
    total_votes INTEGER NOT NULL DEFAULT 0,
    status rerelease_status NOT NULL DEFAULT 'active',
    fulfilled_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rerelease_requests_game ON rerelease_requests(game_id);
CREATE INDEX idx_rerelease_requests_votes ON rerelease_requests(total_votes);
CREATE INDEX idx_rerelease_requests_status ON rerelease_requests(status);

-- RERELEASE_VOTES TABLE
-- Stores user votes for re-release requests
CREATE TABLE rerelease_votes (
    request_id INTEGER NOT NULL REFERENCES rerelease_requests(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT,
    vote_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (request_id, user_id)
);

CREATE INDEX idx_rerelease_votes_request ON rerelease_votes(request_id);
CREATE INDEX idx_rerelease_votes_user ON rerelease_votes(user_id);

-- ============================================
-- RELATIONSHIP TABLES (N:N)
-- ============================================

-- GAMES_PLATFORMS TABLE
-- Links games to platforms with specific release info
CREATE TABLE games_platforms (
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    platform_release_date DATE,
    exclusivity exclusivity_type NOT NULL DEFAULT 'none',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (game_id, platform_id)
);

CREATE INDEX idx_games_platforms_game ON games_platforms(game_id);
CREATE INDEX idx_games_platforms_platform ON games_platforms(platform_id);
CREATE INDEX idx_games_platforms_exclusivity ON games_platforms(exclusivity);

-- GAMES_GENRES TABLE
-- Links games to genres
CREATE TABLE games_genres (
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, genre_id)
);

CREATE INDEX idx_games_genres_game ON games_genres(game_id);
CREATE INDEX idx_games_genres_genre ON games_genres(genre_id);

-- GAMES_AWARDS TABLE
-- Links games to awards won
CREATE TABLE games_awards (
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    award_id INTEGER NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, award_id)
);

CREATE INDEX idx_games_awards_game ON games_awards(game_id);
CREATE INDEX idx_games_awards_award ON games_awards(award_id);

-- GAMES_PRESERVATION TABLE
-- Links games to preservation sources
CREATE TABLE games_preservation (
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    source_id INTEGER NOT NULL REFERENCES preservation_sources(id) ON DELETE CASCADE,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    specific_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (game_id, source_id)
);

CREATE INDEX idx_games_preservation_game ON games_preservation(game_id);
CREATE INDEX idx_games_preservation_source ON games_preservation(source_id);

-- ============================================
-- ACTIVITY TRACKING TABLE
-- ============================================

-- USER_ACTIVITY TABLE
-- Stores user activity history
CREATE TABLE user_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_activity_user ON user_activity(user_id);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_created ON user_activity(created_at);

-- ============================================
-- GAME STATUS HISTORY TABLE
-- ============================================

-- GAME_STATUS_HISTORY TABLE
-- Tracks changes in game release/availability status
CREATE TABLE game_status_history (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    previous_release_status release_status,
    new_release_status release_status,
    previous_availability_status availability_status,
    new_availability_status availability_status,
    change_reason TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_status_history_game ON game_status_history(game_id);
CREATE INDEX idx_game_status_history_changed ON game_status_history(changed_at);

-- ============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON developers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publishers_updated_at BEFORE UPDATE ON publishers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platforms_updated_at BEFORE UPDATE ON platforms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_collection_updated_at BEFORE UPDATE ON user_collection
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rerelease_requests_updated_at BEFORE UPDATE ON rerelease_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION TO RECALCULATE GAME AVERAGE RATING
-- ============================================

CREATE OR REPLACE FUNCTION recalculate_game_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_game_id INTEGER;
    review_count INTEGER;
    avg_rating DECIMAL(3,2);
BEGIN
    -- Determine which game_id to use based on operation type
    target_game_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.game_id ELSE NEW.game_id END;
    
    -- Get count and average in a single query
    SELECT COUNT(*), AVG(rating)
    INTO review_count, avg_rating
    FROM reviews
    WHERE game_id = target_game_id;
    
    UPDATE games
    SET average_rating = CASE WHEN review_count > 0 THEN avg_rating ELSE NULL END,
        total_reviews = review_count
    WHERE id = target_game_id;
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_recalculate_rating_insert AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION recalculate_game_rating();

CREATE TRIGGER trigger_recalculate_rating_update AFTER UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION recalculate_game_rating();

CREATE TRIGGER trigger_recalculate_rating_delete AFTER DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION recalculate_game_rating();

-- ============================================
-- FUNCTION TO UPDATE RERELEASE VOTE COUNT
-- ============================================

CREATE OR REPLACE FUNCTION update_rerelease_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE rerelease_requests
        SET total_votes = (SELECT COUNT(*) FROM rerelease_votes WHERE request_id = OLD.request_id)
        WHERE id = OLD.request_id;
        RETURN OLD;
    ELSE
        UPDATE rerelease_requests
        SET total_votes = (SELECT COUNT(*) FROM rerelease_votes WHERE request_id = NEW.request_id)
        WHERE id = NEW.request_id;
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_vote_count_insert AFTER INSERT ON rerelease_votes
    FOR EACH ROW EXECUTE FUNCTION update_rerelease_vote_count();

CREATE TRIGGER trigger_update_vote_count_delete AFTER DELETE ON rerelease_votes
    FOR EACH ROW EXECUTE FUNCTION update_rerelease_vote_count();

-- ============================================
-- FUNCTION TO UPDATE REVIEW LIKE COUNTS
-- ============================================

CREATE OR REPLACE FUNCTION update_review_like_counts()
RETURNS TRIGGER AS $$
DECLARE
    target_review_id INTEGER;
    new_likes_count INTEGER;
    new_dislikes_count INTEGER;
BEGIN
    -- Determine which review_id to use based on operation type
    target_review_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.review_id ELSE NEW.review_id END;
    
    -- Get both counts in a single query using conditional aggregation
    SELECT 
        COUNT(*) FILTER (WHERE like_type = 'like'),
        COUNT(*) FILTER (WHERE like_type = 'dislike')
    INTO new_likes_count, new_dislikes_count
    FROM review_likes
    WHERE review_id = target_review_id;
    
    UPDATE reviews
    SET likes_count = COALESCE(new_likes_count, 0),
        dislikes_count = COALESCE(new_dislikes_count, 0)
    WHERE id = target_review_id;
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_like_counts_insert AFTER INSERT ON review_likes
    FOR EACH ROW EXECUTE FUNCTION update_review_like_counts();

CREATE TRIGGER trigger_update_like_counts_update AFTER UPDATE ON review_likes
    FOR EACH ROW EXECUTE FUNCTION update_review_like_counts();

CREATE TRIGGER trigger_update_like_counts_delete AFTER DELETE ON review_likes
    FOR EACH ROW EXECUTE FUNCTION update_review_like_counts();

-- ============================================
-- END OF SCHEMA
-- ============================================
