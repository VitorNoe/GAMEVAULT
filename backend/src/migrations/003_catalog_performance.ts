import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration 003: Add catalog performance optimizations.
 *
 * - GIN trigram indexes for ILIKE text search on games.title / games.description
 * - Composite indexes for common filter combinations
 * - Materialized view for games catalog summary (optional, for dashboards)
 */

async function safeAddIndex(qi: QueryInterface, table: string, fields: string[], opts: any): Promise<void> {
  try { await qi.addIndex(table, fields, opts); } catch { /* already exists */ }
}

async function safeExec(qi: QueryInterface, sql: string): Promise<void> {
  try { await qi.sequelize.query(sql); } catch { /* may already exist */ }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const qi = queryInterface;

  // Enable pg_trgm for trigram-based ILIKE search acceleration
  await safeExec(qi, 'CREATE EXTENSION IF NOT EXISTS pg_trgm;');

  // GIN trigram indexes for fast ILIKE search
  await safeExec(qi, `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_title_trgm
    ON games USING GIN (title gin_trgm_ops);
  `);
  await safeExec(qi, `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_description_trgm
    ON games USING GIN (description gin_trgm_ops);
  `);

  // Composite indexes for common filter combinations
  await safeAddIndex(qi, 'games', ['release_status', 'release_year'], {
    name: 'idx_games_status_year',
  });
  await safeAddIndex(qi, 'games', ['availability_status', 'release_year'], {
    name: 'idx_games_avail_year',
  });
  await safeAddIndex(qi, 'games', ['release_date', 'average_rating'], {
    name: 'idx_games_date_rating',
  });
  await safeAddIndex(qi, 'games', ['developer_id', 'release_year'], {
    name: 'idx_games_dev_year',
  });
  await safeAddIndex(qi, 'games', ['publisher_id', 'release_year'], {
    name: 'idx_games_pub_year',
  });

  // Index for review aggregation queries
  await safeAddIndex(qi, 'reviews', ['game_id', 'rating'], {
    name: 'idx_reviews_game_rating',
  });

  // Materialized view: game catalog summary for fast dashboard/listing queries
  await safeExec(qi, `
    CREATE MATERIALIZED VIEW IF NOT EXISTS mv_game_catalog AS
    SELECT
      g.id,
      g.title,
      g.slug,
      g.cover_url,
      g.release_year,
      g.release_date,
      g.release_status,
      g.availability_status,
      g.age_rating,
      g.metacritic_score,
      g.average_rating,
      g.total_reviews,
      g.developer_id,
      g.publisher_id,
      d.name AS developer_name,
      d.slug AS developer_slug,
      p.name AS publisher_name,
      p.slug AS publisher_slug,
      COALESCE(rv.avg_rating, g.average_rating) AS live_avg_rating,
      COALESCE(rv.review_count, g.total_reviews, 0) AS live_review_count,
      COALESCE(rr.total_votes, 0) AS rerelease_votes,
      ARRAY_AGG(DISTINCT plt.slug) FILTER (WHERE plt.slug IS NOT NULL) AS platform_slugs,
      ARRAY_AGG(DISTINCT gen.slug) FILTER (WHERE gen.slug IS NOT NULL) AS genre_slugs
    FROM games g
    LEFT JOIN developers d ON d.id = g.developer_id
    LEFT JOIN publishers p ON p.id = g.publisher_id
    LEFT JOIN (
      SELECT game_id, AVG(rating)::numeric(4,2) AS avg_rating, COUNT(*)::int AS review_count
      FROM reviews GROUP BY game_id
    ) rv ON rv.game_id = g.id
    LEFT JOIN rerelease_requests rr ON rr.game_id = g.id
    LEFT JOIN games_platforms gp ON gp.game_id = g.id
    LEFT JOIN platforms plt ON plt.id = gp.platform_id
    LEFT JOIN games_genres gg ON gg.game_id = g.id
    LEFT JOIN genres gen ON gen.id = gg.genre_id
    GROUP BY g.id, d.name, d.slug, p.name, p.slug, rv.avg_rating, rv.review_count, rr.total_votes;
  `);

  // Unique index on materialized view for REFRESH CONCURRENTLY
  await safeExec(qi, `
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_game_catalog_id ON mv_game_catalog (id);
  `);
  // Additional indexes on materialzied view
  await safeExec(qi, `
    CREATE INDEX IF NOT EXISTS idx_mv_game_catalog_title ON mv_game_catalog (title);
  `);
  await safeExec(qi, `
    CREATE INDEX IF NOT EXISTS idx_mv_game_catalog_rating ON mv_game_catalog (live_avg_rating DESC NULLS LAST);
  `);

  console.log('  ✅ Catalog performance indexes and materialized view created');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const qi = queryInterface;

  await safeExec(qi, 'DROP MATERIALIZED VIEW IF EXISTS mv_game_catalog;');

  const indexesToDrop = [
    'idx_games_title_trgm', 'idx_games_description_trgm',
    'idx_games_status_year', 'idx_games_avail_year',
    'idx_games_date_rating', 'idx_games_dev_year', 'idx_games_pub_year',
    'idx_reviews_game_rating',
  ];
  for (const idx of indexesToDrop) {
    await safeExec(qi, `DROP INDEX IF EXISTS ${idx};`);
  }
}
