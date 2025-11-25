# GAMEVAULT Database Model - Entity Relationship Diagram

## ER Diagram (Mermaid)

```mermaid
erDiagram
    %% ============================================
    %% MAIN ENTITIES
    %% ============================================
    
    USERS {
        int id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar avatar_url
        text bio
        enum user_type
        boolean email_verified
        varchar email_verification_token
        varchar password_reset_token
        timestamp password_reset_expires
        boolean notification_push
        boolean notification_email
        boolean notification_in_app
        timestamp last_login
        timestamp created_at
        timestamp updated_at
    }
    
    GAMES {
        int id PK
        varchar title
        varchar slug UK
        text description
        text synopsis
        int release_year
        date release_date
        varchar cover_url
        varchar banner_url
        varchar trailer_url
        int developer_id FK
        int publisher_id FK
        enum release_status
        enum availability_status
        date discontinuation_date
        date official_abandonment_date
        date rerelease_date
        text abandonment_reason
        int development_percentage
        varchar age_rating
        decimal average_rating
        int total_reviews
        boolean is_early_access
        boolean was_rereleased
        int rawg_id
        int metacritic_score
        timestamp created_at
        timestamp updated_at
    }
    
    DEVELOPERS {
        int id PK
        varchar name
        varchar slug UK
        varchar logo_url
        enum status
        int acquired_by FK
        int foundation_year
        int closure_year
        text history
        varchar website
        timestamp created_at
        timestamp updated_at
    }
    
    PUBLISHERS {
        int id PK
        varchar name
        varchar slug UK
        varchar logo_url
        enum status
        int acquired_by FK
        int foundation_year
        int closure_year
        varchar website
        timestamp created_at
        timestamp updated_at
    }
    
    PLATFORMS {
        int id PK
        varchar name
        varchar slug UK
        varchar manufacturer
        enum platform_type
        int generation
        int release_year
        int discontinuation_year
        varchar logo_url
        varchar primary_color
        timestamp created_at
        timestamp updated_at
    }
    
    GENRES {
        int id PK
        varchar name
        varchar slug UK
        varchar icon
        text description
        timestamp created_at
    }
    
    AWARDS {
        int id PK
        varchar name
        varchar slug
        int year
        varchar category
        int relevance
        varchar website
        timestamp created_at
    }
    
    PRESERVATION_SOURCES {
        int id PK
        varchar name
        varchar slug UK
        varchar url
        enum source_type
        varchar logo_url
        text description
        timestamp created_at
    }
    
    %% ============================================
    %% USER-RELATED TABLES
    %% ============================================
    
    USER_COLLECTION {
        int id PK
        int user_id FK
        int game_id FK
        int platform_id FK
        enum format
        enum status
        date acquisition_date
        decimal price_paid
        int hours_played
        text personal_notes
        timestamp created_at
        timestamp updated_at
    }
    
    WISHLIST {
        int id PK
        int user_id FK
        int game_id FK
        int platform_id FK
        enum priority
        decimal max_price
        text notes
        timestamp created_at
    }
    
    REVIEWS {
        int id PK
        int user_id FK
        int game_id FK
        int platform_id FK
        decimal rating
        text review_text
        boolean has_spoilers
        int hours_played
        boolean recommends
        int likes_count
        int dislikes_count
        timestamp created_at
        timestamp updated_at
    }
    
    REVIEW_LIKES {
        int review_id PK_FK
        int user_id PK_FK
        enum like_type
        timestamp created_at
    }
    
    NOTIFICATIONS {
        int id PK
        int user_id FK
        enum notification_type
        int game_id FK
        varchar title
        text message
        boolean is_read
        timestamp created_at
    }
    
    USER_ACTIVITY {
        int id PK
        int user_id FK
        varchar activity_type
        varchar entity_type
        int entity_id
        text description
        jsonb metadata
        timestamp created_at
    }
    
    %% ============================================
    %% RE-RELEASE TABLES
    %% ============================================
    
    RERELEASE_REQUESTS {
        int id PK
        int game_id FK_UK
        int total_votes
        enum status
        date fulfilled_date
        timestamp created_at
        timestamp updated_at
    }
    
    RERELEASE_VOTES {
        int request_id PK_FK
        int user_id PK_FK
        text comment
        timestamp vote_date
    }
    
    %% ============================================
    %% N:N RELATIONSHIP TABLES
    %% ============================================
    
    GAMES_PLATFORMS {
        int game_id PK_FK
        int platform_id PK_FK
        date platform_release_date
        enum exclusivity
        timestamp created_at
    }
    
    GAMES_GENRES {
        int game_id PK_FK
        int genre_id PK_FK
    }
    
    GAMES_AWARDS {
        int game_id PK_FK
        int award_id PK_FK
    }
    
    GAMES_PRESERVATION {
        int game_id PK_FK
        int source_id PK_FK
        boolean available
        varchar specific_url
        text notes
        timestamp created_at
    }
    
    GAME_STATUS_HISTORY {
        int id PK
        int game_id FK
        enum previous_release_status
        enum new_release_status
        enum previous_availability_status
        enum new_availability_status
        text change_reason
        timestamp changed_at
    }
    
    %% ============================================
    %% RELATIONSHIPS
    %% ============================================
    
    %% User relationships
    USERS ||--o{ USER_COLLECTION : "has"
    USERS ||--o{ WISHLIST : "has"
    USERS ||--o{ REVIEWS : "writes"
    USERS ||--o{ REVIEW_LIKES : "gives"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ USER_ACTIVITY : "has"
    USERS ||--o{ RERELEASE_VOTES : "casts"
    
    %% Game relationships
    GAMES ||--o{ USER_COLLECTION : "in"
    GAMES ||--o{ WISHLIST : "in"
    GAMES ||--o{ REVIEWS : "receives"
    GAMES ||--o{ NOTIFICATIONS : "triggers"
    GAMES ||--o| RERELEASE_REQUESTS : "has"
    GAMES ||--o{ GAME_STATUS_HISTORY : "has"
    
    %% Game to company relationships
    DEVELOPERS ||--o{ GAMES : "develops"
    PUBLISHERS ||--o{ GAMES : "publishes"
    DEVELOPERS ||--o| DEVELOPERS : "acquired_by"
    PUBLISHERS ||--o| PUBLISHERS : "acquired_by"
    
    %% N:N relationships via junction tables
    GAMES ||--o{ GAMES_PLATFORMS : "available_on"
    PLATFORMS ||--o{ GAMES_PLATFORMS : "has"
    
    GAMES ||--o{ GAMES_GENRES : "categorized_as"
    GENRES ||--o{ GAMES_GENRES : "contains"
    
    GAMES ||--o{ GAMES_AWARDS : "wins"
    AWARDS ||--o{ GAMES_AWARDS : "given_to"
    
    GAMES ||--o{ GAMES_PRESERVATION : "preserved_at"
    PRESERVATION_SOURCES ||--o{ GAMES_PRESERVATION : "preserves"
    
    %% Collection and wishlist platform relationships
    PLATFORMS ||--o{ USER_COLLECTION : "owns_on"
    PLATFORMS ||--o{ WISHLIST : "wants_on"
    PLATFORMS ||--o{ REVIEWS : "played_on"
    
    %% Re-release voting relationships
    RERELEASE_REQUESTS ||--o{ RERELEASE_VOTES : "receives"
    
    %% Review likes
    REVIEWS ||--o{ REVIEW_LIKES : "receives"
```

## Table Summary

| Entity | Description | Key Relationships |
|--------|-------------|-------------------|
| **USERS** | User accounts and preferences | Has collections, wishlists, reviews, notifications |
| **GAMES** | Core game information | Linked to developers, publishers, platforms, genres, awards |
| **DEVELOPERS** | Game development companies | Creates games, can be acquired by other developers |
| **PUBLISHERS** | Game publishing companies | Publishes games, can be acquired |
| **PLATFORMS** | Gaming platforms (consoles, PC, mobile) | Many-to-many with games |
| **GENRES** | Game categorization | Many-to-many with games |
| **AWARDS** | GOTY and other awards | Many-to-many with games |
| **PRESERVATION_SOURCES** | Legal preservation archives | Many-to-many with games |
| **USER_COLLECTION** | User's owned games | Links users, games, and platforms |
| **WISHLIST** | User's desired games | Links users, games, with priority |
| **REVIEWS** | User reviews and ratings | Links users and games |
| **REVIEW_LIKES** | Like/dislike on reviews | Links users and reviews |
| **NOTIFICATIONS** | User notifications | Linked to users and optionally games |
| **RERELEASE_REQUESTS** | Community re-release requests | One per game |
| **RERELEASE_VOTES** | User votes for re-releases | Links users and requests |
| **USER_ACTIVITY** | User activity history | Tracks user actions |
| **GAME_STATUS_HISTORY** | Game status change log | Tracks status changes |

## Relationship Types

### One-to-Many (1:N)
- `DEVELOPERS` → `GAMES` (1 developer creates many games)
- `PUBLISHERS` → `GAMES` (1 publisher publishes many games)
- `USERS` → `USER_COLLECTION` (1 user has many collection items)
- `USERS` → `WISHLIST` (1 user has many wishlist items)
- `USERS` → `REVIEWS` (1 user writes many reviews)
- `USERS` → `NOTIFICATIONS` (1 user receives many notifications)
- `GAMES` → `RERELEASE_REQUESTS` (1 game has 1 re-release request)
- `GAMES` → `GAME_STATUS_HISTORY` (1 game has many status changes)

### Many-to-Many (N:N)
- `GAMES` ↔ `PLATFORMS` (via `GAMES_PLATFORMS`)
- `GAMES` ↔ `GENRES` (via `GAMES_GENRES`)
- `GAMES` ↔ `AWARDS` (via `GAMES_AWARDS`)
- `GAMES` ↔ `PRESERVATION_SOURCES` (via `GAMES_PRESERVATION`)
- `USERS` ↔ `RERELEASE_REQUESTS` (via `RERELEASE_VOTES`)
- `USERS` ↔ `REVIEWS` (via `REVIEW_LIKES`)

### Self-Referencing
- `DEVELOPERS` → `DEVELOPERS` (acquired_by relationship)
- `PUBLISHERS` → `PUBLISHERS` (acquired_by relationship)
