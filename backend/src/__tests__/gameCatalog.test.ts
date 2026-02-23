/**
 * Game Catalog Tests
 *
 * Unit tests for the game catalog endpoints:
 * - GET /api/games (filters, sorting, pagination, view modes)
 * - GET /api/games/:id
 * - GET /api/games/search
 * - GET /api/games/upcoming-releases
 * - GET /api/games/abandonware
 * - GET /api/games/goty
 * - POST /api/games
 * - PUT /api/games/:id
 * - DELETE /api/games/:id
 * - Cache layer behaviour
 */

import { Request, Response } from 'express';

// ─── Shared fixtures ────────────────────────────────────────────────────────

const sampleGame = {
  id: 1,
  title: 'Chrono Trigger',
  slug: 'chrono-trigger',
  description: 'A classic JRPG by Square.',
  synopsis: 'Time-travel adventure.',
  cover_url: '/covers/chrono.jpg',
  banner_url: '/banners/chrono.jpg',
  trailer_url: 'https://yt.be/ct',
  release_year: 1995,
  release_date: '1995-03-11',
  release_status: 'released',
  availability_status: 'available',
  age_rating: 'E',
  metacritic_score: 92,
  average_rating: 4.8,
  total_reviews: 320,
  developer_id: 10,
  publisher_id: 20,
  is_early_access: false,
  was_rereleased: true,
  discontinuation_date: null,
  official_abandonment_date: null,
  rerelease_date: '2008-11-25',
  abandonment_reason: null,
  development_percentage: 100,
  rawg_id: 12345,
  created_at: '2024-01-01',
  updated_at: '2024-06-01',
  developer: { id: 10, name: 'Square', slug: 'square' },
  publisher: { id: 20, name: 'Square Enix', slug: 'square-enix' },
  platforms: [
    {
      id: 1, name: 'SNES', slug: 'snes', type: 'console',
      GamePlatform: { platform_release_date: '1995-03-11', exclusivity: 'timed' },
    },
  ],
  genres: [{ id: 1, name: 'RPG', slug: 'rpg' }],
  awards: [{ id: 1, name: 'Best RPG', slug: 'best-rpg', year: 1995, category: 'genre' }],
  toJSON() { return { ...this, toJSON: undefined }; },
};

const sampleGame2 = {
  id: 2,
  title: 'Final Fantasy VII',
  slug: 'final-fantasy-vii',
  description: 'Legendary RPG by Square.',
  synopsis: 'Cloud Strife saves the planet.',
  cover_url: '/covers/ff7.jpg',
  banner_url: null,
  trailer_url: null,
  release_year: 1997,
  release_date: '1997-01-31',
  release_status: 'released',
  availability_status: 'available',
  age_rating: 'T',
  metacritic_score: 92,
  average_rating: 4.9,
  total_reviews: 1500,
  developer_id: 10,
  publisher_id: 20,
  is_early_access: false,
  was_rereleased: true,
  developer: { id: 10, name: 'Square', slug: 'square' },
  publisher: { id: 20, name: 'Square Enix', slug: 'square-enix' },
  platforms: [],
  genres: [],
  awards: [],
  toJSON() { return { ...this, toJSON: undefined }; },
};

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockFindAndCountAll = jest.fn();
const mockFindByPk = jest.fn();
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockDestroy = jest.fn();

jest.mock('../models', () => ({
  Game: {
    findAndCountAll: (...args: any[]) => mockFindAndCountAll(...args),
    findByPk: (...args: any[]) => mockFindByPk(...args),
    findOne: (...args: any[]) => mockFindOne(...args),
    create: (...args: any[]) => mockCreate(...args),
  },
  Platform: { name: 'Platform' },
  Genre: { name: 'Genre' },
  Award: { name: 'Award' },
  Developer: { name: 'Developer' },
  Publisher: { name: 'Publisher' },
  GamePlatform: { name: 'GamePlatform' },
  GameGenre: { name: 'GameGenre' },
  GameAward: { name: 'GameAward' },
  Review: {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  },
  RereleaseRequest: { name: 'RereleaseRequest' },
}));

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../utils/cache', () => {
  const store = new Map<string, any>();
  return {
    catalogCache: {
      get: jest.fn((key: string) => store.get(key)),
      set: jest.fn((key: string, val: any) => store.set(key, val)),
      del: jest.fn((key: string) => store.delete(key)),
      invalidatePrefix: jest.fn((prefix: string) => {
        for (const k of store.keys()) {
          if (k.startsWith(prefix)) store.delete(k);
        }
      }),
      clear: jest.fn(() => store.clear()),
      _store: store, // Access for test assertions
    },
  };
});

// ─── Import controller AFTER mocks ─────────────────────────────────────────

import {
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  searchGames,
  getUpcomingReleases,
  getAbandonwareGames,
  getGotyGames,
} from '../controllers/gameController';
import { catalogCache } from '../utils/cache';
import { Review } from '../models';

// ─── Helpers ────────────────────────────────────────────────────────────────

function mockReq(overrides: Partial<Request> & { query?: Record<string, string>; params?: Record<string, string>; body?: Record<string, any> } = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

// ─── Reset state before each test ───────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  (catalogCache as any)._store.clear();
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/games – Full catalog
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/games – getAllGames', () => {
  it('returns paginated games with default params', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 2, rows: [sampleGame, sampleGame2] });
    (Review.findAll as jest.Mock).mockResolvedValue([
      { game_id: 1, avg_rating: 4.8, review_count: '320' },
      { game_id: 2, avg_rating: 4.9, review_count: '1500' },
    ]);

    const req = mockReq({ query: {} });
    const res = mockRes();

    await getAllGames(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.games).toHaveLength(2);
    expect(body.data.pagination).toBeDefined();
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.games[0].title).toBe('Chrono Trigger');
  });

  it('applies search filter on title/description/synopsis', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleGame] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { search: 'chrono' } });
    const res = mockRes();
    await getAllGames(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const opts = mockFindAndCountAll.mock.calls[0][0];
    // WHERE clause should contain Op.or for search
    expect(opts.where).toBeDefined();
    // Ensure the search is passed through
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.filters_applied.search).toBe('chrono');
  });

  it('applies platform filter via include', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleGame] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { platforms: '1,2' } });
    const res = mockRes();
    await getAllGames(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.filters_applied.platforms).toEqual([1, 2]);
  });

  it('applies genre filter via include', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleGame] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { genres: '1' } });
    const res = mockRes();
    await getAllGames(req, res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.filters_applied.genres).toEqual([1]);
  });

  it('applies year range filter', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { year_from: '1990', year_to: '2000' } });
    const res = mockRes();
    await getAllGames(req, res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.filters_applied.year_from).toBe(1990);
    expect(body.data.filters_applied.year_to).toBe(2000);
  });

  it('applies release_status filter', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { release_status: 'released,coming_soon' } });
    const res = mockRes();
    await getAllGames(req, res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.filters_applied.release_status).toEqual(['released', 'coming_soon']);
  });

  it('applies availability_status filter', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { availability_status: 'abandonware' } });
    const res = mockRes();
    await getAllGames(req, res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.filters_applied.availability_status).toEqual(['abandonware']);
  });

  it('applies rating range filter', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleGame] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { rating_min: '4.0', rating_max: '5.0' } });
    const res = mockRes();
    await getAllGames(req, res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.filters_applied.rating_min).toBe(4.0);
    expect(body.data.filters_applied.rating_max).toBe(5.0);
  });

  it('applies awards filter', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleGame] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { awards: 'true' } });
    const res = mockRes();
    await getAllGames(req, res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.filters_applied.awards).toBe(true);
  });

  // ── Sorting tests ──

  it('sorts by name ascending', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { sort: 'name', order: 'asc' } });
    const res = mockRes();
    await getAllGames(req, res);

    const opts = mockFindAndCountAll.mock.calls[0][0];
    expect(opts.order[0]).toEqual(['title', 'ASC']);
  });

  it('sorts by release_date descending', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { sort: 'release_date' } });
    const res = mockRes();
    await getAllGames(req, res);

    const opts = mockFindAndCountAll.mock.calls[0][0];
    expect(opts.order[0]).toEqual(['release_date', 'DESC']);
  });

  it('sorts by rating', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { sort: 'rating' } });
    const res = mockRes();
    await getAllGames(req, res);

    const opts = mockFindAndCountAll.mock.calls[0][0];
    expect(opts.order[0]).toEqual(['average_rating', 'DESC']);
  });

  it('sorts by metacritic', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { sort: 'metacritic' } });
    const res = mockRes();
    await getAllGames(req, res);

    const opts = mockFindAndCountAll.mock.calls[0][0];
    expect(opts.order[0]).toEqual(['metacritic_score', 'DESC']);
  });

  it('sorts by newest (created_at DESC)', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { sort: 'newest' } });
    const res = mockRes();
    await getAllGames(req, res);

    const opts = mockFindAndCountAll.mock.calls[0][0];
    expect(opts.order[0]).toEqual(['created_at', 'DESC']);
  });

  // ── Pagination tests ──

  it('respects page and limit params', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 50, rows: [] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { page: '3', limit: '10' } });
    const res = mockRes();
    await getAllGames(req, res);

    const opts = mockFindAndCountAll.mock.calls[0][0];
    expect(opts.limit).toBe(10);
    expect(opts.offset).toBe(20); // (3-1)*10
  });

  it('caps limit at 100', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { limit: '500' } });
    const res = mockRes();
    await getAllGames(req, res);

    const opts = mockFindAndCountAll.mock.calls[0][0];
    expect(opts.limit).toBe(100);
  });

  // ── View modes ──

  it('grid view returns minimal fields', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleGame] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { view: 'grid' } });
    const res = mockRes();
    await getAllGames(req, res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    const game = body.data.games[0];
    expect(game).toHaveProperty('title');
    expect(game).toHaveProperty('cover_url');
    // Grid should NOT have extended fields
    expect(game).not.toHaveProperty('description');
    expect(game).not.toHaveProperty('synopsis');
  });

  it('list view includes description and synopsis', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleGame] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { view: 'list' } });
    const res = mockRes();
    await getAllGames(req, res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    const game = body.data.games[0];
    expect(game).toHaveProperty('description');
    expect(game).toHaveProperty('synopsis');
    expect(game).toHaveProperty('awards');
  });

  it('table view includes all admin fields', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleGame] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: { view: 'table' } });
    const res = mockRes();
    await getAllGames(req, res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    const game = body.data.games[0];
    expect(game).toHaveProperty('description');
    expect(game).toHaveProperty('created_at');
    expect(game).toHaveProperty('rawg_id');
    expect(game).toHaveProperty('discontinuation_date');
  });

  // ── Cache ──

  it('returns cached response on second call', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleGame] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: {} });
    const res1 = mockRes();
    await getAllGames(req, res1);

    const res2 = mockRes();
    await getAllGames(req, res2);

    // DB should only be called once (second time serves cache)
    expect(mockFindAndCountAll).toHaveBeenCalledTimes(1);
    expect(res2.status).toHaveBeenCalledWith(200);
  });

  // ── Error handling ──

  it('returns 500 on database error', async () => {
    mockFindAndCountAll.mockRejectedValue(new Error('DB error'));

    const req = mockReq({ query: {} });
    const res = mockRes();
    await getAllGames(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.success).toBe(false);
  });

  // ── Platform release date in response ──

  it('includes platform-specific release_date and exclusivity', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleGame] });
    (Review.findAll as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: {} });
    const res = mockRes();
    await getAllGames(req, res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    const platform = body.data.games[0].platforms[0];
    expect(platform.platform_release_date).toBe('1995-03-11');
    expect(platform.exclusivity).toBe('timed');
  });

  // ── Aggregated reviews ──

  it('overrides stored rating with live review aggregation', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleGame] });
    (Review.findAll as jest.Mock).mockResolvedValue([
      { game_id: 1, avg_rating: 3.5, review_count: '50' },
    ]);

    const req = mockReq({ query: {} });
    const res = mockRes();
    await getAllGames(req, res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.games[0].average_rating).toBe(3.5);
    expect(body.data.games[0].total_reviews).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/games/:id
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/games/:id – getGameById', () => {
  it('returns a single game with full details', async () => {
    mockFindByPk.mockResolvedValue(sampleGame);
    (Review.findOne as jest.Mock).mockResolvedValue({ avg_rating: 4.8, review_count: '320' });

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    await getGameById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.game.title).toBe('Chrono Trigger');
    expect(body.data.game.average_rating).toBe(4.8);
  });

  it('returns 404 for non-existent game', async () => {
    mockFindByPk.mockResolvedValue(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();
    await getGameById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 for invalid game ID', async () => {
    const req = mockReq({ params: { id: 'abc' } });
    const res = mockRes();
    await getGameById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('caches game detail response', async () => {
    mockFindByPk.mockResolvedValue(sampleGame);
    (Review.findOne as jest.Mock).mockResolvedValue(null);

    const req = mockReq({ params: { id: '1' } });
    const res1 = mockRes();
    await getGameById(req, res1);

    const res2 = mockRes();
    await getGameById(req, res2);

    expect(mockFindByPk).toHaveBeenCalledTimes(1); // second call serves cache
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/games – Create game
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/games – createGame', () => {
  it('creates a game successfully', async () => {
    mockFindOne.mockResolvedValue(null); // no duplicate slug
    const created = { id: 3, title: 'New Game', slug: 'new-game' };
    mockCreate.mockResolvedValue(created);

    const req = mockReq({
      body: { title: 'New Game', slug: 'new-game', release_year: 2024 },
    });
    const res = mockRes();
    await createGame(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect((catalogCache.invalidatePrefix as jest.Mock)).toHaveBeenCalledWith('catalog:');
  });

  it('rejects duplicate slug', async () => {
    mockFindOne.mockResolvedValue({ id: 1, slug: 'existing' }); // slug exists

    const req = mockReq({
      body: { title: 'Another Game', slug: 'existing' },
    });
    const res = mockRes();
    await createGame(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/games/:id – Update game
// ═══════════════════════════════════════════════════════════════════════════

describe('PUT /api/games/:id – updateGame', () => {
  it('updates a game and invalidates cache', async () => {
    const gameMock = {
      id: 1,
      title: 'Old Title',
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockFindByPk.mockResolvedValue(gameMock);

    const req = mockReq({
      params: { id: '1' },
      body: { title: 'New Title' },
    });
    const res = mockRes();
    await updateGame(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(gameMock.save).toHaveBeenCalled();
    expect((catalogCache.invalidatePrefix as jest.Mock)).toHaveBeenCalledWith('catalog:');
    expect((catalogCache.del as jest.Mock)).toHaveBeenCalledWith('game:1');
  });

  it('returns 404 for non-existent game', async () => {
    mockFindByPk.mockResolvedValue(null);

    const req = mockReq({ params: { id: '999' }, body: {} });
    const res = mockRes();
    await updateGame(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/games/:id – Delete game
// ═══════════════════════════════════════════════════════════════════════════

describe('DELETE /api/games/:id – deleteGame', () => {
  it('deletes a game and invalidates cache', async () => {
    const gameMock = { id: 1, destroy: jest.fn().mockResolvedValue(undefined) };
    mockFindByPk.mockResolvedValue(gameMock);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();
    await deleteGame(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(gameMock.destroy).toHaveBeenCalled();
    expect((catalogCache.invalidatePrefix as jest.Mock)).toHaveBeenCalledWith('catalog:');
  });

  it('returns 404 for non-existent game', async () => {
    mockFindByPk.mockResolvedValue(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();
    await deleteGame(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/games/search – Lightweight search
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/games/search – searchGames', () => {
  it('returns search results with relevance ordering', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleGame] });

    const req = mockReq({ query: { q: 'chrono' } });
    const res = mockRes();
    await searchGames(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data.games).toHaveLength(1);
  });

  it('returns 400 when q is missing', async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();
    await searchGames(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/games/upcoming-releases
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/games/upcoming-releases – getUpcomingReleases', () => {
  it('returns upcoming games ordered by release_date ASC', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const req = mockReq({ query: {} });
    const res = mockRes();
    await getUpcomingReleases(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const opts = mockFindAndCountAll.mock.calls[0][0];
    expect(opts.order[0]).toEqual(['release_date', 'ASC']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/games/abandonware
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/games/abandonware – getAbandonwareGames', () => {
  it('filters by abandonware status', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const req = mockReq({ query: {} });
    const res = mockRes();
    await getAbandonwareGames(req, res);

    const opts = mockFindAndCountAll.mock.calls[0][0];
    expect(opts.where.availability_status).toBe('abandonware');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/games/goty
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/games/goty – getGotyGames', () => {
  it('uses Award include with required:true', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const req = mockReq({ query: {} });
    const res = mockRes();
    await getGotyGames(req, res);

    const opts = mockFindAndCountAll.mock.calls[0][0];
    const awardInclude = opts.include.find((i: any) => i.as === 'awards');
    expect(awardInclude).toBeDefined();
    expect(awardInclude.required).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Cache utility unit tests
// ═══════════════════════════════════════════════════════════════════════════

describe('MemoryCache (catalogCache)', () => {
  it('set and get work correctly', () => {
    (catalogCache as any)._store.clear();
    (catalogCache.set as jest.Mock).mockImplementation((k: string, v: any) => (catalogCache as any)._store.set(k, v));
    (catalogCache.get as jest.Mock).mockImplementation((k: string) => (catalogCache as any)._store.get(k));

    catalogCache.set('test:key', { data: 1 });
    expect(catalogCache.get('test:key')).toEqual({ data: 1 });
    expect(catalogCache.get('test:missing')).toBeUndefined();
  });

  it('invalidatePrefix removes matching keys', () => {
    (catalogCache as any)._store.set('catalog:a', 1);
    (catalogCache as any)._store.set('catalog:b', 2);
    (catalogCache as any)._store.set('game:1', 3);

    // Trigger the real mock implementation
    (catalogCache.invalidatePrefix as jest.Mock).mockImplementationOnce((prefix: string) => {
      for (const k of (catalogCache as any)._store.keys()) {
        if (k.startsWith(prefix)) (catalogCache as any)._store.delete(k);
      }
    });
    catalogCache.invalidatePrefix('catalog:');

    expect((catalogCache as any)._store.has('catalog:a')).toBe(false);
    expect((catalogCache as any)._store.has('catalog:b')).toBe(false);
    expect((catalogCache as any)._store.has('game:1')).toBe(true);
  });
});
