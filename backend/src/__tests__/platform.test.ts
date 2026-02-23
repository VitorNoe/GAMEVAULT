/**
 * Platform Management & Game-Platform Relationship Tests
 *
 * Unit tests for:
 * - CRUD /api/platforms
 * - GET /api/platforms/:id/games
 * - GET /api/games/:id/platforms
 * - POST /api/games/:id/platforms (set associations)
 * - DELETE /api/games/:id/platforms/:platformId (remove association)
 * - Platform association in game create/update
 */

import { Request, Response } from 'express';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const samplePlatform = {
  id: 1,
  name: 'Super Nintendo',
  slug: 'snes',
  manufacturer: 'Nintendo',
  type: 'console' as const,
  generation: 4,
  release_year: 1990,
  discontinuation_year: 2003,
  logo_url: null,
  primary_color: '#7F7F7F',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  toJSON() { return { ...this, toJSON: undefined }; },
};

const samplePlatform2 = {
  id: 2,
  name: 'PlayStation',
  slug: 'ps1',
  manufacturer: 'Sony',
  type: 'console' as const,
  generation: 5,
  release_year: 1994,
  toJSON() { return { ...this, toJSON: undefined }; },
};

const sampleGame = {
  id: 10,
  title: 'Chrono Trigger',
  slug: 'chrono-trigger',
  toJSON() { return { ...this, toJSON: undefined }; },
};

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockPlatformFindAll = jest.fn();
const mockPlatformFindAndCountAll = jest.fn();
const mockPlatformFindByPk = jest.fn();
const mockPlatformFindOne = jest.fn();
const mockPlatformCreate = jest.fn();

const mockGameFindByPk = jest.fn();
const mockGameFindAndCountAll = jest.fn();

const mockGPCount = jest.fn();
const mockGPFindAll = jest.fn();
const mockGPBulkCreate = jest.fn();
const mockGPDestroy = jest.fn();

jest.mock('../models', () => ({
  Platform: {
    findAll: (...a: any[]) => mockPlatformFindAll(...a),
    findAndCountAll: (...a: any[]) => mockPlatformFindAndCountAll(...a),
    findByPk: (...a: any[]) => mockPlatformFindByPk(...a),
    findOne: (...a: any[]) => mockPlatformFindOne(...a),
    create: (...a: any[]) => mockPlatformCreate(...a),
  },
  Game: {
    findByPk: (...a: any[]) => mockGameFindByPk(...a),
    findAndCountAll: (...a: any[]) => mockGameFindAndCountAll(...a),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  GamePlatform: {
    count: (...a: any[]) => mockGPCount(...a),
    findAll: (...a: any[]) => mockGPFindAll(...a),
    bulkCreate: (...a: any[]) => mockGPBulkCreate(...a),
    destroy: (...a: any[]) => mockGPDestroy(...a),
  },
  Developer: { name: 'Developer' },
  Publisher: { name: 'Publisher' },
  Genre: { name: 'Genre' },
  Award: { name: 'Award' },
  Review: { findAll: jest.fn().mockResolvedValue([]), findOne: jest.fn().mockResolvedValue(null) },
  RereleaseRequest: { name: 'RereleaseRequest' },
  GameGenre: { name: 'GameGenre' },
  GameAward: { name: 'GameAward' },
}));

jest.mock('../config/database', () => ({ __esModule: true, default: {} }));

jest.mock('../utils/cache', () => {
  const store = new Map();
  return {
    catalogCache: {
      get: jest.fn((k: string) => store.get(k)),
      set: jest.fn((k: string, v: any) => store.set(k, v)),
      del: jest.fn((k: string) => store.delete(k)),
      invalidatePrefix: jest.fn((prefix: string) => {
        for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
      }),
      clear: jest.fn(() => store.clear()),
      _store: store,
    },
  };
});

// ─── Import controllers after mocks ────────────────────────────────────────

import {
  getAllPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform,
  getPlatformGames,
  getGamePlatforms,
  setGamePlatforms,
  removeGamePlatform,
} from '../controllers/platformController';
import { catalogCache } from '../utils/cache';

// ─── Helpers ────────────────────────────────────────────────────────────────

function mockReq(overrides: Record<string, any> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
  (catalogCache as any)._store.clear();
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/platforms – getAllPlatforms
// ═══════════════════════════════════════════════════════════════════

describe('GET /api/platforms – getAllPlatforms', () => {
  it('returns paginated platforms', async () => {
    mockPlatformFindAndCountAll.mockResolvedValue({ count: 2, rows: [samplePlatform, samplePlatform2] });

    const req = mockReq({ query: {} });
    const res = mockRes();
    await getAllPlatforms(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.platforms).toHaveLength(2);
    expect(body.data.pagination).toBeDefined();
  });

  it('returns all platforms without pagination when all=true', async () => {
    mockPlatformFindAll.mockResolvedValue([samplePlatform, samplePlatform2]);

    const req = mockReq({ query: { all: 'true' } });
    const res = mockRes();
    await getAllPlatforms(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.platforms).toHaveLength(2);
    expect(body.data.pagination).toBeUndefined();
  });

  it('filters by type', async () => {
    mockPlatformFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const req = mockReq({ query: { type: 'console' } });
    const res = mockRes();
    await getAllPlatforms(req, res);

    const opts = mockPlatformFindAndCountAll.mock.calls[0][0];
    expect(opts.where.type).toBe('console');
  });

  it('supports search by name/manufacturer/slug', async () => {
    mockPlatformFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const req = mockReq({ query: { search: 'nintendo' } });
    const res = mockRes();
    await getAllPlatforms(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/platforms/:id – getPlatformById
// ═══════════════════════════════════════════════════════════════════

describe('GET /api/platforms/:id – getPlatformById', () => {
  it('returns platform with game_count', async () => {
    mockPlatformFindByPk.mockResolvedValue(samplePlatform);
    mockGPCount.mockResolvedValue(15);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    await getPlatformById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.platform.game_count).toBe(15);
  });

  it('returns 404 for non-existent platform', async () => {
    mockPlatformFindByPk.mockResolvedValue(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();
    await getPlatformById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 for invalid ID', async () => {
    const req = mockReq({ params: { id: 'abc' } });
    const res = mockRes();
    await getPlatformById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/platforms – createPlatform
// ═══════════════════════════════════════════════════════════════════

describe('POST /api/platforms – createPlatform', () => {
  it('creates a platform successfully', async () => {
    mockPlatformFindOne.mockResolvedValue(null);
    mockPlatformCreate.mockResolvedValue({ ...samplePlatform, id: 3 });

    const req = mockReq({
      body: { name: 'Nintendo 64', slug: 'n64', type: 'console', manufacturer: 'Nintendo' },
    });
    const res = mockRes();
    await createPlatform(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects duplicate slug', async () => {
    mockPlatformFindOne.mockResolvedValue(samplePlatform);

    const req = mockReq({
      body: { name: 'SNES', slug: 'snes', type: 'console' },
    });
    const res = mockRes();
    await createPlatform(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PUT /api/platforms/:id – updatePlatform
// ═══════════════════════════════════════════════════════════════════

describe('PUT /api/platforms/:id – updatePlatform', () => {
  it('updates platform and invalidates cache', async () => {
    const pMock = { ...samplePlatform, save: jest.fn().mockResolvedValue(undefined) };
    mockPlatformFindByPk.mockResolvedValue(pMock);

    const req = mockReq({ params: { id: '1' }, body: { name: 'Super Famicom' } });
    const res = mockRes();
    await updatePlatform(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(pMock.save).toHaveBeenCalled();
    expect(catalogCache.invalidatePrefix).toHaveBeenCalledWith('catalog:');
  });

  it('returns 404 for missing platform', async () => {
    mockPlatformFindByPk.mockResolvedValue(null);

    const req = mockReq({ params: { id: '999' }, body: {} });
    const res = mockRes();
    await updatePlatform(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DELETE /api/platforms/:id – deletePlatform
// ═══════════════════════════════════════════════════════════════════

describe('DELETE /api/platforms/:id – deletePlatform', () => {
  it('deletes platform with no associations', async () => {
    const pMock = { ...samplePlatform, destroy: jest.fn().mockResolvedValue(undefined) };
    mockPlatformFindByPk.mockResolvedValue(pMock);
    mockGPCount.mockResolvedValue(0);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    await deletePlatform(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(pMock.destroy).toHaveBeenCalled();
  });

  it('returns 409 when platform has associated games', async () => {
    mockPlatformFindByPk.mockResolvedValue(samplePlatform);
    mockGPCount.mockResolvedValue(5);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    await deletePlatform(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.message).toContain('5 associated game(s)');
  });

  it('returns 404 for missing platform', async () => {
    mockPlatformFindByPk.mockResolvedValue(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();
    await deletePlatform(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/platforms/:id/games – getPlatformGames
// ═══════════════════════════════════════════════════════════════════

describe('GET /api/platforms/:id/games – getPlatformGames', () => {
  it('returns games for a platform with release info', async () => {
    mockPlatformFindByPk.mockResolvedValue(samplePlatform);
    const gameRow = {
      id: 10, title: 'Chrono Trigger', slug: 'chrono-trigger',
      toJSON() { return { ...this, toJSON: undefined }; },
    };
    mockGameFindAndCountAll.mockResolvedValue({ count: 1, rows: [gameRow] });
    mockGPFindAll.mockResolvedValue([
      { game_id: 10, platform_id: 1, platform_release_date: '1995-03-11', exclusivity: 'timed' },
    ]);

    const req = mockReq({ params: { id: '1' }, query: {} });
    const res = mockRes();
    await getPlatformGames(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.platform.name).toBe('Super Nintendo');
    expect(body.data.games[0].platform_release_date).toBe('1995-03-11');
    expect(body.data.games[0].exclusivity).toBe('timed');
  });

  it('returns 404 for non-existent platform', async () => {
    mockPlatformFindByPk.mockResolvedValue(null);

    const req = mockReq({ params: { id: '99' }, query: {} });
    const res = mockRes();
    await getPlatformGames(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/games/:id/platforms – getGamePlatforms
// ═══════════════════════════════════════════════════════════════════

describe('GET /api/games/:id/platforms – getGamePlatforms', () => {
  it('returns platforms for a game with release dates', async () => {
    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockGPFindAll.mockResolvedValue([
      {
        platform_release_date: '1995-03-11',
        exclusivity: 'timed',
        platform: samplePlatform,
      },
    ]);

    const req = mockReq({ params: { id: '10' } });
    const res = mockRes();
    await getGamePlatforms(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.platforms[0].name).toBe('Super Nintendo');
    expect(body.data.platforms[0].platform_release_date).toBe('1995-03-11');
    expect(body.data.platforms[0].exclusivity).toBe('timed');
  });

  it('returns 404 for non-existent game', async () => {
    mockGameFindByPk.mockResolvedValue(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();
    await getGamePlatforms(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/games/:id/platforms – setGamePlatforms
// ═══════════════════════════════════════════════════════════════════

describe('POST /api/games/:id/platforms – setGamePlatforms', () => {
  it('replaces all platform associations', async () => {
    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockPlatformFindAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mockGPDestroy.mockResolvedValue(1);
    mockGPBulkCreate.mockResolvedValue([]);
    mockGPFindAll.mockResolvedValue([
      {
        platform_id: 1,
        platform_release_date: '1995-03-11',
        exclusivity: 'timed',
        platform: { toJSON: () => ({ id: 1, name: 'SNES', slug: 'snes', type: 'console' }) },
      },
      {
        platform_id: 2,
        platform_release_date: '1999-11-11',
        exclusivity: 'none',
        platform: { toJSON: () => ({ id: 2, name: 'PS1', slug: 'ps1', type: 'console' }) },
      },
    ]);

    const req = mockReq({
      params: { id: '10' },
      body: {
        platforms: [
          { platform_id: 1, platform_release_date: '1995-03-11', exclusivity: 'timed' },
          { platform_id: 2, platform_release_date: '1999-11-11' },
        ],
      },
    });
    const res = mockRes();
    await setGamePlatforms(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockGPDestroy).toHaveBeenCalled();
    expect(mockGPBulkCreate).toHaveBeenCalled();
    expect(catalogCache.invalidatePrefix).toHaveBeenCalledWith('catalog:');
  });

  it('returns 400 for invalid platform IDs', async () => {
    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockPlatformFindAll.mockResolvedValue([{ id: 1 }]); // only 1 is valid

    const req = mockReq({
      params: { id: '10' },
      body: { platforms: [{ platform_id: 1 }, { platform_id: 999 }] },
    });
    const res = mockRes();
    await setGamePlatforms(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.message).toContain('999');
  });

  it('returns 400 when platforms is not an array', async () => {
    mockGameFindByPk.mockResolvedValue(sampleGame);

    const req = mockReq({
      params: { id: '10' },
      body: { platforms: 'invalid' },
    });
    const res = mockRes();
    await setGamePlatforms(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 for non-existent game', async () => {
    mockGameFindByPk.mockResolvedValue(null);

    const req = mockReq({ params: { id: '999' }, body: { platforms: [] } });
    const res = mockRes();
    await setGamePlatforms(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DELETE /api/games/:id/platforms/:platformId – removeGamePlatform
// ═══════════════════════════════════════════════════════════════════

describe('DELETE /api/games/:id/platforms/:platformId – removeGamePlatform', () => {
  it('removes a single association', async () => {
    mockGPDestroy.mockResolvedValue(1);

    const req = mockReq({ params: { id: '10', platformId: '1' } });
    const res = mockRes();
    await removeGamePlatform(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(catalogCache.invalidatePrefix).toHaveBeenCalledWith('catalog:');
    expect(catalogCache.del).toHaveBeenCalledWith('game:10');
  });

  it('returns 404 when association does not exist', async () => {
    mockGPDestroy.mockResolvedValue(0);

    const req = mockReq({ params: { id: '10', platformId: '99' } });
    const res = mockRes();
    await removeGamePlatform(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 for invalid IDs', async () => {
    const req = mockReq({ params: { id: 'abc', platformId: 'xyz' } });
    const res = mockRes();
    await removeGamePlatform(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
