import { Op } from 'sequelize';
import { Game, GameStatusHistory, Notification, Wishlist } from '../models';

/**
 * Periodic job: Auto-release games whose release_date has arrived.
 *
 * Runs on a timer (e.g. every hour). Finds games with:
 *   - release_status in ['coming_soon', 'early_access', 'open_beta', 'closed_beta', 'alpha']
 *   - release_date <= today
 *
 * Transitions them to 'released', records history, and notifies wishlisted users.
 */

export async function autoReleaseGames(): Promise<{ updated: number; notified: number }> {
  const today = new Date().toISOString().split('T')[0];

  const games = await Game.findAll({
    where: {
      release_status: {
        [Op.in]: ['coming_soon', 'early_access', 'open_beta', 'closed_beta', 'alpha'],
      },
      release_date: {
        [Op.lte]: today,
        [Op.ne]: null as any,
      },
    },
  });

  let totalNotified = 0;

  for (const game of games) {
    const prevStatus = game.release_status;

    // Update game status
    game.release_status = 'released';
    await game.save();

    // Record history (system change — no changed_by)
    await GameStatusHistory.create({
      game_id: game.id,
      previous_release_status: prevStatus,
      new_release_status: 'released',
      change_reason: 'Automatic release: release_date reached.',
    });

    // Notify wishlisted users
    const wishlistEntries = await Wishlist.findAll({
      where: { game_id: game.id },
      attributes: ['user_id'],
      group: ['user_id'],
      raw: true,
    });

    if (wishlistEntries.length > 0) {
      const notifications = wishlistEntries.map((w: any) => ({
        user_id: w.user_id,
        notification_type: 'release' as const,
        game_id: game.id,
        title: `🎮 ${game.title} has been released!`,
        message: `Great news! "${game.title}" from your wishlist is now available. The game has been officially released.`,
        is_read: false,
      }));

      await Notification.bulkCreate(notifications);
      totalNotified += notifications.length;
    }

    console.log(`  ✅ Auto-released: "${game.title}" (${prevStatus} → released)`);
  }

  return { updated: games.length, notified: totalNotified };
}

/**
 * Periodic job: Notify users about imminent releases.
 *
 * Sends notifications for games releasing in the next N days
 * that haven't already been notified recently.
 */
export async function notifyImminentReleases(withinDays = 7): Promise<number> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + withinDays);

  const today = now.toISOString().split('T')[0];
  const future = futureDate.toISOString().split('T')[0];

  const games = await Game.findAll({
    where: {
      release_status: { [Op.in]: ['coming_soon', 'early_access'] },
      release_date: {
        [Op.between]: [today, future],
      },
    },
    attributes: ['id', 'title', 'release_date'],
  });

  let totalNotified = 0;

  for (const game of games) {
    const releaseDate = new Date(String(game.release_date));
    const diffMs = releaseDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Find wishlisted users
    const wishlistEntries = await Wishlist.findAll({
      where: { game_id: game.id },
      attributes: ['user_id'],
      group: ['user_id'],
      raw: true,
    });

    if (wishlistEntries.length === 0) continue;

    // Check if we already sent a notification for this game today
    const alreadyNotified = await Notification.findOne({
      where: {
        game_id: game.id,
        notification_type: 'release',
        title: { [Op.like]: '%releasing soon%' },
        created_at: { [Op.gte]: today },
      },
    });

    if (alreadyNotified) continue;

    const daysLabel = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
    const notifications = wishlistEntries.map((w: any) => ({
      user_id: w.user_id,
      notification_type: 'release' as const,
      game_id: game.id,
      title: `⏰ ${game.title} releasing soon!`,
      message: `"${game.title}" from your wishlist is releasing ${daysLabel} (${String(game.release_date)}).`,
      is_read: false,
    }));

    await Notification.bulkCreate(notifications);
    totalNotified += notifications.length;
  }

  return totalNotified;
}

// ──────────────────────────────────────────────
// Timer setup
// ──────────────────────────────────────────────

let autoReleaseTimer: ReturnType<typeof setInterval> | null = null;
let imminentNotifyTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start periodic release status jobs.
 * - Auto-release check: every hour
 * - Imminent release notifications: every 6 hours
 */
export function startReleaseJobs(): void {
  // Run immediately on start, then on interval
  const runAutoRelease = async () => {
    try {
      const result = await autoReleaseGames();
      if (result.updated > 0) {
        console.log(`🔄 Auto-release job: ${result.updated} game(s) released, ${result.notified} notification(s) sent.`);
      }
    } catch (error) {
      console.error('❌ Auto-release job error:', error);
    }
  };

  const runImminentNotify = async () => {
    try {
      const count = await notifyImminentReleases(7);
      if (count > 0) {
        console.log(`📢 Imminent release notifications: ${count} sent.`);
      }
    } catch (error) {
      console.error('❌ Imminent release notification error:', error);
    }
  };

  // Delay initial run by 10 seconds to let server boot
  setTimeout(() => {
    runAutoRelease();
    runImminentNotify();
  }, 10_000);

  // Auto-release: every 1 hour
  autoReleaseTimer = setInterval(runAutoRelease, 60 * 60 * 1000);
  autoReleaseTimer.unref();

  // Imminent notifications: every 6 hours
  imminentNotifyTimer = setInterval(runImminentNotify, 6 * 60 * 60 * 1000);
  imminentNotifyTimer.unref();

  console.log('⏱️  Release status periodic jobs scheduled.');
}

/**
 * Stop periodic jobs (for graceful shutdown or testing).
 */
export function stopReleaseJobs(): void {
  if (autoReleaseTimer) {
    clearInterval(autoReleaseTimer);
    autoReleaseTimer = null;
  }
  if (imminentNotifyTimer) {
    clearInterval(imminentNotifyTimer);
    imminentNotifyTimer = null;
  }
}
