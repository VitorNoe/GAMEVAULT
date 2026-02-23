import { QueryInterface, DataTypes } from 'sequelize';

/** Migration 002: Create full schema for all core entities (idempotent) */

async function tableExists(qi: QueryInterface, tableName: string): Promise<boolean> {
  try {
    await qi.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
}

async function safeCreateTable(qi: QueryInterface, name: string, cols: Record<string, any>): Promise<void> {
  if (!(await tableExists(qi, name))) {
    await qi.createTable(name, cols);
    console.log(`  ✅ Created table: ${name}`);
  } else {
    console.log(`  ⏭️  Table already exists: ${name}`);
  }
}

async function safeAddIndex(qi: QueryInterface, table: string, fields: string[], opts: any): Promise<void> {
  try { await qi.addIndex(table, fields, opts); } catch { /* already exists */ }
}

async function safeAddColumn(qi: QueryInterface, table: string, column: string, definition: any): Promise<void> {
  const desc = await qi.describeTable(table);
  if (!(desc as any)[column]) {
    await qi.addColumn(table, column, definition);
    console.log(`  ✅ Added column: ${table}.${column}`);
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const qi = queryInterface;

  // ============================================
  // DEVELOPERS TABLE
  // ============================================
  await safeCreateTable(qi, 'developers', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    logo_url: { type: DataTypes.STRING(500), allowNull: true },
    status: { type: DataTypes.ENUM('active', 'closed', 'acquired'), allowNull: false, defaultValue: 'active' },
    acquired_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'developers', key: 'id' }, onDelete: 'SET NULL' },
    foundation_year: { type: DataTypes.INTEGER, allowNull: true },
    closure_year: { type: DataTypes.INTEGER, allowNull: true },
    history: { type: DataTypes.TEXT, allowNull: true },
    website: { type: DataTypes.STRING(500), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'developers', ['slug'], { unique: true, name: 'idx_developers_slug' });
  await safeAddIndex(qi, 'developers', ['status'], { name: 'idx_developers_status' });

  // ============================================
  // PUBLISHERS TABLE
  // ============================================
  await safeCreateTable(qi, 'publishers', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    logo_url: { type: DataTypes.STRING(500), allowNull: true },
    status: { type: DataTypes.ENUM('active', 'closed', 'acquired'), allowNull: false, defaultValue: 'active' },
    acquired_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'publishers', key: 'id' }, onDelete: 'SET NULL' },
    foundation_year: { type: DataTypes.INTEGER, allowNull: true },
    closure_year: { type: DataTypes.INTEGER, allowNull: true },
    website: { type: DataTypes.STRING(500), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'publishers', ['slug'], { unique: true, name: 'idx_publishers_slug' });
  await safeAddIndex(qi, 'publishers', ['status'], { name: 'idx_publishers_status' });

  // ============================================
  // GENRES TABLE
  // ============================================
  await safeCreateTable(qi, 'genres', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
    slug: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    icon: { type: DataTypes.STRING(100), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'genres', ['slug'], { unique: true, name: 'idx_genres_slug' });

  // ============================================
  // AWARDS TABLE
  // ============================================
  await safeCreateTable(qi, 'awards', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING(100), allowNull: false },
    relevance: { type: DataTypes.INTEGER, allowNull: true },
    website: { type: DataTypes.STRING(500), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'awards', ['slug'], { name: 'idx_awards_slug' });
  await safeAddIndex(qi, 'awards', ['year'], { name: 'idx_awards_year' });
  await safeAddIndex(qi, 'awards', ['category'], { name: 'idx_awards_category' });
  await safeAddIndex(qi, 'awards', ['slug', 'year', 'category'], { unique: true, name: 'idx_awards_slug_year_category' });

  // ============================================
  // PRESERVATION SOURCES TABLE
  // ============================================
  await safeCreateTable(qi, 'preservation_sources', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    url: { type: DataTypes.STRING(500), allowNull: false },
    source_type: { type: DataTypes.ENUM('museum', 'archive', 'organization'), allowNull: false },
    logo_url: { type: DataTypes.STRING(500), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'preservation_sources', ['slug'], { unique: true, name: 'idx_preservation_sources_slug' });

  // ============================================
  // USERS: add notification preference columns
  // ============================================
  await safeAddColumn(qi, 'users', 'notification_push', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });
  await safeAddColumn(qi, 'users', 'notification_email', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });
  await safeAddColumn(qi, 'users', 'notification_in_app', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });

  // ============================================
  // GAMES: add FK constraints + indexes
  // ============================================
  try {
    await qi.addConstraint('games', {
      fields: ['developer_id'], type: 'foreign key', name: 'fk_games_developer',
      references: { table: 'developers', field: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE',
    });
  } catch { /* constraint may already exist */ }

  try {
    await qi.addConstraint('games', {
      fields: ['publisher_id'], type: 'foreign key', name: 'fk_games_publisher',
      references: { table: 'publishers', field: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE',
    });
  } catch { /* constraint may already exist */ }

  await safeAddIndex(qi, 'games', ['title'], { name: 'idx_games_title' });
  await safeAddIndex(qi, 'games', ['slug'], { unique: true, name: 'idx_games_slug' });
  await safeAddIndex(qi, 'games', ['developer_id'], { name: 'idx_games_developer' });
  await safeAddIndex(qi, 'games', ['publisher_id'], { name: 'idx_games_publisher' });
  await safeAddIndex(qi, 'games', ['release_status'], { name: 'idx_games_release_status' });
  await safeAddIndex(qi, 'games', ['availability_status'], { name: 'idx_games_availability_status' });
  await safeAddIndex(qi, 'games', ['release_year'], { name: 'idx_games_release_year' });
  await safeAddIndex(qi, 'games', ['release_date'], { name: 'idx_games_release_date' });
  await safeAddIndex(qi, 'games', ['average_rating'], { name: 'idx_games_average_rating' });
  await safeAddIndex(qi, 'games', ['rawg_id'], { name: 'idx_games_rawg_id' });

  await safeAddIndex(qi, 'users', ['email'], { unique: true, name: 'idx_users_email' });
  await safeAddIndex(qi, 'users', ['user_type'], { name: 'idx_users_type' });

  await safeAddIndex(qi, 'platforms', ['slug'], { unique: true, name: 'idx_platforms_slug' });
  await safeAddIndex(qi, 'platforms', ['platform_type'], { name: 'idx_platforms_type' });
  await safeAddIndex(qi, 'platforms', ['generation'], { name: 'idx_platforms_generation' });

  // ============================================
  // WISHLIST TABLE
  // ============================================
  await safeCreateTable(qi, 'wishlist', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    game_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'games', key: 'id' }, onDelete: 'CASCADE' },
    platform_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'platforms', key: 'id' }, onDelete: 'SET NULL' },
    priority: { type: DataTypes.ENUM('high', 'medium', 'low'), allowNull: false, defaultValue: 'medium' },
    max_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'wishlist', ['user_id'], { name: 'idx_wishlist_user' });
  await safeAddIndex(qi, 'wishlist', ['game_id'], { name: 'idx_wishlist_game' });
  await safeAddIndex(qi, 'wishlist', ['priority'], { name: 'idx_wishlist_priority' });
  await safeAddIndex(qi, 'wishlist', ['user_id', 'game_id'], { unique: true, name: 'idx_wishlist_user_game' });

  // ============================================
  // REVIEWS TABLE
  // ============================================
  await safeCreateTable(qi, 'reviews', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    game_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'games', key: 'id' }, onDelete: 'CASCADE' },
    platform_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'platforms', key: 'id' }, onDelete: 'SET NULL' },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: false },
    review_text: { type: DataTypes.TEXT, allowNull: true },
    has_spoilers: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    hours_played: { type: DataTypes.INTEGER, allowNull: true },
    recommends: { type: DataTypes.BOOLEAN, allowNull: true },
    likes_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    dislikes_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'reviews', ['user_id'], { name: 'idx_reviews_user' });
  await safeAddIndex(qi, 'reviews', ['game_id'], { name: 'idx_reviews_game' });
  await safeAddIndex(qi, 'reviews', ['rating'], { name: 'idx_reviews_rating' });
  await safeAddIndex(qi, 'reviews', ['likes_count'], { name: 'idx_reviews_likes' });
  await safeAddIndex(qi, 'reviews', ['user_id', 'game_id'], { unique: true, name: 'idx_reviews_user_game' });

  // ============================================
  // REVIEW LIKES TABLE
  // ============================================
  await safeCreateTable(qi, 'review_likes', {
    review_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: 'reviews', key: 'id' }, onDelete: 'CASCADE' },
    user_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    like_type: { type: DataTypes.ENUM('like', 'dislike'), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'review_likes', ['review_id'], { name: 'idx_review_likes_review' });
  await safeAddIndex(qi, 'review_likes', ['user_id'], { name: 'idx_review_likes_user' });

  // ============================================
  // NOTIFICATIONS TABLE
  // ============================================
  await safeCreateTable(qi, 'notifications', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    notification_type: { type: DataTypes.ENUM('release', 'rerelease', 'update', 'goty', 'review_like', 'status_change', 'milestone'), allowNull: false },
    game_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'games', key: 'id' }, onDelete: 'CASCADE' },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'notifications', ['user_id'], { name: 'idx_notifications_user' });
  await safeAddIndex(qi, 'notifications', ['notification_type'], { name: 'idx_notifications_type' });
  await safeAddIndex(qi, 'notifications', ['is_read'], { name: 'idx_notifications_read' });
  await safeAddIndex(qi, 'notifications', ['created_at'], { name: 'idx_notifications_created' });

  // ============================================
  // RERELEASE REQUESTS TABLE
  // ============================================
  await safeCreateTable(qi, 'rerelease_requests', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    game_id: { type: DataTypes.INTEGER, allowNull: false, unique: true, references: { model: 'games', key: 'id' }, onDelete: 'CASCADE' },
    total_votes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM('active', 'fulfilled', 'archived'), allowNull: false, defaultValue: 'active' },
    fulfilled_date: { type: DataTypes.DATEONLY, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'rerelease_requests', ['game_id'], { unique: true, name: 'idx_rerelease_requests_game' });
  await safeAddIndex(qi, 'rerelease_requests', ['total_votes'], { name: 'idx_rerelease_requests_votes' });
  await safeAddIndex(qi, 'rerelease_requests', ['status'], { name: 'idx_rerelease_requests_status' });

  // ============================================
  // RERELEASE VOTES TABLE
  // ============================================
  await safeCreateTable(qi, 'rerelease_votes', {
    request_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: 'rerelease_requests', key: 'id' }, onDelete: 'CASCADE' },
    user_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    comment: { type: DataTypes.TEXT, allowNull: true },
    vote_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'rerelease_votes', ['request_id'], { name: 'idx_rerelease_votes_request' });
  await safeAddIndex(qi, 'rerelease_votes', ['user_id'], { name: 'idx_rerelease_votes_user' });

  // ============================================
  // GAMES_PLATFORMS (N:N junction)
  // ============================================
  await safeCreateTable(qi, 'games_platforms', {
    game_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: 'games', key: 'id' }, onDelete: 'CASCADE' },
    platform_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: 'platforms', key: 'id' }, onDelete: 'CASCADE' },
    platform_release_date: { type: DataTypes.DATEONLY, allowNull: true },
    exclusivity: { type: DataTypes.ENUM('permanent', 'temporary', 'none'), allowNull: false, defaultValue: 'none' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'games_platforms', ['game_id'], { name: 'idx_games_platforms_game' });
  await safeAddIndex(qi, 'games_platforms', ['platform_id'], { name: 'idx_games_platforms_platform' });
  await safeAddIndex(qi, 'games_platforms', ['exclusivity'], { name: 'idx_games_platforms_exclusivity' });

  // ============================================
  // GAMES_GENRES (N:N junction)
  // ============================================
  await safeCreateTable(qi, 'games_genres', {
    game_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: 'games', key: 'id' }, onDelete: 'CASCADE' },
    genre_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: 'genres', key: 'id' }, onDelete: 'CASCADE' },
  });
  await safeAddIndex(qi, 'games_genres', ['game_id'], { name: 'idx_games_genres_game' });
  await safeAddIndex(qi, 'games_genres', ['genre_id'], { name: 'idx_games_genres_genre' });

  // ============================================
  // GAMES_AWARDS (N:N junction)
  // ============================================
  await safeCreateTable(qi, 'games_awards', {
    game_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: 'games', key: 'id' }, onDelete: 'CASCADE' },
    award_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: 'awards', key: 'id' }, onDelete: 'CASCADE' },
  });
  await safeAddIndex(qi, 'games_awards', ['game_id'], { name: 'idx_games_awards_game' });
  await safeAddIndex(qi, 'games_awards', ['award_id'], { name: 'idx_games_awards_award' });

  // ============================================
  // GAMES_PRESERVATION (N:N junction)
  // ============================================
  await safeCreateTable(qi, 'games_preservation', {
    game_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: 'games', key: 'id' }, onDelete: 'CASCADE' },
    source_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: 'preservation_sources', key: 'id' }, onDelete: 'CASCADE' },
    available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    specific_url: { type: DataTypes.STRING(500), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'games_preservation', ['game_id'], { name: 'idx_games_preservation_game' });
  await safeAddIndex(qi, 'games_preservation', ['source_id'], { name: 'idx_games_preservation_source' });

  // ============================================
  // USER_ACTIVITY TABLE
  // ============================================
  await safeCreateTable(qi, 'user_activity', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    activity_type: { type: DataTypes.STRING(50), allowNull: false },
    entity_type: { type: DataTypes.STRING(50), allowNull: true },
    entity_id: { type: DataTypes.INTEGER, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'user_activity', ['user_id'], { name: 'idx_user_activity_user' });
  await safeAddIndex(qi, 'user_activity', ['activity_type'], { name: 'idx_user_activity_type' });
  await safeAddIndex(qi, 'user_activity', ['created_at'], { name: 'idx_user_activity_created' });

  // ============================================
  // GAME_STATUS_HISTORY TABLE
  // ============================================
  await safeCreateTable(qi, 'game_status_history', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    game_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'games', key: 'id' }, onDelete: 'CASCADE' },
    previous_release_status: { type: DataTypes.ENUM('released', 'early_access', 'open_beta', 'closed_beta', 'alpha', 'coming_soon', 'in_development', 'cancelled'), allowNull: true },
    new_release_status: { type: DataTypes.ENUM('released', 'early_access', 'open_beta', 'closed_beta', 'alpha', 'coming_soon', 'in_development', 'cancelled'), allowNull: true },
    previous_availability_status: { type: DataTypes.ENUM('available', 'out_of_catalog', 'expired_license', 'abandonware', 'public_domain', 'discontinued', 'rereleased'), allowNull: true },
    new_availability_status: { type: DataTypes.ENUM('available', 'out_of_catalog', 'expired_license', 'abandonware', 'public_domain', 'discontinued', 'rereleased'), allowNull: true },
    change_reason: { type: DataTypes.TEXT, allowNull: true },
    changed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(qi, 'game_status_history', ['game_id'], { name: 'idx_game_status_history_game' });
  await safeAddIndex(qi, 'game_status_history', ['changed_at'], { name: 'idx_game_status_history_changed' });

  // ============================================
  // USER_COLLECTION: add missing columns
  // ============================================
  await safeAddColumn(qi, 'user_collection', 'acquisition_date', { type: DataTypes.DATEONLY, allowNull: true });
  await safeAddColumn(qi, 'user_collection', 'price_paid', { type: DataTypes.DECIMAL(10, 2), allowNull: true });

  await safeAddIndex(qi, 'user_collection', ['user_id'], { name: 'idx_user_collection_user' });
  await safeAddIndex(qi, 'user_collection', ['game_id'], { name: 'idx_user_collection_game' });
  await safeAddIndex(qi, 'user_collection', ['platform_id'], { name: 'idx_user_collection_platform' });
  await safeAddIndex(qi, 'user_collection', ['status'], { name: 'idx_user_collection_status' });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Drop tables in reverse dependency order
  const tablesToDrop = [
    'game_status_history', 'user_activity', 'games_preservation', 'games_awards',
    'games_genres', 'games_platforms', 'rerelease_votes', 'rerelease_requests',
    'notifications', 'review_likes', 'reviews', 'wishlist',
    'preservation_sources', 'awards', 'genres', 'publishers', 'developers',
  ];
  for (const table of tablesToDrop) {
    try { await queryInterface.dropTable(table); } catch { /* may not exist */ }
  }

  // Remove added columns from existing tables
  try { await queryInterface.removeColumn('users', 'notification_push'); } catch { /* may not exist */ }
  try { await queryInterface.removeColumn('users', 'notification_email'); } catch { /* may not exist */ }
  try { await queryInterface.removeColumn('users', 'notification_in_app'); } catch { /* may not exist */ }
  try { await queryInterface.removeColumn('user_collection', 'acquisition_date'); } catch { /* may not exist */ }
  try { await queryInterface.removeColumn('user_collection', 'price_paid'); } catch { /* may not exist */ }
}
