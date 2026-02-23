/**
 * RAWG Periodic Sync Job
 *
 * Runs in the background to keep RAWG-imported games up-to-date.
 *
 * Strategy:
 *  - Sync runs every 6 hours (configurable)
 *  - Processes games in batches to respect RAWG rate limits (~5 req/s)
 *  - Updates: metacritic_score, cover_url, banner_url, average_rating,
 *    total_reviews, description, release_status if newly released
 *  - Logs all changes to GameStatusHistory when release_status changes
 *  - Notifies wishlisted users when a synced game becomes "released"
 */

import { Op } from 'sequelize';
import { Game, GameStatusHistory, Notification, Wishlist } from '../models';
import {
  getRawgGameDetail,
  RawgGameDetail,
} from '../services/rawgService';

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

/** Delay between individual RAWG API calls (ms) – keeps us under 5 req/s */
const REQUEST_DELAY_MS = 250;
/** Batch size per sync run */
const BATCH_SIZE = 50;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// Sync Logic
// ──────────────────────────────────────────────

export interface SyncResult {
  total: number;
  updated: number;
  failed: number;
  changes: Array<{ game_id: number; title: string; fields: string[] }>;
  errors: Array<{ game_id: number; rawg_id: number; error: string }>;
}

/**
 * Sync a batch of RAWG-imported games with their latest RAWG data.
 */
export async function syncRawgBatch(): Promise<SyncResult> {
  const result: SyncResult = {
    total: 0,
    updated: 0,
    failed: 0,
    changes: [],
    errors: [],
  };

  // Find games that have a rawg_id, ordered by oldest updated first
  const games = await Game.findAll({
    where: {
      rawg_id: { [Op.ne]: null as any },
    },
    order: [['updated_at', 'ASC']],
    limit: BATCH_SIZE,
    attributes: [
      'id', 'title', 'rawg_id', 'metacritic_score', 'average_rating',
      'total_reviews', 'cover_url', 'banner_url', 'description',
      'release_status', 'release_date',
    ],
  });

  result.total = games.length;

  for (const game of games) {
    try {
      const detail = await getRawgGameDetail(game.rawg_id!);
      const fieldChanges = applyRawgUpdates(game, detail);

      if (fieldChanges.length > 0) {
        await game.save();
        result.updated++;
        result.changes.push({
          game_id: game.id,
          title: game.title,
          fields: fieldChanges,
        });
      } else {
        // Touch updated_at even if no changes so it cycles to the end of the queue
        game.changed('updated_at', true);
        await game.save();
      }

      // Rate-limit pause
      await sleep(REQUEST_DELAY_MS);
    } catch (err: any) {
      result.failed++;
      result.errors.push({
        game_id: game.id,
        rawg_id: game.rawg_id!,
        error: err.message || 'Unknown error',
      });
      // On rate limit, stop further requests this batch
      if (err.response?.status === 429) {
        console.warn('⚠️ RAWG sync stopped: rate limited (429). Will retry next cycle.');
        break;
      }
      // Otherwise continue with next game
      await sleep(REQUEST_DELAY_MS);
    }
  }

  return result;
}

/**
 * Apply updates from RAWG detail to a local Game model instance.
 * Returns list of changed field names.
 */
function applyRawgUpdates(game: Game, detail: RawgGameDetail): string[] {
  const changes: string[] = [];

  if (detail.metacritic !== null && detail.metacritic !== game.metacritic_score) {
    game.metacritic_score = detail.metacritic;
    changes.push('metacritic_score');
  }
  if (detail.rating && detail.rating !== Number(game.average_rating)) {
    game.average_rating = detail.rating;
    changes.push('average_rating');
  }
  if (detail.ratings_count && detail.ratings_count !== game.total_reviews) {
    game.total_reviews = detail.ratings_count;
    changes.push('total_reviews');
  }
  if (detail.background_image && detail.background_image !== game.cover_url) {
    game.cover_url = detail.background_image;
    changes.push('cover_url');
  }
  if (detail.background_image_additional && detail.background_image_additional !== game.banner_url) {
    game.banner_url = detail.background_image_additional;
    changes.push('banner_url');
  }
  if (detail.description_raw && detail.description_raw !== game.description) {
    game.description = detail.description_raw;
    changes.push('description');
  }

  // Release status: transition to released if RAWG says released
  if (detail.released && !detail.tba) {
    const rd = new Date(detail.released);
    const prevStatus = game.release_status;
    if (rd <= new Date() && prevStatus !== 'released' && prevStatus !== 'cancelled') {
      game.release_status = 'released';
      game.release_date = new Date(detail.released) as any;
      changes.push('release_status');

      // Record history (fire and forget within sync)
      GameStatusHistory.create({
        game_id: game.id,
        previous_release_status: prevStatus,
        new_release_status: 'released',
        change_reason: `RAWG periodic sync: game now released (rawg_id: ${game.rawg_id})`,
      }).catch(e => console.error('Failed to record status history:', e));

      // Notify wishlisted users (fire and forget)
      notifySyncRelease(game.id, game.title).catch(e =>
        console.error('Failed to notify wishlisted users:', e),
      );
    }
  }

  return changes;
}

/**
 * Send release notifications to users who wishlisted a newly-released game.
 */
async function notifySyncRelease(gameId: number, title: string): Promise<void> {
  const wishlistEntries = await Wishlist.findAll({
    where: { game_id: gameId },
    attributes: ['user_id'],
    group: ['user_id'],
    raw: true,
  });

  if (wishlistEntries.length === 0) return;

  const notifications = wishlistEntries.map((w: any) => ({
    user_id: w.user_id,
    notification_type: 'release' as const,
    game_id: gameId,
    title: `🎮 ${title} has been released!`,
    message: `Great news! "${title}" from your wishlist is now available. (Updated via RAWG sync)`,
    is_read: false,
  }));

  await Notification.bulkCreate(notifications);
}

// ──────────────────────────────────────────────
// Timer management
// ──────────────────────────────────────────────

let syncTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start RAWG periodic sync.
 * Default interval: every 6 hours.
 */
export function startRawgSyncJob(intervalMs = 6 * 60 * 60 * 1000): void {
  const runSync = async () => {
    try {
      const result = await syncRawgBatch();
      if (result.total > 0) {
        console.log(
          `🔄 RAWG sync complete: ${result.total} checked, ${result.updated} updated, ${result.failed} failed.`,
        );
        if (result.changes.length > 0) {
          result.changes.forEach(c =>
            console.log(`  📝 ${c.title} (ID ${c.game_id}): ${c.fields.join(', ')}`),
          );
        }
        if (result.errors.length > 0) {
          result.errors.forEach(e =>
            console.warn(`  ⚠️ Game ID ${e.game_id} (RAWG ${e.rawg_id}): ${e.error}`),
          );
        }
      }
    } catch (error) {
      console.error('❌ RAWG sync job error:', error);
    }
  };

  // Delay initial run by 30 seconds to let server start
  setTimeout(runSync, 30_000);

  syncTimer = setInterval(runSync, intervalMs);
  syncTimer.unref();

  console.log('⏱️  RAWG periodic sync job scheduled (every 6h).');
}

/**
 * Stop RAWG sync job (for graceful shutdown or testing).
 */
export function stopRawgSyncJob(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}
