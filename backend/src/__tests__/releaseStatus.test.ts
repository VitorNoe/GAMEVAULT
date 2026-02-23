/**
 * Release Status Tests
 *
 * Unit tests for the release status management system:
 * - PUT  /api/games/:id/status         – Change game status (admin)
 * - GET  /api/games/:id/status-history  – Status history per game
 * - GET  /api/games/:id/countdown       – Countdown to release
 * - GET  /api/games/upcoming-countdown  – Upcoming games with countdowns
 * - GET  /api/games/release-timeline    – Global status change timeline
 * - computeCountdown helper
 * - notifyWishlistedUsers helper
 * - Periodic job: autoReleaseGames
 * - Periodic job: notifyImminentReleases
 */

import { Request, Response } from 'express';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeGame = (overrides: Record<string, any> = {}) => ({
  id: 1,
  title: 'Silksong',
  slug: 'silksong',
  description: 'Sequel to Hollow Knight.',
  cover_url: '/covers/silksong.jpg',
  release_date: '2025-12-31',
  release_year: 2025,
  release_status: 'coming_soon',
  availability_status: 'available',
  developer_id: 5,
  save: jest.fn().mockResolvedValue(undefined),
  toJSON: jest.fn().mockImplementation(function (this: any) {
    const { save, toJSON, ...rest } = this;
    return rest;
  }),
  ...overrides,
});

const makeHistoryEntry = (overrides: Record<string, any> = {}) => ({
  id: 10,
  game_id: 1,
  previous_release_status: 'coming_soon',
  new_release_status: 'released',
  previous_availability_status: null,
  new_availability_status: null,
  change_reason: 'Official release',
  changed_by: 1,
  changed_at: '2025-01-15T10:00:00Z',
  ...overrides,
});

const sampleUser = { id: 1, name: 'Admin', email: 'admin@example.com' };

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockGameFindByPk = jest.fn();
const mockGameFindAll = jest.fn();
const mockGameFindAndCountAll = jest.fn();

jest.mock('../models', () => ({
  Game: {
    findByPk: (...args: any[]) => mockGameFindByPk(...args),
    findAll: (...args: any[]) => mockGameFindAll(...args),
    findAndCountAll: (...args: any[]) => mockGameFindAndCountAll(...args),
  },
  GameStatusHistory: {
    create: jest.fn().mockResolvedValue(makeHistoryEntry()),
    findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] }),
    findOne: jest.fn(),
  },
  Notification: {
    bulkCreate: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  },
  Wishlist: {
    findAll: jest.fn().mockResolvedValue([]),
  },
  User: { name: 'User' },
  Platform: { name: 'Platform' },
  Developer: { name: 'Developer' },
  GamePlatform: { name: 'GamePlatform' },
}));

jest.mock('../utils/cache', () => ({
  catalogCache: {
    invalidatePrefix: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('../middlewares/auth', () => ({
  AuthenticatedRequest: {},
  authenticate: jest.fn(),
  authorizeAdmin: jest.fn(),
  optionalAuth: jest.fn(),
}));

jest.mock('../utils/helpers', () => ({
  getPaginationParams: jest.fn().mockReturnValue({ page: 1, limit: 20, offset: 0 }),
  getPaginationResult: jest.fn().mockReturnValue({ page: 1, limit: 20, total: 0, totalPages: 0 }),
  parseId: jest.fn().mockImplementation((val: any) => {
    const n = parseInt(val, 10);
    return isNaN(n) || n <= 0 ? null : n;
  }),
}));

// ─── Imports (after mocks) ───────────────────────────────────────────────────

import {
  changeGameStatus,
  getGameStatusHistory,
  getGameCountdown,
  getUpcomingWithCountdowns,
  getReleaseTimeline,
  computeCountdown,
  notifyWishlistedUsers,
} from '../controllers/releaseStatusController';
import { Game, GameStatusHistory, Notification, Wishlist } from '../models';
import { catalogCache } from '../utils/cache';
import { getPaginationResult } from '../utils/helpers';

// ─── Test helpers ────────────────────────────────────────────────────────────

function mockReq(overrides: Record<string, any> = {}): any {
  return {
    params: {},
    body: {},
    query: {},
    user: sampleUser,
    ...overrides,
  };
}

function mockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

/** Format a Date as YYYY-MM-DD using local components (avoids UTC offset issues in toISOString) */
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════
// computeCountdown helper
// ═══════════════════════════════════════════════

describe('computeCountdown', () => {
  test('returns "Released" for released games', () => {
    const result = computeCountdown('2020-01-01', 'released');
    expect(result.is_released).toBe(true);
    expect(result.countdown_label).toBe('Released');
    expect(result.days_until_release).toBeNull();
  });

  test('returns "TBA" when release date is null', () => {
    const result = computeCountdown(null, 'coming_soon');
    expect(result.is_released).toBe(false);
    expect(result.countdown_label).toBe('TBA');
    expect(result.days_until_release).toBeNull();
  });

  test('returns "Release day!" when date is today', () => {
    const today = localDateStr(new Date());
    const result = computeCountdown(today, 'coming_soon');
    expect(result.countdown_label).toBe('Release day!');
    expect(result.days_until_release).toBe(0);
    expect(result.is_released).toBe(false);
  });

  test('returns "Tomorrow" when 1 day in the future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = computeCountdown(localDateStr(tomorrow), 'coming_soon');
    expect(result.countdown_label).toBe('Tomorrow');
    expect(result.days_until_release).toBe(1);
  });

  test('returns "X days" for 2-7 days', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const result = computeCountdown(localDateStr(future), 'coming_soon');
    expect(result.countdown_label).toBe('5 days');
    expect(result.days_until_release).toBe(5);
  });

  test('returns "X week(s)" for 8-30 days', () => {
    const future = new Date();
    future.setDate(future.getDate() + 14);
    const result = computeCountdown(localDateStr(future), 'coming_soon');
    expect(result.countdown_label).toBe('2 weeks');
  });

  test('returns "X month(s)" for 31-365 days', () => {
    const future = new Date();
    future.setDate(future.getDate() + 90);
    const result = computeCountdown(localDateStr(future), 'coming_soon');
    expect(result.countdown_label).toBe('3 months');
  });

  test('returns "X year(s)" for >365 days', () => {
    const future = new Date();
    future.setDate(future.getDate() + 400);
    const result = computeCountdown(localDateStr(future), 'coming_soon');
    expect(result.countdown_label).toBe('1 year');
  });

  test('returns past date as "Release day!" with 0 days', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    const result = computeCountdown(localDateStr(past), 'coming_soon');
    expect(result.days_until_release).toBe(0);
    expect(result.countdown_label).toBe('Release day!');
  });
});

// ═══════════════════════════════════════════════
// notifyWishlistedUsers helper
// ═══════════════════════════════════════════════

describe('notifyWishlistedUsers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 0 when no users have wishlisted the game', async () => {
    (Wishlist.findAll as jest.Mock).mockResolvedValueOnce([]);
    const count = await notifyWishlistedUsers(1, 'Silksong', 'coming_soon', 'released', 'release_status');
    expect(count).toBe(0);
    expect(Notification.bulkCreate).not.toHaveBeenCalled();
  });

  test('creates notifications for wishlisted users on release', async () => {
    (Wishlist.findAll as jest.Mock).mockResolvedValueOnce([
      { user_id: 10 },
      { user_id: 20 },
    ]);
    const count = await notifyWishlistedUsers(1, 'Silksong', 'coming_soon', 'released', 'release_status');
    expect(count).toBe(2);
    expect(Notification.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: 10,
          notification_type: 'release',
          game_id: 1,
          is_read: false,
        }),
        expect.objectContaining({
          user_id: 20,
          notification_type: 'release',
          game_id: 1,
        }),
      ]),
    );
  });

  test('creates status_change notifications for non-release changes', async () => {
    (Wishlist.findAll as jest.Mock).mockResolvedValueOnce([{ user_id: 5 }]);
    const count = await notifyWishlistedUsers(1, 'Silksong', 'alpha', 'early_access', 'release_status');
    expect(count).toBe(1);
    expect(Notification.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          notification_type: 'status_change',
          user_id: 5,
        }),
      ]),
    );
  });
});

// ═══════════════════════════════════════════════
// PUT /api/games/:id/status
// ═══════════════════════════════════════════════

describe('changeGameStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid game ID', async () => {
    const req = mockReq({ params: { id: 'abc' } });
    const res = mockRes();
    await changeGameStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('returns 404 when game not found', async () => {
    mockGameFindByPk.mockResolvedValueOnce(null);
    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();
    await changeGameStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when neither status is provided', async () => {
    const game = makeGame();
    mockGameFindByPk.mockResolvedValueOnce(game);
    const req = mockReq({ params: { id: '1' }, body: {} });
    const res = mockRes();
    await changeGameStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('At least one'),
    }));
  });

  test('returns 400 for invalid release_status', async () => {
    const game = makeGame();
    mockGameFindByPk.mockResolvedValueOnce(game);
    const req = mockReq({ params: { id: '1' }, body: { release_status: 'banana' } });
    const res = mockRes();
    await changeGameStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Invalid release_status'),
    }));
  });

  test('returns 400 for invalid availability_status', async () => {
    const game = makeGame();
    mockGameFindByPk.mockResolvedValueOnce(game);
    const req = mockReq({
      params: { id: '1' },
      body: { availability_status: 'nope' },
    });
    const res = mockRes();
    await changeGameStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 200 with no change when status is same', async () => {
    const game = makeGame({ release_status: 'released' });
    mockGameFindByPk.mockResolvedValueOnce(game);
    const req = mockReq({
      params: { id: '1' },
      body: { release_status: 'released' },
    });
    const res = mockRes();
    await changeGameStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'No status change detected.',
    }));
    expect(GameStatusHistory.create).not.toHaveBeenCalled();
  });

  test('updates release_status, records history, and sends notifications', async () => {
    const game = makeGame({ release_status: 'coming_soon' });
    mockGameFindByPk.mockResolvedValueOnce(game);
    (Wishlist.findAll as jest.Mock).mockResolvedValueOnce([{ user_id: 7 }]);

    const req = mockReq({
      params: { id: '1' },
      body: { release_status: 'released', reason: 'Official launch' },
    });
    const res = mockRes();
    await changeGameStatus(req, res);

    expect(game.save).toHaveBeenCalled();
    expect(GameStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        game_id: 1,
        changed_by: 1,
        new_release_status: 'released',
        change_reason: 'Official launch',
      }),
    );
    expect(Notification.bulkCreate).toHaveBeenCalled();
    expect((catalogCache as any).invalidatePrefix).toHaveBeenCalledWith('catalog:');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        notifications_sent: 1,
      }),
    }));
  });

  test('updates availability_status independently', async () => {
    const game = makeGame({ availability_status: 'available' });
    mockGameFindByPk.mockResolvedValueOnce(game);
    (Wishlist.findAll as jest.Mock).mockResolvedValueOnce([]);

    const req = mockReq({
      params: { id: '1' },
      body: { availability_status: 'discontinued' },
    });
    const res = mockRes();
    await changeGameStatus(req, res);

    expect(game.save).toHaveBeenCalled();
    expect(GameStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        new_availability_status: 'discontinued',
        previous_availability_status: 'available',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('handles server error gracefully', async () => {
    mockGameFindByPk.mockRejectedValueOnce(new Error('DB down'));
    const req = mockReq({ params: { id: '1' }, body: { release_status: 'released' } });
    const res = mockRes();
    await changeGameStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ═══════════════════════════════════════════════
// GET /api/games/:id/status-history
// ═══════════════════════════════════════════════

describe('getGameStatusHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid ID', async () => {
    const req = mockReq({ params: { id: 'bad' } });
    const res = mockRes();
    await getGameStatusHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when game not found', async () => {
    mockGameFindByPk.mockResolvedValueOnce(null);
    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();
    await getGameStatusHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns paginated history for a game', async () => {
    const game = makeGame();
    mockGameFindByPk.mockResolvedValueOnce(game);
    const historyRows = [makeHistoryEntry()];
    (GameStatusHistory.findAndCountAll as jest.Mock).mockResolvedValueOnce({
      count: 1,
      rows: historyRows,
    });

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    await getGameStatusHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        history: historyRows,
        pagination: expect.any(Object),
      }),
    }));
  });

  test('handles server error gracefully', async () => {
    mockGameFindByPk.mockRejectedValueOnce(new Error('fail'));
    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    await getGameStatusHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ═══════════════════════════════════════════════
// GET /api/games/:id/countdown
// ═══════════════════════════════════════════════

describe('getGameCountdown', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid ID', async () => {
    const req = mockReq({ params: { id: '0' } });
    const res = mockRes();
    await getGameCountdown(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when game not found', async () => {
    mockGameFindByPk.mockResolvedValueOnce(null);
    const req = mockReq({ params: { id: '42' } });
    const res = mockRes();
    await getGameCountdown(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns countdown info for upcoming game', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const game = makeGame({
      release_date: futureDate.toISOString().split('T')[0],
      release_status: 'coming_soon',
    });
    mockGameFindByPk.mockResolvedValueOnce(game);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    await getGameCountdown(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        game: expect.objectContaining({ id: 1 }),
        countdown: expect.objectContaining({
          is_released: false,
          days_until_release: expect.any(Number),
        }),
      }),
    }));
  });

  test('returns released info for released game', async () => {
    const game = makeGame({ release_status: 'released', release_date: '2020-01-01' });
    mockGameFindByPk.mockResolvedValueOnce(game);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    await getGameCountdown(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        countdown: expect.objectContaining({
          is_released: true,
          countdown_label: 'Released',
        }),
      }),
    }));
  });

  test('handles server error gracefully', async () => {
    mockGameFindByPk.mockRejectedValueOnce(new Error('fail'));
    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    await getGameCountdown(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ═══════════════════════════════════════════════
// GET /api/games/upcoming-countdown
// ═══════════════════════════════════════════════

describe('getUpcomingWithCountdowns', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns upcoming games with countdown info', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const games = [
      {
        ...makeGame({ release_date: futureDate.toISOString().split('T')[0] }),
        toJSON() {
          return {
            id: 1,
            title: 'Silksong',
            release_date: futureDate.toISOString().split('T')[0],
            release_status: 'coming_soon',
          };
        },
      },
    ];
    mockGameFindAndCountAll.mockResolvedValueOnce({ count: 1, rows: games });

    const req = mockReq();
    const res = mockRes();
    await getUpcomingWithCountdowns(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.games).toHaveLength(1);
    expect(data.games[0].countdown).toBeDefined();
    expect(data.games[0].countdown.is_released).toBe(false);
  });

  test('returns empty array when no upcoming games', async () => {
    mockGameFindAndCountAll.mockResolvedValueOnce({ count: 0, rows: [] });
    const req = mockReq();
    const res = mockRes();
    await getUpcomingWithCountdowns(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.games).toEqual([]);
  });

  test('handles server error gracefully', async () => {
    mockGameFindAndCountAll.mockRejectedValueOnce(new Error('fail'));
    const req = mockReq();
    const res = mockRes();
    await getUpcomingWithCountdowns(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ═══════════════════════════════════════════════
// GET /api/games/release-timeline
// ═══════════════════════════════════════════════

describe('getReleaseTimeline', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns paginated timeline', async () => {
    const timeline = [makeHistoryEntry()];
    (GameStatusHistory.findAndCountAll as jest.Mock).mockResolvedValueOnce({
      count: 1,
      rows: timeline,
    });

    const req = mockReq();
    const res = mockRes();
    await getReleaseTimeline(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        timeline,
        pagination: expect.any(Object),
      }),
    }));
  });

  test('filters by type=release when query param provided', async () => {
    (GameStatusHistory.findAndCountAll as jest.Mock).mockResolvedValueOnce({
      count: 0,
      rows: [],
    });
    const req = mockReq({ query: { type: 'release' } });
    const res = mockRes();
    await getReleaseTimeline(req, res);

    expect(GameStatusHistory.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          new_release_status: expect.anything(),
        }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('filters by type=availability', async () => {
    (GameStatusHistory.findAndCountAll as jest.Mock).mockResolvedValueOnce({
      count: 0,
      rows: [],
    });
    const req = mockReq({ query: { type: 'availability' } });
    const res = mockRes();
    await getReleaseTimeline(req, res);

    expect(GameStatusHistory.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          new_availability_status: expect.anything(),
        }),
      }),
    );
  });

  test('handles server error gracefully', async () => {
    (GameStatusHistory.findAndCountAll as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const req = mockReq();
    const res = mockRes();
    await getReleaseTimeline(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ═══════════════════════════════════════════════
// Periodic jobs: autoReleaseGames & notifyImminentReleases
// ═══════════════════════════════════════════════

import { autoReleaseGames, notifyImminentReleases } from '../jobs/releaseStatusJobs';

describe('Periodic Jobs', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('autoReleaseGames', () => {
    test('returns {updated: 0, notified: 0} when no games need release', async () => {
      mockGameFindAll.mockResolvedValueOnce([]);
      const result = await autoReleaseGames();
      expect(result).toEqual({ updated: 0, notified: 0 });
    });

    test('auto-releases games and notifies wishlisted users', async () => {
      const game = makeGame({
        release_status: 'coming_soon',
        release_date: localDateStr(new Date()),
      });
      mockGameFindAll.mockResolvedValueOnce([game]);
      (Wishlist.findAll as jest.Mock).mockResolvedValueOnce([{ user_id: 3 }, { user_id: 8 }]);

      const result = await autoReleaseGames();
      expect(result.updated).toBe(1);
      expect(result.notified).toBe(2);
      expect(game.release_status).toBe('released');
      expect(game.save).toHaveBeenCalled();
      expect(GameStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          game_id: 1,
          new_release_status: 'released',
          change_reason: 'Automatic release: release_date reached.',
        }),
      );
      expect(Notification.bulkCreate).toHaveBeenCalled();
    });
  });

  describe('notifyImminentReleases', () => {
    test('returns 0 when no imminent releases', async () => {
      mockGameFindAll.mockResolvedValueOnce([]);
      const result = await notifyImminentReleases(7);
      expect(result).toBe(0);
    });

    test('sends notifications for games releasing within window', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const game = {
        id: 5,
        title: 'GTA VI',
        release_date: localDateStr(futureDate),
      };
      mockGameFindAll.mockResolvedValueOnce([game]);
      (Wishlist.findAll as jest.Mock).mockResolvedValueOnce([{ user_id: 10 }]);
      (Notification.findOne as jest.Mock).mockResolvedValueOnce(null);

      const count = await notifyImminentReleases(7);
      expect(count).toBe(1);
      expect(Notification.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: 10,
            game_id: 5,
            notification_type: 'release',
          }),
        ]),
      );
    });

    test('skips notification if already sent today', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const game = {
        id: 6,
        title: 'Elden Ring 2',
        release_date: localDateStr(futureDate),
      };
      mockGameFindAll.mockResolvedValueOnce([game]);
      (Wishlist.findAll as jest.Mock).mockResolvedValueOnce([{ user_id: 1 }]);
      (Notification.findOne as jest.Mock).mockResolvedValueOnce({ id: 99 }); // already exists

      const count = await notifyImminentReleases(7);
      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });
  });
});
