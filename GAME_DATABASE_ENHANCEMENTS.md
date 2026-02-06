# GAMEVAULT - Game Database Enhancements

## Overview
This document describes the comprehensive enhancements made to the GAMEVAULT game database, including expanded game catalog, platform support, and new features.

## What's New

### 1. Comprehensive Game Database (70+ Games)
The database now includes over 70 games across multiple platforms and eras:

#### PC Games
- **Classic**: Doom (1993), Half-Life, Half-Life 2, Portal, Portal 2, Deus Ex, System Shock 2
- **Modern**: Cyberpunk 2077, The Witcher 3, Elden Ring, Baldur's Gate 3, Minecraft, Terraria
- **Indie**: Hollow Knight, Celeste, Stardew Valley, Undertale, Dead Cells, Hades

#### PlayStation Games
- **PS1**: Final Fantasy VII, Metal Gear Solid, Crash Bandicoot, Spyro, Gran Turismo
- **PS2**: God of War, Shadow of the Colossus
- **PS3**: Uncharted 2, The Last of Us
- **PS4/PS5**: The Last of Us Part II, Ghost of Tsushima, God of War Ragnarök, Horizon Forbidden West, Spider-Man 2, Bloodborne

#### Xbox Games
- **Original Xbox**: Halo: Combat Evolved, Fable
- **Xbox 360**: Halo 2, Halo 3, Gears of War
- **Xbox One/Series X**: Starfield, and many cross-platform titles

#### Nintendo Games
- **N64**: Super Mario 64, The Legend of Zelda: Ocarina of Time
- **GameCube**: Metroid Prime
- **Switch**: The Legend of Zelda: Breath of the Wild, Tears of the Kingdom, Super Mario Odyssey, Metroid Dread, Animal Crossing: New Horizons, Super Smash Bros. Ultimate

### 2. Platform Support (27 Platforms)
Complete platform coverage including:
- PC
- PlayStation: PS1, PS2, PS3, PS4, PS5, PSP, PS Vita
- Xbox: Original, 360, One, Series X, Series S
- Nintendo: N64, GameCube, Wii, Wii U, Switch, GBA, DS, 3DS
- Sega: Genesis, Dreamcast
- Mobile: iOS, Android

### 3. Game of the Year (GOTY) Tags
Games are tagged with GOTY awards from The Game Awards (2014-2023):
- 2023: Baldur's Gate 3
- 2022: Elden Ring
- 2021: It Takes Two
- 2020: The Last of Us Part II
- 2019: Sekiro: Shadows Die Twice
- 2018: God of War
- 2017: The Legend of Zelda: Breath of the Wild
- 2015: The Witcher 3: Wild Hunt
- And more...

### 4. Abandonware Classification
Games that are no longer officially sold are properly tagged:
- Doom (1993) - Classic FPS, not sold officially
- Deus Ex (2000) - Cyberpunk RPG
- System Shock 2 (1999) - Sci-fi horror RPG

### 5. Game Status Classification
Games are categorized by release status:
- **Released**: Available and complete
- **Coming Soon**: Confirmed release date
- **In Development**: Announced without date

Example upcoming games:
- GTA VI (2025)
- Hollow Knight: Silksong (TBA)
- Metroid Prime 4: Beyond (2025)
- The Elder Scrolls VI (TBA)

### 6. Complete Game Information
Each game includes:
- Title and slug (unique identifier)
- Description and synopsis
- Release year and date
- Cover image URL (Wikipedia/IGDB)
- Release status
- Availability status (including abandonware)
- Age rating (E, E10+, T, M)
- Metacritic score
- Platform associations
- Genre classifications
- Award associations

### 7. Developers & Publishers (26 Companies)
Major game companies included:
- Nintendo, Sony Interactive Entertainment, Microsoft Studios
- CD Projekt Red, Rockstar Games, Valve, FromSoftware
- Bethesda, Naughty Dog, Insomniac Games, Square Enix
- Capcom, Konami, Sega, Bungie, Epic Games
- BioWare, Ubisoft, Activision, Blizzard, id Software
- And more indie studios

### 8. Game Genres (20 Categories)
Comprehensive genre system:
- Action, Adventure, RPG, Strategy, Simulation
- Sports, Puzzle, Horror, Shooter, Fighting
- Platformer, Racing, Survival, Stealth
- MMORPG, MOBA, Sandbox, Roguelike
- Metroidvania, Visual Novel

## User Features

### Collection Management
Users can mark games with different statuses:
- **Playing**: Currently playing
- **Completed**: Finished the game
- **Paused**: Temporarily stopped
- **Abandoned**: No longer playing
- **Not Started**: In collection but not played
- **Wishlist**: Want to purchase

### Dashboard Statistics
The dashboard displays real-time statistics:
- Total games in collection
- Currently playing count
- Completed games count
- Wishlist count
- Reviews written
- Unread notifications

### Filters & Discovery
Find games by:
- Platform (PS1-PS5, Xbox, Nintendo, PC, etc.)
- Release status (Released, Coming Soon, In Development)
- Availability (Available, Abandonware)
- Genre
- Year
- GOTY awards
- Text search

## Technical Implementation

### Database Schema
The enhanced seed file (`database/seed.sql`) includes:
- Transaction-wrapped inserts for data integrity
- Conflict handling (ON CONFLICT DO NOTHING)
- Proper foreign key relationships
- Platform-game associations
- Award-game associations
- Genre classifications

### API Endpoints
Existing endpoints support:
- `GET /api/games` - List all games with filters
- `GET /api/games/:id` - Get game details
- `GET /api/games/upcoming-releases` - Coming soon games
- `GET /api/games/abandonware` - Abandonware games
- `GET /api/users/me/stats` - User statistics

## How to Use

### 1. Seed the Database
```bash
# Using the setup script
node setup-db.js

# Or manually with PostgreSQL
psql -U postgres -d gamevault -f database/schema.sql
psql -U postgres -d gamevault -f database/seed.sql
```

### 2. Verify Data
```sql
-- Count games by platform
SELECT p.name, COUNT(gp.game_id) as game_count
FROM platforms p
LEFT JOIN games_platforms gp ON p.id = gp.platform_id
GROUP BY p.name
ORDER BY game_count DESC;

-- List GOTY winners
SELECT g.title, g.release_year, a.year as award_year
FROM games g
JOIN games_awards ga ON g.id = ga.game_id
JOIN awards a ON ga.award_id = a.id
WHERE a.slug = 'tga-goty'
ORDER BY a.year DESC;

-- Find abandonware games
SELECT title, release_year, availability_status
FROM games
WHERE availability_status = 'abandonware';
```

### 3. Access via Frontend
- Browse games at `/games`
- View your collection at `/collection`
- Manage wishlist at `/wishlist`
- Check dashboard at `/dashboard`

## Future Enhancements

Potential additions:
1. Automatic status updates based on release dates
2. Price tracking for wishlist items
3. Community voting for abandonware re-releases
4. User reviews and ratings
5. Social features (friends, activity feeds)
6. Achievement tracking
7. Game recommendations
8. Advanced search filters

## Data Sources

Game information and cover images sourced from:
- Wikipedia Commons (CC-licensed images)
- IGDB (Internet Game Database)
- Public domain resources
- Official game websites

All images are used for educational and non-commercial purposes.

---

**Last Updated**: February 2026
**Database Version**: 2.0
**Total Games**: 70+
**Total Platforms**: 27
**Total Companies**: 26
