# **GAMEVAULT**
## **Complete Platform for Game Management and Preservation**

---

# **1. PROJECT IDENTIFICATION**

**Project Name:** GameVault

**Type:** Web and Mobile Game Management System

**Mode:** Individual Project

**Start Date:** November/2024

**Student(s):** Vítor Luciano Carodoso Noé

---

# **2. PROJECT OVERVIEW**

## **2.1. Description**

GameVault is a complete and modern platform for cataloging, managing, and historical preservation of digital games. The system allows users to organize their personal collections across multiple platforms (PC, current and retro consoles), track upcoming releases, discover award-winning games, participate in the preservation of gaming history through abandonware cataloging, and contribute to the community by voting for games they'd like to see re-released.

## **2.2. General Objective**

Develop a complete and functional system that allows gamers and collectors to:
- Catalog and organize their game collection across all platforms
- Discover new games through advanced filters
- Track future releases and games in development
- Participate in cultural preservation of classic games
- Manage wishlist with smart notifications
- Rate and share opinions about games

## **2.3. Target Audience**

- **Casual and hardcore gamers** who own games on multiple platforms
- **Collectors** of physical and digital games
- **Retro game enthusiasts** interested in preservation
- **Gaming community** seeking organization and library statistics
- **Researchers and historians** of video games
- **Age range:** 16 to 45 years old (predominantly)

## **2.4. Problem Solved**

### **Current Problems:**
1. **Library fragmentation:** Games scattered across multiple platforms (Steam, Epic, PlayStation, Xbox, Nintendo, physical) without centralized organization
2. **Tracking difficulty:** Loss of control over which games owned, on which platform, and status (playing, completed, etc.)
3. **Lack of release visibility:** Missing anticipated game launches or not knowing when they leave Early Access
4. **Unawareness of awarded games:** Difficulty discovering GOTY winners and other important awards
5. **Games lost in time:** Lack of registration and preservation of games that became abandonware
6. **Absence of community voice:** Inability to demonstrate demand for classic game re-releases

### **Proposed Solution:**
A single platform that centralizes all this information, offering organization, discovery, notifications, and community participation.

---

# **3. SYSTEM FEATURES**

## **3.1. Authentication and Profile Module**

### **Features:**
- User registration with email validation
- Secure login with JWT authentication
- Customizable profile (avatar, bio, social media)
- Personal data management
- Notification preferences
- Activity history

## **3.2. Game Catalog Module**

### **Features:**
- Complete game catalog (current and historical)
- Detailed information for each game:
  - Title, cover, screenshots
  - Developer and publisher
  - Release year
  - Description and synopsis
  - Genres and tags
  - Age rating
  - Average rating (user aggregate)
  - Metacritic integration (via API)

### **Game Registration:**
- Administrative interface to add new games
- Automatic import via RAWG API
- Required fields and validations
- Image upload (cover and screenshots)
- Association with available platforms
- Release status definition
- GOTY award attribution

## **3.3. Platforms Module**

### **Supported Platforms:**

**PC:**
- Steam, Epic Games, GOG, Xbox App, Origin/EA App, Ubisoft Connect

**PlayStation:**
- PS5, PS4, PS3, PS2, PS1, PSP, PS Vita

**Xbox:**
- Xbox Series X|S, Xbox One, Xbox 360, Xbox (original)

**Nintendo:**
- Switch, Wii U, Wii, GameCube, N64, SNES, NES
- Game Boy Advance, Game Boy Color, Game Boy
- Nintendo DS, Nintendo 3DS

**Retro/Others:**
- Sega (Dreamcast, Saturn, Genesis/Mega Drive)
- Atari (2600, 5200, 7800, Jaguar)
- Mobile (iOS, Android)

### **Features:**
- Complete platform registration with historical information
- N:N relationship between games and platforms
- Platform-specific release dates
- Exclusivity indication (temporary or permanent)
- Advanced platform filters
- Game statistics per platform

## **3.4. Release Status Module**

### **Available Statuses:**
- ✅ **Released** - Complete and available game
- 🎮 **Early Access** - Playable but in development
- 🔵 **Open Beta** - Public testing phase
- 🔒 **Closed Beta** - Restricted testing phase
- ⚙️ **Alpha** - Early development phase
- 📅 **Coming Soon** - Confirmed date
- 🚧 **In Development** - Announced without date
- ❌ **Cancelled** - Abandoned project

### **Features:**
- Visual countdown for upcoming releases
- Development percentage (when available)
- Development timeline (announcement → alpha → beta → EA → release)
- Update history (for Early Access games)
- Automatic status change notifications
- Release calendar
- Dedicated "Upcoming Releases" section

## **3.5. GOTY Awards Module (Game of the Year)**

### **Tracked Awards:**
- The Game Awards
- Golden Joystick Awards
- DICE Awards
- BAFTA Games Awards
- GDC Awards (Game Developers Choice)
- Brasil Game Awards
- Other relevant regional awards

### **Features:**
- Award registration by year and category
- Visual "GOTY" badge/seal on winning games
- Hall of Fame with all winners
- Specific filter for awarded games
- Complete award history per game
- GOTY timeline by year
- Award statistics by developer/publisher

## **3.6. Abandonware and Preservation Module**

### **Commercial Availability Status:**
- ✅ **Available** - Can be legally purchased
- ⚠️ **Out of Catalog** - No longer sold, but license active
- 🔒 **Expired License** - Copyright in limbo
- 📦 **Abandonware** - Officially abandoned
- 🏛️ **Public Domain** - Expired rights (rare)
- 💀 **Discontinued** - Permanently removed
- ⭐ **Re-released** - Was abandonware but returned

### **Features:**
- Specific abandonware game catalog
- Information about defunct developers/publishers
- Legal status of each abandonware game
- Links to legal preservation sources (Internet Archive, VGHF)
- Abandonment timeline (release → discontinuation → abandonment)
- Educational section about game preservation
- "Abandonware Museum" gallery with nostalgic interface

### **Re-release Request System:**
- Community voting for desired re-releases
- Ranking of most voted games
- Comments about why they want the re-release
- Notifications when abandonware games are re-released
- Success history (games that achieved re-release)
- "Resurrections" interface showing games that returned

## **3.7. Personal Collection Module**

### **Features:**
- Add games to collection specifying:
  - Platform(s) owning the game
  - Format (physical or digital)
  - Status (playing, completed, abandoned, paused, not started)
  - Acquisition date
  - Price paid (optional)
  - Personal notes
- Manage multiple copies of same game (e.g., GTA V on PS4 and PC)
- View by platform (filters and tabs)
- Collection statistics:
  - Total games
  - Distribution by platform
  - Distribution by genre
  - Total hours played (if informed)
  - Estimated collection value
  - Completion rate
- Visual charts (pie, bars, timeline)
- Export list to PDF/Excel

## **3.8. Wishlist Module**

### **Features:**
- Add desired games specifying preferred platform
- Prioritization (high, medium, low)
- Maximum price willing to pay indication
- Sort by:
  - Release date (closest first)
  - Priority
  - Price
  - Expected rating
- Automatic notifications for:
  - Game release
  - Sales entry (future)
  - Status change (EA → Release)
- Days countdown to release

## **3.9. Search and Filters Module**

### **Available Filters:**
- **Free text:** search in title, developer, publisher
- **Platforms:** multiple selection, all generations
- **Genres:** action, RPG, strategy, simulation, sports, adventure, puzzle, etc.
- **Release year:** range or decade
- **Release status:** released, EA, beta, in development
- **Commercial status:** available, abandonware, re-released
- **Awards:** GOTY winners, by specific award
- **Rating:** evaluation range (0-10)
- **Console generation:** 1st, 2nd, 3rd... 9th generation

### **Sorting:**
- Relevance (default)
- Release date (newest/oldest)
- Name (A-Z / Z-A)
- Rating (highest/lowest)
- Most voted (for re-release)
- Upcoming releases

### **View:**
- Grid (cards with cover)
- List (compact with essential information)
- Table (detailed)

## **3.10. Reviews and Ratings Module**

### **Features:**
- Rating system (0 to 10 or 5 stars)
- Complete text review
- Sentiment tags (recommend / don't recommend)
- Hours played (optional)
- Platform played on
- Spoiler marking
- Likes/dislikes on reviews
- Most helpful reviews highlighted
- Filter reviews by platform
- Average rating aggregation per game

## **3.11. Dashboard/Statistics Module**

### **Available Widgets:**
- **Collection Summary:**
  - Total games
  - By platform
  - By status (playing, completed, etc.)
  - Distribution chart

- **Upcoming Releases:**
  - Wishlist games with countdown
  - Visual timeline for next 3 months

- **Early Access:**
  - EA games you own
  - Latest updates received

- **Personal Hall of Fame:**
  - Your games that are GOTY
  - Award statistics in collection

- **Abandonware:**
  - Abandonware games you own
  - Re-release alerts

- **Recent Activity:**
  - Latest games added
  - Latest reviews made
  - Status changes

- **Personal Achievements:**
  - Milestones reached (100 games, first review, etc.)

## **3.12. Notifications Module**

### **Notification Types:**

**Push (Mobile):**
- 🎮 Wishlist game released
- 📅 X days until release
- ⭐ Abandonware game re-released
- 🔄 EA game received major update
- 🏆 Game won GOTY
- 👍 Someone liked your review (optional)

**In-App (Web and Mobile):**
- All of the above
- Status changes of followed games
- Comment replies
- Collection milestones reached

**Settings:**
- Enable/disable by type
- Frequency (real-time, daily, weekly)
- Channels (push, email, in-app)

## **3.13. Developers and Publishers Module**

### **Features:**
- Complete company registration
- Company status:
  - Active
  - Closed (with closure year)
  - Acquired (by which company)
- Company history
- List of developed/published games
- Company timeline
- "Defunct Developers" section
- Relationship between developer and publisher

## **3.14. External API Integration Module**

### **RAWG API (Primary):**
- Automatic game import
- Enriched data:
  - Complete descriptions
  - Screenshots and trailers
  - Metacritic scores
  - Available platforms
  - Genres and tags
  - Release dates
- Automatic information updates

### **Features:**
- Game search in API
- One-click import
- Periodic synchronization
- Local data cache
- Fallback to manual data

## **3.15. Administrative Module**

### **Features:**
- Administrative dashboard
- User management
- Review moderation
- Game registration/editing
- Platform management
- Award registration
- Developer/publisher management
- Reports and general statistics
- Activity logs

---

# **4. DETAILED FUNCTIONAL REQUIREMENTS**

## **FR01 - Authentication and Authorization**
- **FR01.1:** System must allow new user registration
- **FR01.2:** System must validate email on registration
- **FR01.3:** System must authenticate users via login/password
- **FR01.4:** System must use JWT tokens for sessions
- **FR01.5:** System must have password recovery via email
- **FR01.6:** System must differentiate regular user from administrator

## **FR02 - Profile Management**
- **FR02.1:** User must be able to edit personal information
- **FR02.2:** User must be able to upload avatar
- **FR02.3:** User must view activity history
- **FR02.4:** User must configure notification preferences

## **FR03 - Game Catalog**
- **FR03.1:** System must display complete game catalog
- **FR03.2:** Each game must have complete details page
- **FR03.3:** System must allow free text search
- **FR03.4:** System must have multiple filters (platform, genre, year, etc.)
- **FR03.5:** System must allow different sorting
- **FR03.6:** System must display games in grid, list, or table

## **FR04 - Platform Management**
- **FR04.1:** System must register all platforms (PC, consoles, retro)
- **FR04.2:** System must relate games with platforms (N:N)
- **FR04.3:** System must store release date per platform
- **FR04.4:** System must indicate exclusivities

## **FR05 - Release Status**
- **FR05.1:** System must record status of each game
- **FR05.2:** System must display countdown for future releases
- **FR05.3:** System must maintain history of status changes
- **FR05.4:** System must notify status changes

## **FR06 - GOTY Awards**
- **FR06.1:** System must register awards and categories
- **FR06.2:** System must relate games with won awards
- **FR06.3:** System must display GOTY badge on winning games
- **FR06.4:** System must have specific filter for GOTY games
- **FR06.5:** System must have Hall of Fame page with winners

## **FR07 - Abandonware and Preservation**
- **FR07.1:** System must record commercial availability status
- **FR07.2:** System must register defunct developers/publishers
- **FR07.3:** System must allow voting for re-releases
- **FR07.4:** System must display ranking of most voted games
- **FR07.5:** System must notify when abandonware is re-released
- **FR07.6:** System must have educational section about preservation

## **FR08 - Personal Collection**
- **FR08.1:** User must add games to their collection
- **FR08.2:** User must specify platform and format (physical/digital)
- **FR08.3:** User must define status (playing, completed, etc.)
- **FR08.4:** User must record price and acquisition date
- **FR08.5:** System must calculate collection statistics
- **FR08.6:** System must generate distribution charts
- **FR08.7:** User must export list to PDF/Excel

## **FR09 - Wishlist**
- **FR09.1:** User must add games to wishlist
- **FR09.2:** User must define priority and desired platform
- **FR09.3:** System must sort by release date
- **FR09.4:** System must display countdown for wishlist games
- **FR09.5:** System must notify releases

## **FR10 - Reviews**
- **FR10.1:** User must rate games (score and review)
- **FR10.2:** System must calculate aggregate average rating
- **FR10.3:** User must mark reviews with spoiler
- **FR10.4:** Users must like/dislike reviews
- **FR10.5:** System must highlight most helpful reviews

## **FR11 - Dashboard**
- **FR11.1:** System must display collection summary
- **FR11.2:** System must show upcoming wishlist releases
- **FR11.3:** System must display charts and statistics
- **FR11.4:** System must show recent activities

## **FR12 - Notifications**
- **FR12.1:** System must send push notifications (mobile)
- **FR12.2:** System must send in-app notifications
- **FR12.3:** User must configure notification preferences
- **FR12.4:** System must notify releases, re-releases, and updates

## **FR13 - API Integration**
- **FR13.1:** System must integrate with RAWG API
- **FR13.2:** Admin must import games from API with one click
- **FR13.3:** System must periodically synchronize data
- **FR13.4:** System must cache API data

## **FR14 - Administration**
- **FR14.1:** Admin must have specific dashboard
- **FR14.2:** Admin must moderate user content
- **FR14.3:** Admin must manage master records
- **FR14.4:** Admin must view general reports

---

# **5. NON-FUNCTIONAL REQUIREMENTS**

## **NFR01 - Performance**
- **NFR01.1:** API response time: maximum 2 seconds
- **NFR01.2:** Web page loading: maximum 3 seconds
- **NFR01.3:** Support for 100 simultaneous users (minimum)
- **NFR01.4:** Result pagination (20 items per page)
- **NFR01.5:** Frequent query caching

## **NFR02 - Security**
- **NFR02.1:** Passwords encrypted with bcrypt
- **NFR02.2:** Authentication via JWT with expiration
- **NFR02.3:** SQL Injection protection
- **NFR02.4:** XSS protection
- **NFR02.5:** Input validation in all forms
- **NFR02.6:** Mandatory HTTPS in production
- **NFR02.7:** API rate limiting

## **NFR03 - Usability**
- **NFR03.1:** Intuitive and responsive interface
- **NFR03.2:** Consistent design across all pages
- **NFR03.3:** Clear error messages
- **NFR03.4:** Visual feedback on user actions
- **NFR03.5:** Basic accessibility (contrast, alt text)
- **NFR03.6:** Support for different screen sizes

## **NFR04 - Compatibility**
- **NFR04.1:** Web: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **NFR04.2:** Mobile: Android 8+ and iOS 13+
- **NFR04.3:** Responsive: desktop, tablet, mobile

## **NFR05 - Maintainability**
- **NFR05.1:** Code following standards (PSR-12, ESLint, etc.)
- **NFR05.2:** Comments on complex code
- **NFR05.3:** API documentation (Swagger/OpenAPI)
- **NFR05.4:** Modular and componentized structure
- **NFR05.5:** Semantic versioning

## **NFR06 - Scalability**
- **NFR06.1:** Architecture prepared for growth
- **NFR06.2:** Normalized database
- **NFR06.3:** Optimized queries with indexes
- **NFR06.4:** Separation of concerns (backend/frontend)

## **NFR07 - Availability**
- **NFR07.1:** System available via Codespaces 24/7
- **NFR07.2:** Daily database backup (recommended)
- **NFR07.3:** Centralized error logs

## **NFR08 - Portability**
- **NFR08.1:** Containerized environment (Docker)
- **NFR08.2:** Configuration via environment variables
- **NFR08.3:** Automated setup scripts

---

# **6. DATA MODEL**

## **6.1. Main Entities**

### **Users**
```
users
- id (PK)
- name
- email (unique)
- password_hash
- avatar_url
- bio
- created_at
- type (regular/admin)
```

### **Games**
```
games
- id (PK)
- title
- slug (unique)
- description
- synopsis
- release_year
- release_date
- cover_url
- banner_url
- trailer_url
- developer_id (FK)
- publisher_id (FK)
- release_status (enum)
- availability_status (enum)
- discontinuation_date
- official_abandonment_date
- rerelease_date
- abandonment_reason (text)
- development_percentage
- age_rating
- average_rating (calculated)
- total_reviews
- is_early_access
- was_rereleased
- rawg_id (nullable, for integration)
- metacritic_score
- created_at
- updated_at
```

### **Platforms**
```
platforms
- id (PK)
- name
- slug
- manufacturer
- type (console/handheld/pc/mobile)
- generation
- release_year
- discontinuation_year
- logo_url
- primary_color
```

### **Genres**
```
genres
- id (PK)
- name
- slug
- icon
```

### **Developers**
```
developers
- id (PK)
- name
- slug
- logo_url
- status (active/closed/acquired)
- acquired_by
- foundation_year
- closure_year
- history (text)
- website
```

### **Publishers**
```
publishers
- id (PK)
- name
- slug
- logo_url
- status (active/closed/acquired)
- acquired_by
- foundation_year
- closure_year
- website
```

### **Awards**
```
awards
- id (PK)
- name
- slug
- year
- category
- relevance (1-10)
- website
```

### **User Collection**
```
user_collection
- id (PK)
- user_id (FK)
- game_id (FK)
- platform_id (FK)
- format (physical/digital)
- status (playing/completed/paused/abandoned/not_started/wishlist)
- acquisition_date
- price_paid
- hours_played
- personal_notes (text)
- created_at
- updated_at
```

### **Reviews**
```
reviews
- id (PK)
- user_id (FK)
- game_id (FK)
- platform_id (FK)
- rating (0-10)
- review_text (text)
- has_spoilers
- hours_played
- recommends
- likes_count
- dislikes_count
- created_at
- updated_at
```

### **Re-release Requests**
```
rerelease_requests
- id (PK)
- game_id (FK)
- total_votes
- status (active/fulfilled/archived)
- created_at
```

### **Notifications**
```
notifications
- id (PK)
- user_id (FK)
- type (release/rerelease/update/goty/etc)
- game_id (FK, nullable)
- title
- message
- read
- created_at
```

### **Preservation Sources**
```
preservation_sources
- id (PK)
- name
- slug
- url
- type (museum/archive/organization)
- logo_url
```

## **6.2. Relationship Tables (N:N)**

```
games_platforms
- game_id (FK)
- platform_id (FK)
- platform_release_date
- exclusivity (permanent/temporary/none)
- PRIMARY KEY (game_id, platform_id)

games_genres
- game_id (FK)
- genre_id (FK)
- PRIMARY KEY (game_id, genre_id)

games_awards
- game_id (FK)
- award_id (FK)
- PRIMARY KEY (game_id, award_id)

rerelease_votes
- request_id (FK)
- user_id (FK)
- comment (text)
- vote_date
- PRIMARY KEY (request_id, user_id)

games_preservation
- game_id (FK)
- source_id (FK)
- available
- specific_url
- notes
- PRIMARY KEY (game_id, source_id)

review_likes
- review_id (FK)
- user_id (FK)
- type (like/dislike)
- PRIMARY KEY (review_id, user_id)
```

## **6.3. Simplified ER Diagram**

```
USERS (1) -------- (N) USER_COLLECTION (N) -------- (1) GAMES
USERS (1) -------- (N) REVIEWS (N) -------- (1) GAMES
USERS (1) -------- (N) RERELEASE_VOTES (N) -------- (1) RERELEASE_REQUESTS
GAMES (N) -------- (N) PLATFORMS [via games_platforms]
GAMES (N) -------- (N) GENRES [via games_genres]
GAMES (N) -------- (N) AWARDS [via games_awards]
GAMES (N) -------- (1) DEVELOPERS
GAMES (N) -------- (1) PUBLISHERS
GAMES (1) -------- (N) RERELEASE_REQUESTS
```

---

# **7. SYSTEM ARCHITECTURE**

## **7.1. General Architecture**

```
┌─────────────────────────────────────────┐
│        PRESENTATION LAYER               │
├─────────────────┬───────────────────────┤
│   Web App       │    Mobile App         │
│   (React/Vue)   │  (React Native/Flutter)│
└────────┬────────┴───────────┬───────────┘
         │                    │
         └────────┬───────────┘
                  │ HTTP/HTTPS (REST)
         ┌────────▼───────────┐
         │   REST API         │
         │   (Backend)        │
         │   Node/PHP/Python  │
         └────────┬───────────┘
                  │
         ┌────────▼───────────┐
         │   Database         │
         │   MySQL/PostgreSQL │
         └────────────────────┘
```

## **7.2. Backend (REST API)**

### **Suggested Stack:**
- **Language:** Node.js + Express + TypeScript
- **Alternatives:** PHP (Laravel), Python (Django/Flask)

### **Folder Structure:**
```
/backend
  /src
    /config         # Settings (DB, JWT, etc)
    /controllers    # Route controllers
    /models         # Data models
    /routes         # Route definitions
    /middlewares    # Authentication, validation, etc
    /services       # Business logic
    /utils          # Helper functions
    /validators     # Data validation
  /tests            # Automated tests
  .env.example
  package.json
  README.md
```

### **Main Endpoints:**

```
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

# Users
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/:id
POST   /api/users/avatar

# Games
GET    /api/games
GET    /api/games/:id
POST   /api/games (admin)
PUT    /api/games/:id (admin)
DELETE /api/games/:id (admin)
GET    /api/games/:id/platforms
GET    /api/games/:id/reviews
GET    /api/games/search
GET    /api/games/goty
GET    /api/games/upcoming-releases
GET    /api/games/early-access
GET    /api/games/abandonware
GET    /api/games/rereleases

# Platforms
GET    /api/platforms
GET    /api/platforms/:id
GET    /api/platforms/:id/games

# Collection
GET    /api/collection
POST   /api/collection
PUT    /api/collection/:id
DELETE /api/collection/:id
GET    /api/collection/statistics

# Wishlist
GET    /api/wishlist
POST   /api/wishlist
DELETE /api/wishlist/:id

# Reviews
GET    /api/reviews/game/:gameId
POST   /api/reviews
PUT    /api/reviews/:id
DELETE /api/reviews/:id
POST   /api/reviews/:id/like

# Awards
GET    /api/awards
GET    /api/awards/:year

# Rereleases
GET    /api/rereleases/requests
POST   /api/rereleases/:gameId/vote
GET    /api/rereleases/most-voted

# Notifications
GET    /api/notifications
PUT    /api/notifications/:id/mark-read
POST   /api/notifications/settings

# External Integration
GET    /api/external/rawg/search
POST   /api/external/rawg/import/:id
```

## **7.3. Web Frontend**

### **Suggested Stack:**
- **Framework:** React + TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router
- **Global State:** Context API / Redux Toolkit
- **Requests:** Axios
- **Alternatives:** Vue.js, Angular

### **Folder Structure:**
```
/frontend-web
  /src
    /assets         # Images, icons, fonts
    /components     # Reusable components
      /common       # Buttons, inputs, cards
      /layout       # Header, Footer, Sidebar
      /games        # Game-specific components
    /pages          # Complete pages
    /contexts       # Context API (global state)
    /hooks          # Custom hooks
    /services       # API calls
    /utils          # Helper functions
    /styles         # Global CSS, themes
  public/
  package.json
```

### **Main Pages:**
- `/` - Home/Dashboard
- `/login` - Login
- `/register` - Registration
- `/games` - Game catalog
- `/games/:id` - Game details
- `/collection` - My collection
- `/wishlist` - Wishlist
- `/goty` - GOTY Hall of Fame
- `/upcoming-releases` - Upcoming releases
- `/early-access` - Early Access games
- `/abandonware` - Abandonware Museum
- `/rereleases` - Re-release requests
- `/platforms` - Platform list
- `/platforms/:id` - Platform details
- `/profile` - User profile
- `/settings` - Settings
- `/admin` - Administrative dashboard

## **7.4. Mobile App**

### **Suggested Stack:**
- **Framework:** React Native + TypeScript
- **Navigation:** React Navigation
- **Styling:** Styled Components / Native Base
- **State:** Context API / Redux Toolkit
- **Alternative:** Flutter

### **Folder Structure:**
```
/frontend-mobile
  /src
    /assets
    /components
    /screens        # Screens (equivalent to pages)
    /navigation     # Navigation configuration
    /contexts
    /hooks
    /services
    /utils
  App.tsx
  package.json
```

### **Main Screens:**
- Home (Dashboard)
- Explore (Catalog)
- Game Details
- My Collection
- Wishlist
- Notifications
- Profile
- Settings

## **7.5. Database**

### **Suggested Stack:**
- **DBMS:** PostgreSQL or MySQL
- **ORM:** Sequelize (Node), Eloquent (Laravel), SQLAlchemy (Python)
- **Migrations:** Schema version control

### **Best Practices:**
- Indexes on frequently searched fields
- Foreign Keys with appropriate ON DELETE/UPDATE
- Triggers for aggregate calculations (average_rating)
- Views for complex queries (statistics)
- Stored procedures for heavy operations (optional)

---

# **8. EXTERNAL API INTEGRATION**

## **8.1. RAWG Video Games Database API**

### **Information:**
- **URL:** https://api.rawg.io/api
- **Documentation:** https://rawg.io/apidocs
- **Authentication:** Free API Key
- **Rate Limit:** 20,000 requests/month (free plan)

### **Used Endpoints:**
```
GET /games              # Game list
GET /games/{id}         # Game details
GET /platforms          # Platform list
GET /genres             # Genre list
GET /developers         # Developer list
GET /publishers         # Publisher list
```

### **Obtained Data:**
- Title, description, synopsis
- Metacritic score
- Screenshots, trailers
- Available platforms
- Genres and tags
- Developer and publisher
- Release date
- Status (released, tba, etc.)

### **Implementation:**
```javascript
// Integration example
const RAWG_API_KEY = process.env.RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api';

async function searchGame(query) {
  const response = await axios.get(`${BASE_URL}/games`, {
    params: {
      key: RAWG_API_KEY,
      search: query,
      page_size: 10
    }
  });
  return response.data.results;
}

async function importGame(rawgId) {
  const response = await axios.get(`${BASE_URL}/games/${rawgId}`, {
    params: { key: RAWG_API_KEY }
  });
  
  // Map API data to system model
  const gameData = {
    title: response.data.name,
    description: response.data.description_raw,
    release_year: new Date(response.data.released).getFullYear(),
    // ... other fields
  };
  
  // Save to database
  return await Game.create(gameData);
}
```

---

# **9. TECHNOLOGIES AND TOOLS**

## **9.1. Mandatory Technologies (According to PIF)**

### **Backend:**
- Node.js (Express) **OR**
- PHP (Laravel) **OR**
- Python (Django/Flask)

### **Web Frontend:**
- React **OR**
- Vue.js **OR**
- Angular
- HTML5, CSS3, JavaScript/TypeScript

### **Mobile:**
- React Native **OR**
- Flutter **OR**
- Kotlin/Swift (native)

### **Database:**
- MySQL **OR**
- PostgreSQL **OR**
- MongoDB (if justified)

### **Version Control:**
- Git
- GitHub (with GitHub Projects)
- GitHub Codespaces

## **9.2. Development Tools**

### **Design:**
- Figma (prototypes and design system)

### **Documentation:**
- Swagger/OpenAPI (API documentation)
- Complete README.md

### **Testing:**
- Jest (JavaScript/TypeScript)
- PHPUnit (PHP)
- Pytest (Python)
- Postman/Insomnia (API testing)

### **Containerization:**
- Docker
- Docker Compose

### **CI/CD:**
- GitHub Actions (optional, but recommended)

## **9.3. Suggested Libraries**

### **Backend (Node.js):**
```json
{
  "express": "^4.18.0",
  "typescript": "^5.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0",
  "sequelize": "^6.35.0",
  "mysql2": "^3.6.0",
  "dotenv": "^16.0.0",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "express-validator": "^7.0.0",
  "axios": "^1.6.0",
  "multer": "^1.4.5-lts.1"
}
```

### **Frontend (React):**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "axios": "^1.6.0",
  "tailwindcss": "^3.3.0",
  "react-query": "^3.39.0",
  "zustand": "^4.4.0",
  "react-hook-form": "^7.48.0",
  "recharts": "^2.10.0",
  "lucide-react": "^0.300.0",
  "date-fns": "^2.30.0"
}
```

---

# **10. SUGGESTED TIMELINE**

## **Sprint 0 - Planning (Until 12/08/2024)**
- [x] Theme definition
- [ ] Complete briefing
- [ ] Functional and non-functional requirements
- [ ] Database model
- [ ] Figma prototype (low/medium fidelity)
- [ ] Formal professor approval

## **Sprint 1 - Infrastructure (12/09 - 12/22/2024)**
- [ ] GitHub repository setup
- [ ] GitHub Projects configuration
- [ ] Codespaces configuration
- [ ] Database setup
- [ ] Basic backend structure (API)
- [ ] Basic web frontend structure
- [ ] Basic mobile structure
- [ ] First test routes
- [ ] Initial documentation

## **Sprint 2 - Authentication and Registration (12/23 - 01/12/2025)**
- [ ] Complete authentication system
- [ ] User CRUD
- [ ] Game CRUD (admin)
- [ ] Platform CRUD
- [ ] Genre CRUD
- [ ] Login/registration pages (web + mobile)
- [ ] API tests

## **Sprint 3 - Catalog and Search (01/13 - 01/26/2025)**
- [ ] Game listing with pagination
- [ ] Game details page
- [ ] Search and filter system
- [ ] RAWG API integration
- [ ] Game import
- [ ] Web catalog interface
- [ ] Mobile catalog interface

## **Sprint 4 - Collection and Wishlist (01/27 - 02/02/2025)**
- [ ] Personal collection system
- [ ] Collection item CRUD
- [ ] Collection statistics
- [ ] Charts and dashboard
- [ ] Wishlist system
- [ ] Web interface
- [ ] Mobile interface

## **Sprint 5 - Advanced Features (02/03 - 02/09/2025)**
- [ ] Review system
- [ ] GOTY system
- [ ] Release status and countdown
- [ ] Abandonware system
- [ ] Re-release voting
- [ ] Notification system

## **Sprint 6 - Finalization and Testing (02/10 - 02/16/2025)**
- [ ] UI/UX adjustments
- [ ] General testing
- [ ] Bug fixes
- [ ] Performance optimizations
- [ ] Final documentation
- [ ] Presentation preparation

## **Final Presentation (02/17 - 02/21/2025)**
- [ ] Complete demonstration
- [ ] Project defense
- [ ] Documentation delivery

---

# **11. SUCCESS CRITERIA**

## **11.1. Technical**
- ✅ Complete and functional REST API
- ✅ Normalized and implemented database
- ✅ Responsive web application
- ✅ Functional mobile application
- ✅ Working external API integration
- ✅ Implemented authentication and authorization
- ✅ All CRUD operations working
- ✅ System running on Codespaces
- ✅ Code versioned with best practices (commits, PRs)
- ✅ Complete documentation (README, API docs)

## **11.2. Functional**
- ✅ User can create account and login
- ✅ User can search and filter games
- ✅ User can manage their collection
- ✅ User can add games to wishlist
- ✅ User can rate games
- ✅ User can see statistics
- ✅ System displays GOTY awards
- ✅ System displays upcoming releases
- ✅ System allows voting on re-releases
- ✅ System sends notifications

## **11.3. Managerial**
- ✅ Partial deliveries met on deadlines
- ✅ GitHub Projects updated
- ✅ Pull Requests reviewed and approved
- ✅ Documentation maintained throughout project
- ✅ Meetings with Scrum Master held

---

# **12. RISKS AND MITIGATIONS**

## **12.1. Technical Risks**

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Excessive scope complexity | Medium | High | Prioritize MVPs, essential features first |
| Difficulty with new technologies | Medium | Medium | Study in advance, seek tutorials |
| External API problems (RAWG) | Low | Medium | Implement fallback, local cache |
| Codespaces limitations | Low | Medium | Configure .devcontainer properly |
| Data loss | Low | High | Regular backups, versioned migrations |
| Performance with large volume | Medium | Medium | Optimize queries, implement cache |

## **12.2. Timeline Risks**

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Task underestimation | High | High | Planning poker, add time buffer |
| Technical blockers | Medium | Medium | Identify early, ask professor for help |
| Technical debt accumulation | Medium | Medium | Frequent code reviews, continuous refactoring |

## **12.3. Scope Risks**

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Feature creep | High | High | Keep backlog prioritized, focus on MVP |
| Requirement changes | Low | Medium | Clear documentation from the start |

---

# **13. PROJECT DIFFERENTIATORS**

## **13.1. Technical**
- ✨ Real external API integration (RAWG)
- ✨ Push notification system (mobile)
- ✨ Dashboard with interactive charts
- ✨ Community voting system
- ✨ Intelligent query cache
- ✨ Image upload and processing
- ✨ Complete API documentation (Swagger)

## **13.2. Functional**
- ✨ Complete platform coverage (retro + current)
- ✨ Unique GOTY system in the market
- ✨ Historical preservation of abandonware games
- ✨ Game development timeline
- ✨ Advanced collection statistics
- ✨ Release countdowns

## **13.3. UX/Design**
- ✨ Modern and intuitive interface
- ✨ Fully responsive
- ✨ Dark/light theme (optional)
- ✨ Smooth animations and transitions
- ✨ Visual feedback on all actions

---

# **14. DELIVERABLES**

## **14.1. Documentation**
1. **Complete Briefing** ✅ (this document)
2. **Functional and Non-Functional Requirements** ✅
3. **Entity-Relationship Model** (visual diagram)
4. **Figma Prototype** (low/medium fidelity)
5. **API Documentation** (Swagger/OpenAPI)
6. **User Manual** (optional, but recommended)
7. **Installation Guide** (README.md)

## **14.2. Source Code**
1. **Organized GitHub repository**
2. **Complete backend** with REST API
3. **Responsive and functional web frontend**
4. **Functional mobile application**
5. **Database scripts** (schema, migrations, seeds)
6. **Codespaces configuration** (.devcontainer)
7. **Tests** (manual mandatory, automated optional)

## **14.3. Presentation**
1. **Presentation slides**
2. **Demo video** (3-5 minutes)
3. **Live system demonstration**

---

# **15. GLOSSARY**

**API (Application Programming Interface):** Programming interface that enables communication between systems.

**Abandonware:** Software (game) that is no longer being sold or officially supported.

**Backend:** Part of the system responsible for business logic and data access.

**CRUD:** Create, Read, Update, Delete - basic database operations.

**Early Access:** Development phase where the game is available for purchase before official release.

**Frontend:** Part of the system responsible for user interface.

**GOTY (Game of the Year):** Award given to the best game of the year.

**JWT (JSON Web Token):** Standard for token-based authentication.

**Middleware:** Intermediary software that processes requests before reaching final destination.

**MVP (Minimum Viable Product):** Minimum viable version of product with essential features.

**ORM (Object-Relational Mapping):** Technique for mapping objects to database records.

**Publisher:** Company responsible for publishing and distributing the game.

**REST (Representational State Transfer):** Architectural style for web APIs.

**Scrum Master:** Responsible for facilitating agile process (in this case, the professor).

**Sprint:** Short-duration development cycle (1-2 weeks).

**Wishlist:** Wish list, games the user wants to acquire in the future.

---

# **16. REFERENCES**

## **16.1. APIs and Services**
- RAWG Video Games Database: https://rawg.io/apidocs
- IGDB (Internet Game Database): https://api-docs.igdb.com/

## **16.2. Technical Documentation**
- Express.js: https://expressjs.com/
- React: https://react.dev/
- React Native: https://reactnative.dev/
- Flutter: https://flutter.dev/
- PostgreSQL: https://www.postgresql.org/docs/
- MySQL: https://dev.mysql.com/doc/

## **16.3. Design and UX**
- Figma: https://www.figma.com/
- Tailwind CSS: https://tailwindcss.com/

## **16.4. Game Preservation**
- Video Game History Foundation: https://gamehistory.org/
- Internet Archive: https://archive.org/details/software

---

# **17. FINAL REMARKS**

This document represents the complete scope of the GameVault project according to the guidelines of the Final Integrating Project of the Technical Course in Systems Development.

All described features were carefully planned to:
- ✅ Meet minimum PIF requirements
- ✅ Demonstrate complete technical mastery
- ✅ Be feasible within established deadline
- ✅ Add real value to users
- ✅ Serve as professional portfolio

The project will be developed following adapted agile methodology, with the professor acting as Scrum Master, ensuring close monitoring and incremental value deliveries.

**Expected Start:** December/2024
**Expected Completion:** February/2025

---

**Document Version:** 1.0
**Creation Date:** 11/24/2024
**Last Update:** 11/24/2024
**Status:** Awaiting Approval

---

# **APPENDIX A - PIF COMPLIANCE CHECKLIST**

## Mandatory Requirements:

- [x] **Backend with API:** ✅ Complete REST API
- [x] **Database:** ✅ PostgreSQL/MySQL with normalized model
- [x] **Responsive Web Application:** ✅ Responsive React/Vue
- [x] **Mobile Application:** ✅ React Native/Flutter
- [x] **Design and documentation:** ✅ Figma + complete documentation
- [x] **Agile methodology:** ✅ Scrum with GitHub Projects
- [x] **Formally approved theme:** ⏳ Pending
- [x] **No pornographic content:** ✅ Appropriate content
- [x] **GitHub with institutional email:** ✅ @senac.edu.br
- [x] **GitHub Projects (Kanban):** ✅ Planned
- [x] **Branches and Pull Requests:** ✅ Structure defined
- [x] **Configured Codespaces:** ✅ .devcontainer planned
- [x] **Minimum 3 entities with relationships:** ✅ 15+ entities
- [x] **Complete CRUD:** ✅ Multiple CRUDs planned
- [x] **Protected endpoints:** ✅ JWT implemented
- [x] **Data validation:** ✅ Planned
- [x] **Error handling:** ✅ Planned
- [x] **Figma prototype:** ⏳ To do
- [x] **Testing:** ✅ Manual mandatory, automated optional
