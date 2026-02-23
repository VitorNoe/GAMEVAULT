/**
 * RAWG Integration Tests
 *
 * Unit tests for:
 * - rawgService: searchRawg, getRawgGameDetail, mapRawgToGameFields, extractCompanies, extractGenres
 * - rawgController: rawgSearch, rawgLookup, rawgImport, rawgSyncOne
 * - rawgSyncJob: syncRawgBatch
 */

import { Response } from 'express';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const sampleRawgSearchResult = {
  id: 3498,
  slug: 'grand-theft-auto-v',
  name: 'Grand Theft Auto V',
  released: '2013-09-17',
  background_image: 'https://media.rawg.io/gta5.jpg',
  metacritic: 92,
  rating: 4.47,
  ratings_count: 6200,
  platforms: [
    { platform: { id: 4, name: 'PC', slug: 'pc' } },
    { platform: { id: 187, name: 'PlayStation 5', slug: 'playstation5' } },
  ],
  genres: [
    { id: 4, name: 'Action', slug: 'action' },
    { id: 3, name: 'Adventure', slug: 'adventure' },
  ],
  short_screenshots: [{ id: 1, image: 'https://sc.jpg' }],
};

const sampleRawgDetail = {
  id: 3498,
  slug: 'grand-theft-auto-v',
  name: 'Grand Theft Auto V',
  name_original: 'Grand Theft Auto V',
  description: '<p>GTA V HTML</p>',
  description_raw: 'GTA V is an action-adventure game.',
  released: '2013-09-17',
  tba: false,
  background_image: 'https://media.rawg.io/gta5.jpg',
  background_image_additional: 'https://media.rawg.io/gta5_banner.jpg',
  metacritic: 92,
  metacritic_url: 'https://metacritic.com/gta5',
  rating: 4.47,
  ratings_count: 6200,
  playtime: 73,
  screenshots_count: 20,
  movies_count: 3,
  esrb_rating: { id: 4, name: 'Mature', slug: 'mature' },
  platforms: [
    {
      platform: { id: 4, name: 'PC', slug: 'pc' },
      released_at: '2015-04-14',
      requirements: { minimum: '...', recommended: '...' },
    },
    {
      platform: { id: 187, name: 'PlayStation 5', slug: 'playstation5' },
      released_at: '2022-03-15',
      requirements: null,
    },
  ],
  developers: [{ id: 10, name: 'Rockstar North', slug: 'rockstar-north', image_background: null }],
  publishers: [{ id: 11, name: 'Rockstar Games', slug: 'rockstar-games', image_background: null }],
  genres: [
    { id: 4, name: 'Action', slug: 'action' },
    { id: 3, name: 'Adventure', slug: 'adventure' },
  ],
  tags: [{ id: 31, name: 'Singleplayer', slug: 'singleplayer' }],
  website: 'https://rockstargames.com/V',
  reddit_url: 'https://reddit.com/r/GTA',
  clip: { clip: 'https://clip.mp4', video: 'https://video.mp4' },
};

const sampleUser = { id: 1, name: 'Admin', email: 'admin@example.com', type: 'admin' };

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Track calls to the mock HTTP client
const mockAxiosGet = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      get: (...args: any[]) => mockAxiosGet(...args),
    }),
  },
}));

// Mock config
jest.mock('../config/app', () => ({
  __esModule: true,
  default: {
    rawgApiKey: 'test-key-123',
    isProduction: false,
    nodeEnv: 'test',
    port: 3000,
    corsOrigin: '*',
    jwt: { secret: 'test', expiresIn: '7d' },
  },
}));

// Mock models
const mockGameFindByPk = jest.fn();
const mockGameFindOne = jest.fn();
const mockGameFindAll = jest.fn();
const mockGameCreate = jest.fn();

jest.mock('../models', () => ({
  Game: {
    findByPk: (...args: any[]) => mockGameFindByPk(...args),
    findOne: (...args: any[]) => mockGameFindOne(...args),
    findAll: (...args: any[]) => mockGameFindAll(...args),
    create: (...args: any[]) => mockGameCreate(...args),
  },
  Developer: {
    findOrCreate: jest.fn().mockResolvedValue([{ id: 10, name: 'Rockstar North', slug: 'rockstar-north' }, true]),
  },
  Publisher: {
    findOrCreate: jest.fn().mockResolvedValue([{ id: 11, name: 'Rockstar Games', slug: 'rockstar-games' }, true]),
  },
  Genre: {
    findOrCreate: jest.fn().mockImplementation(({ defaults }: any) =>
      Promise.resolve([{ id: Math.floor(Math.random() * 100), ...defaults }, true]),
    ),
  },
  Platform: {
    findOne: jest.fn().mockResolvedValue(null),
  },
  GameGenre: {
    bulkCreate: jest.fn().mockResolvedValue([]),
  },
  GamePlatform: {
    bulkCreate: jest.fn().mockResolvedValue([]),
  },
  GameStatusHistory: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
  Notification: {
    bulkCreate: jest.fn().mockResolvedValue([]),
  },
  Wishlist: {
    findAll: jest.fn().mockResolvedValue([]),
  },
  User: { name: 'User' },
}));

jest.mock('../middlewares/auth', () => ({
  AuthenticatedRequest: {},
  authenticate: jest.fn(),
  authorizeAdmin: jest.fn(),
  optionalAuth: jest.fn(),
}));

// ─── Imports (after mocks) ───────────────────────────────────────────────────

import {
  searchRawg,
  getRawgGameDetail,
  mapRawgToGameFields,
  extractCompanies,
  extractGenres,
  rawgCache,
} from '../services/rawgService';
import {
  rawgSearch,
  rawgLookup,
  rawgImport,
  rawgSyncOne,
} from '../controllers/rawgController';
import { syncRawgBatch } from '../jobs/rawgSyncJob';
import { Game, GameStatusHistory, Developer, Publisher, Genre, GameGenre, Platform } from '../models';

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

// ═══════════════════════════════════════════════
// rawgService: mapRawgToGameFields
// ═══════════════════════════════════════════════

describe('rawgService – mapRawgToGameFields', () => {
  test('maps a released game correctly', () => {
    const result = mapRawgToGameFields(sampleRawgDetail as any);
    expect(result.title).toBe('Grand Theft Auto V');
    expect(result.slug).toBe('grand-theft-auto-v');
    expect(result.rawg_id).toBe(3498);
    expect(result.metacritic_score).toBe(92);
    expect(result.release_date).toBe('2013-09-17');
    expect(result.release_year).toBe(2013);
    expect(result.release_status).toBe('released');
    expect(result.age_rating).toBe('Mature');
    expect(result.cover_url).toBe('https://media.rawg.io/gta5.jpg');
    expect(result.banner_url).toBe('https://media.rawg.io/gta5_banner.jpg');
    expect(result.trailer_url).toBe('https://clip.mp4');
    expect(result.description).toBe('GTA V is an action-adventure game.');
  });

  test('maps a TBA game as coming_soon', () => {
    const tbaDetail = { ...sampleRawgDetail, tba: true, released: null };
    const result = mapRawgToGameFields(tbaDetail as any);
    expect(result.release_status).toBe('coming_soon');
  });

  test('maps a future-dated game as coming_soon', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    const futureDetail = { ...sampleRawgDetail, tba: false, released: future.toISOString().split('T')[0] };
    const result = mapRawgToGameFields(futureDetail as any);
    expect(result.release_status).toBe('coming_soon');
  });

  test('handles null esrb_rating', () => {
    const noRating = { ...sampleRawgDetail, esrb_rating: null };
    const result = mapRawgToGameFields(noRating as any);
    expect(result.age_rating).toBeNull();
  });
});

describe('rawgService – extractCompanies', () => {
  test('extracts developers and publishers', () => {
    const result = extractCompanies(sampleRawgDetail as any);
    expect(result.developers).toHaveLength(1);
    expect(result.developers[0].name).toBe('Rockstar North');
    expect(result.publishers).toHaveLength(1);
    expect(result.publishers[0].name).toBe('Rockstar Games');
  });

  test('handles empty arrays', () => {
    const empty = { ...sampleRawgDetail, developers: null, publishers: null };
    const result = extractCompanies(empty as any);
    expect(result.developers).toHaveLength(0);
    expect(result.publishers).toHaveLength(0);
  });
});

describe('rawgService – extractGenres', () => {
  test('extracts genres', () => {
    const result = extractGenres(sampleRawgDetail as any);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Action');
    expect(result[1].slug).toBe('adventure');
  });

  test('handles null genres', () => {
    const noGenres = { ...sampleRawgDetail, genres: null };
    const result = extractGenres(noGenres as any);
    expect(result).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════
// rawgService: searchRawg / getRawgGameDetail with caching
// ═══════════════════════════════════════════════

describe('rawgService – API with caching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rawgCache.clear();
  });

  test('searchRawg calls API and caches result', async () => {
    const apiResponse = { count: 1, next: null, previous: null, results: [sampleRawgSearchResult] };
    mockAxiosGet.mockResolvedValueOnce({ data: apiResponse });

    const result = await searchRawg('GTA V');
    expect(result.count).toBe(1);
    expect(result.results[0].name).toBe('Grand Theft Auto V');
    expect(mockAxiosGet).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const result2 = await searchRawg('GTA V');
    expect(result2.count).toBe(1);
    expect(mockAxiosGet).toHaveBeenCalledTimes(1); // not called again
  });

  test('getRawgGameDetail calls API and caches', async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: sampleRawgDetail });

    const result = await getRawgGameDetail(3498);
    expect(result.name).toBe('Grand Theft Auto V');
    expect(mockAxiosGet).toHaveBeenCalledTimes(1);

    // Cached
    const result2 = await getRawgGameDetail(3498);
    expect(result2.name).toBe('Grand Theft Auto V');
    expect(mockAxiosGet).toHaveBeenCalledTimes(1);
  });

  test('retries on 429 and succeeds', async () => {
    const err429: any = new Error('Rate limited');
    err429.response = { status: 429 };
    const apiResponse = { data: sampleRawgDetail };

    mockAxiosGet
      .mockRejectedValueOnce(err429)
      .mockResolvedValueOnce(apiResponse);

    // clear cache to force API call
    rawgCache.clear();
    const result = await getRawgGameDetail(9999);
    expect(result.name).toBe('Grand Theft Auto V');
    expect(mockAxiosGet).toHaveBeenCalledTimes(2);
  }, 15000);
});

// ═══════════════════════════════════════════════
// rawgController: rawgSearch
// ═══════════════════════════════════════════════

describe('rawgController – rawgSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rawgCache.clear();
  });

  test('returns 400 when q param missing', async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();
    await rawgSearch(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns enriched search results', async () => {
    const apiResponse = { count: 1, next: null, previous: null, results: [sampleRawgSearchResult] };
    mockAxiosGet.mockResolvedValueOnce({ data: apiResponse });
    mockGameFindAll.mockResolvedValueOnce([{ rawg_id: 3498, id: 42, title: 'GTA V' }]);

    const req = mockReq({ query: { q: 'gta', page: '1', page_size: '20' } });
    const res = mockRes();
    await rawgSearch(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.results).toHaveLength(1);
    expect(data.results[0].already_imported).toBe(true);
    expect(data.results[0].local_game_id).toBe(42);
  });

  test('handles API error gracefully', async () => {
    mockAxiosGet.mockRejectedValueOnce(new Error('Network error'));
    const req = mockReq({ query: { q: 'test' } });
    const res = mockRes();
    await rawgSearch(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ═══════════════════════════════════════════════
// rawgController: rawgLookup
// ═══════════════════════════════════════════════

describe('rawgController – rawgLookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rawgCache.clear();
  });

  test('returns 400 for invalid RAWG ID', async () => {
    const req = mockReq({ params: { rawgId: 'abc' } });
    const res = mockRes();
    await rawgLookup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns game detail with mapped fields', async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: sampleRawgDetail });
    mockGameFindOne.mockResolvedValueOnce(null);

    const req = mockReq({ params: { rawgId: '3498' } });
    const res = mockRes();
    await rawgLookup(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.mapped_fields.title).toBe('Grand Theft Auto V');
    expect(data.already_imported).toBe(false);
    expect(data.companies.developers).toHaveLength(1);
    expect(data.genres).toHaveLength(2);
  });

  test('shows already_imported when game exists', async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: sampleRawgDetail });
    mockGameFindOne.mockResolvedValueOnce({ id: 42, title: 'GTA V' });

    const req = mockReq({ params: { rawgId: '3498' } });
    const res = mockRes();
    await rawgLookup(req, res);

    expect(res.json.mock.calls[0][0].data.already_imported).toBe(true);
    expect(res.json.mock.calls[0][0].data.local_game_id).toBe(42);
  });
});

// ═══════════════════════════════════════════════
// rawgController: rawgImport
// ═══════════════════════════════════════════════

describe('rawgController – rawgImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rawgCache.clear();
  });

  test('returns 400 for invalid RAWG ID', async () => {
    const req = mockReq({ params: { rawgId: '0' } });
    const res = mockRes();
    await rawgImport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 409 when game already imported', async () => {
    mockGameFindOne.mockResolvedValueOnce({ id: 42, title: 'GTA V' });

    const req = mockReq({ params: { rawgId: '3498' } });
    const res = mockRes();
    await rawgImport(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toContain('already imported');
  });

  test('imports game successfully with all associations', async () => {
    mockGameFindOne
      .mockResolvedValueOnce(null)   // duplicate rawg_id check
      .mockResolvedValueOnce(null);  // slug uniqueness check
    mockAxiosGet.mockResolvedValueOnce({ data: sampleRawgDetail });

    const createdGame = {
      id: 100,
      title: 'Grand Theft Auto V',
      slug: 'grand-theft-auto-v',
      release_status: 'released',
      availability_status: 'available',
      rawg_id: 3498,
    };
    mockGameCreate.mockResolvedValueOnce(createdGame);
    mockGameFindByPk.mockResolvedValueOnce({
      ...createdGame,
      toJSON: () => createdGame,
    });

    const req = mockReq({ params: { rawgId: '3498' }, body: {} });
    const res = mockRes();
    await rawgImport(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockGameCreate).toHaveBeenCalled();
    expect(GameGenre.bulkCreate).toHaveBeenCalled();
    expect(GameStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        game_id: 100,
        change_reason: expect.stringContaining('RAWG'),
      }),
    );
  });

  test('allows body overrides for title and slug', async () => {
    mockGameFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockAxiosGet.mockResolvedValueOnce({ data: sampleRawgDetail });
    mockGameCreate.mockResolvedValueOnce({
      id: 101, title: 'Custom Title', slug: 'custom-slug',
      release_status: 'released', availability_status: 'available', rawg_id: 3498,
    });
    mockGameFindByPk.mockResolvedValueOnce({
      id: 101, title: 'Custom Title', toJSON: () => ({ id: 101 }),
    });

    const req = mockReq({
      params: { rawgId: '3498' },
      body: { title: 'Custom Title', slug: 'custom-slug' },
    });
    const res = mockRes();
    await rawgImport(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const createArgs = mockGameCreate.mock.calls[0][0];
    expect(createArgs.title).toBe('Custom Title');
    expect(createArgs.slug).toBe('custom-slug');
  });

  test('handles API error gracefully', async () => {
    mockGameFindOne.mockResolvedValueOnce(null);
    mockAxiosGet.mockRejectedValueOnce(new Error('RAWG down'));

    const req = mockReq({ params: { rawgId: '3498' } });
    const res = mockRes();
    await rawgImport(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ═══════════════════════════════════════════════
// rawgController: rawgSyncOne
// ═══════════════════════════════════════════════

describe('rawgController – rawgSyncOne', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rawgCache.clear();
  });

  test('returns 404 when game not found', async () => {
    mockGameFindByPk.mockResolvedValueOnce(null);
    const req = mockReq({ params: { gameId: '999' } });
    const res = mockRes();
    await rawgSyncOne(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when game has no rawg_id', async () => {
    mockGameFindByPk.mockResolvedValueOnce({ id: 1, rawg_id: null });
    const req = mockReq({ params: { gameId: '1' } });
    const res = mockRes();
    await rawgSyncOne(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toContain('no rawg_id');
  });

  test('syncs fields and reports changes', async () => {
    const game = {
      id: 1, rawg_id: 3498, title: 'GTA V',
      metacritic_score: 90, average_rating: 4.0, total_reviews: 5000,
      cover_url: 'old.jpg', banner_url: 'old_banner.jpg', description: 'Old desc',
      release_status: 'released', release_date: '2013-09-17',
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockGameFindByPk.mockResolvedValueOnce(game);
    mockAxiosGet.mockResolvedValueOnce({ data: sampleRawgDetail });

    const req = mockReq({ params: { gameId: '1' } });
    const res = mockRes();
    await rawgSyncOne(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.changes.length).toBeGreaterThan(0);
    expect(game.save).toHaveBeenCalled();
  });

  test('reports no changes when data is identical', async () => {
    const game = {
      id: 1, rawg_id: 3498, title: 'GTA V',
      metacritic_score: 92, average_rating: 4.47, total_reviews: 6200,
      cover_url: 'https://media.rawg.io/gta5.jpg',
      banner_url: 'https://media.rawg.io/gta5_banner.jpg',
      description: 'GTA V is an action-adventure game.',
      release_status: 'released', release_date: '2013-09-17',
      save: jest.fn(),
    };
    mockGameFindByPk.mockResolvedValueOnce(game);
    mockAxiosGet.mockResolvedValueOnce({ data: sampleRawgDetail });

    const req = mockReq({ params: { gameId: '1' } });
    const res = mockRes();
    await rawgSyncOne(req, res);

    expect(res.json.mock.calls[0][0].data.changes).toHaveLength(0);
    expect(res.json.mock.calls[0][0].message).toContain('No changes');
  });
});

// ═══════════════════════════════════════════════
// rawgSyncJob: syncRawgBatch
// ═══════════════════════════════════════════════

describe('rawgSyncJob – syncRawgBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rawgCache.clear();
  });

  test('returns zero counts when no RAWG games exist', async () => {
    mockGameFindAll.mockResolvedValueOnce([]);
    const result = await syncRawgBatch();
    expect(result.total).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.failed).toBe(0);
  });

  test('syncs games and reports updates', async () => {
    const game = {
      id: 1, rawg_id: 3498, title: 'GTA V',
      metacritic_score: 80, average_rating: 4.0, total_reviews: 5000,
      cover_url: 'old.jpg', banner_url: null, description: 'Old',
      release_status: 'released', release_date: '2013-09-17',
      save: jest.fn().mockResolvedValue(undefined),
      changed: jest.fn(),
    };
    mockGameFindAll.mockResolvedValueOnce([game]);
    mockAxiosGet.mockResolvedValueOnce({ data: sampleRawgDetail });

    const result = await syncRawgBatch();
    expect(result.total).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].fields).toContain('metacritic_score');
    expect(game.save).toHaveBeenCalled();
  });

  test('handles API errors and continues', async () => {
    const game1 = {
      id: 1, rawg_id: 100, title: 'Game A',
      metacritic_score: null, average_rating: null, total_reviews: 0,
      cover_url: null, banner_url: null, description: null,
      release_status: 'released', release_date: null,
      save: jest.fn(), changed: jest.fn(),
    };
    const game2 = {
      id: 2, rawg_id: 200, title: 'Game B',
      metacritic_score: 80, average_rating: 4.0, total_reviews: 100,
      cover_url: 'old.jpg', banner_url: null, description: 'Old',
      release_status: 'released', release_date: '2020-01-01',
      save: jest.fn().mockResolvedValue(undefined), changed: jest.fn(),
    };
    mockGameFindAll.mockResolvedValueOnce([game1, game2]);
    mockAxiosGet
      .mockRejectedValueOnce(new Error('Not found'))
      .mockResolvedValueOnce({ data: sampleRawgDetail });

    const result = await syncRawgBatch();
    expect(result.total).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.updated).toBe(1);
  });

  test('stops batch on 429 rate limit', async () => {
    const game1 = {
      id: 1, rawg_id: 100, title: 'G1',
      metacritic_score: null, average_rating: null, total_reviews: 0,
      cover_url: null, banner_url: null, description: null,
      release_status: 'released', release_date: null,
      save: jest.fn(), changed: jest.fn(),
    };
    const game2 = {
      id: 2, rawg_id: 200, title: 'G2',
      metacritic_score: null, average_rating: null, total_reviews: 0,
      cover_url: null, banner_url: null, description: null,
      release_status: 'released', release_date: null,
      save: jest.fn(), changed: jest.fn(),
    };
    mockGameFindAll.mockResolvedValueOnce([game1, game2]);

    const err429: any = new Error('Rate limited');
    err429.response = { status: 429 };
    mockAxiosGet.mockRejectedValue(err429);

    const result = await syncRawgBatch();
    // Should stop after first 429 — not process game2
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toContain('Rate limited');
  }, 30000);
});
