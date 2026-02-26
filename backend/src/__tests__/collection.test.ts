/**
 * Collection & Export Controller Tests
 *
 * Unit tests for:
 * - GET    /api/collection           (getCollection)
 * - POST   /api/collection           (addToCollection)
 * - PUT    /api/collection/:id       (updateCollectionItem)
 * - DELETE /api/collection/:id       (removeFromCollection)
 * - GET    /api/collection/status/:gameId (getGameCollectionStatus)
 * - GET    /api/collection/stats     (getCollectionStats)
 * - GET    /api/collection/statistics (getCollectionStatistics)
 * - GET    /api/collection/export    (exportCollection)
 */

import { Response } from 'express';

// ─── Fixtures ──────────────────────────────────────────────────────

const sampleItem = {
  id: 1,
  user_id: 10,
  game_id: 20,
  platform_id: 3,
  format: 'digital',
  status: 'playing',
  acquisition_date: null,
  price_paid: 29.99,
  hours_played: 40,
  personal_notes: null,
  rating: 8,
  created_at: '2024-06-01',
  updated_at: '2024-06-01',
  save: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  toJSON() { return { ...this, save: undefined, destroy: undefined, toJSON: undefined }; },
};

const sampleGame = {
  id: 20,
  title: 'Chrono Trigger',
  slug: 'chrono-trigger',
  cover_url: null,
};

const samplePlatform = { id: 3, name: 'SNES', slug: 'snes' };

// ─── Mocks ──────────────────────────────────────────────────────────

const mockUCFindAndCountAll = jest.fn();
const mockUCFindByPk = jest.fn();
const mockUCFindOne = jest.fn();
const mockUCFindAll = jest.fn();
const mockUCCreate = jest.fn();

const mockGameFindByPk = jest.fn();
const mockPlatformFindByPk = jest.fn();

const mockSequelizeQuery = jest.fn();

jest.mock('../models/UserCollection', () => {
  const mock: any = function () {};
  mock.findAndCountAll = (...a: any[]) => mockUCFindAndCountAll(...a);
  mock.findByPk = (...a: any[]) => mockUCFindByPk(...a);
  mock.findOne = (...a: any[]) => mockUCFindOne(...a);
  mock.findAll = (...a: any[]) => mockUCFindAll(...a);
  mock.create = (...a: any[]) => mockUCCreate(...a);
  return { __esModule: true, default: mock };
});

jest.mock('../models/Game', () => {
  const mock: any = function () {};
  mock.findByPk = (...a: any[]) => mockGameFindByPk(...a);
  return { __esModule: true, default: mock };
});

jest.mock('../models/Platform', () => {
  const mock: any = function () {};
  mock.findByPk = (...a: any[]) => mockPlatformFindByPk(...a);
  return { __esModule: true, default: mock };
});

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: (...a: any[]) => mockSequelizeQuery(...a),
  },
}));

// ─── Import controllers after mocks ────────────────────────────────

import {
  getCollection,
  addToCollection,
  updateCollectionItem,
  removeFromCollection,
  getGameCollectionStatus,
  getCollectionStats,
  getCollectionStatistics,
  exportCollection,
} from '../controllers/collectionController';

// ─── Helpers ────────────────────────────────────────────────────────

function mockReq(overrides: Record<string, any> = {}): any {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    user: { id: 10, email: 'test@example.com', type: 'regular' },
    ...overrides,
  };
}

function mockRes(): Response {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/collection
// ═══════════════════════════════════════════════════════════════════

describe('getCollection', () => {
  it('should return paginated collection items', async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();

    mockUCFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleItem] });

    await getCollection(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          items: expect.any(Array),
          pagination: expect.objectContaining({ total: 1 }),
        }),
      })
    );
  });

  it('should filter by status', async () => {
    const req = mockReq({ query: { status: 'playing' } });
    const res = mockRes();

    mockUCFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getCollection(req, res);

    expect(mockUCFindAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'playing' }),
      })
    );
  });

  it('should return 401 if not authenticated', async () => {
    const req = mockReq({ user: undefined });
    const res = mockRes();

    await getCollection(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/collection
// ═══════════════════════════════════════════════════════════════════

describe('addToCollection', () => {
  it('should add game to collection', async () => {
    const req = mockReq({
      body: { game_id: 20, platform_id: 3, status: 'playing', format: 'digital', price_paid: 29.99 },
    });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockPlatformFindByPk.mockResolvedValue(samplePlatform);
    mockUCFindOne.mockResolvedValue(null);
    mockUCCreate.mockResolvedValue({ id: 1 });
    mockUCFindByPk.mockResolvedValue(sampleItem);

    await addToCollection(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockUCCreate).toHaveBeenCalled();
  });

  it('should return 400 if game_id missing', async () => {
    const req = mockReq({ body: { platform_id: 3 } });
    const res = mockRes();

    await addToCollection(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if platform_id missing', async () => {
    const req = mockReq({ body: { game_id: 20 } });
    const res = mockRes();

    await addToCollection(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 404 if game not found', async () => {
    const req = mockReq({ body: { game_id: 999, platform_id: 3 } });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(null);

    await addToCollection(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 409 if duplicate', async () => {
    const req = mockReq({ body: { game_id: 20, platform_id: 3 } });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockPlatformFindByPk.mockResolvedValue(samplePlatform);
    mockUCFindOne.mockResolvedValue(sampleItem);

    await addToCollection(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PUT /api/collection/:id
// ═══════════════════════════════════════════════════════════════════

describe('updateCollectionItem', () => {
  it('should update collection item', async () => {
    const itemInstance = { ...sampleItem, save: jest.fn().mockResolvedValue(undefined) };
    const req = mockReq({ params: { id: '1' }, body: { status: 'completed', hours_played: 60, rating: 9 } });
    const res = mockRes();

    mockUCFindOne.mockResolvedValue(itemInstance);
    mockUCFindByPk.mockResolvedValue(sampleItem);

    await updateCollectionItem(req, res);

    expect(itemInstance.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 404 if not found', async () => {
    const req = mockReq({ params: { id: '999' }, body: { status: 'completed' } });
    const res = mockRes();

    mockUCFindOne.mockResolvedValue(null);

    await updateCollectionItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 400 for invalid ID', async () => {
    const req = mockReq({ params: { id: 'abc' }, body: {} });
    const res = mockRes();

    await updateCollectionItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DELETE /api/collection/:id
// ═══════════════════════════════════════════════════════════════════

describe('removeFromCollection', () => {
  it('should remove collection item', async () => {
    const itemInstance = { ...sampleItem, destroy: jest.fn().mockResolvedValue(undefined) };
    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    mockUCFindOne.mockResolvedValue(itemInstance);

    await removeFromCollection(req, res);

    expect(itemInstance.destroy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 404 if not found', async () => {
    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    mockUCFindOne.mockResolvedValue(null);

    await removeFromCollection(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/collection/status/:gameId
// ═══════════════════════════════════════════════════════════════════

describe('getGameCollectionStatus', () => {
  it('should return all copies for a game', async () => {
    const req = mockReq({ params: { gameId: '20' } });
    const res = mockRes();

    mockUCFindAll.mockResolvedValue([sampleItem]);

    await getGameCollectionStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ items: expect.any(Array) }),
      })
    );
  });

  it('should return empty when unauthenticated', async () => {
    const req = mockReq({ params: { gameId: '20' }, user: undefined });
    const res = mockRes();

    await getGameCollectionStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ items: [] }),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/collection/stats
// ═══════════════════════════════════════════════════════════════════

describe('getCollectionStats', () => {
  it('should return status distribution', async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();

    mockSequelizeQuery
      .mockResolvedValueOnce([{ status: 'playing', count: '3' }, { status: 'completed', count: '10' }])
      .mockResolvedValueOnce([{ count: '13' }]);

    await getCollectionStats(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          stats: expect.objectContaining({
            total: 13,
            playing: 3,
            completed: 10,
          }),
        }),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/collection/statistics
// ═══════════════════════════════════════════════════════════════════

describe('getCollectionStatistics', () => {
  it('should return comprehensive statistics', async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();

    mockSequelizeQuery
      .mockResolvedValueOnce([{ total: '5', unique_games: '4' }])           // totals
      .mockResolvedValueOnce([{ status: 'completed', count: '3' }, { status: 'playing', count: '2' }]) // status dist
      .mockResolvedValueOnce([{ platform_id: 3, name: 'SNES', count: '5' }]) // platform dist
      .mockResolvedValueOnce([{ genre_id: 1, name: 'RPG', count: '3' }])    // genre dist
      .mockResolvedValueOnce([{ format: 'digital', count: '4' }, { format: 'physical', count: '1' }]) // format dist
      .mockResolvedValueOnce([{ total_value: '150.00', avg_value: '30.00' }]) // value
      .mockResolvedValueOnce([{ total_hours: '200', avg_hours: '40.0', max_hours: '80' }]) // hours
      .mockResolvedValueOnce([{ count: '2' }])                              // recent
      .mockResolvedValueOnce([{ avg_rating: '8.50', rated_count: '3' }]);   // ratings

    await getCollectionStatistics(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = (res.json as jest.Mock).mock.calls[0][0].data;
    expect(data.total_items).toBe(5);
    expect(data.unique_games).toBe(4);
    expect(data.completion_rate).toBe(60); // 3 completed / 5 total
    expect(data.estimated_value.total).toBe(150);
    expect(data.hours_played.total).toBe(200);
    expect(data.platform_distribution).toHaveLength(1);
    expect(data.genre_distribution).toHaveLength(1);
    expect(data.format_distribution.digital).toBe(4);
    expect(data.ratings.average_given).toBe(8.5);
  });

  it('should return 401 if not authenticated', async () => {
    const req = mockReq({ user: undefined });
    const res = mockRes();

    await getCollectionStatistics(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/collection/export
// ═══════════════════════════════════════════════════════════════════

describe('exportCollection', () => {
  it('should export as CSV', async () => {
    const req = mockReq({ query: { format: 'csv' } });
    const res = mockRes();

    mockSequelizeQuery.mockResolvedValue([
      {
        id: 1, game_title: 'Chrono Trigger', platform_name: 'SNES',
        status: 'completed', format: 'digital', acquisition_date: null,
        price_paid: '29.99', hours_played: 40, rating: 9,
        personal_notes: null, created_at: '2024-06-01', updated_at: '2024-06-01',
      },
    ]);

    await exportCollection(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="gamevault_collection.csv"');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
    const csv = (res.send as jest.Mock).mock.calls[0][0];
    expect(csv).toContain('Game');
    expect(csv).toContain('Chrono Trigger');
  });

  it('should export as JSON', async () => {
    const req = mockReq({ query: { format: 'json' } });
    const res = mockRes();

    mockSequelizeQuery.mockResolvedValue([
      {
        id: 1, game_title: 'Chrono Trigger', platform_name: 'SNES',
        status: 'completed', format: 'digital', acquisition_date: null,
        price_paid: '29.99', hours_played: 40, rating: 9,
        personal_notes: null, created_at: '2024-06-01', updated_at: '2024-06-01',
      },
    ]);

    await exportCollection(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        total_items: 1,
        collection: expect.any(Array),
      })
    );
  });

  it('should return 400 for unsupported format', async () => {
    const req = mockReq({ query: { format: 'xml' } });
    const res = mockRes();

    await exportCollection(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 401 if not authenticated', async () => {
    const req = mockReq({ user: undefined, query: {} });
    const res = mockRes();

    await exportCollection(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
