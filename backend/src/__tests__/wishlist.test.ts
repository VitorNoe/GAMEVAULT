/**
 * Wishlist Controller Tests
 *
 * Unit tests for:
 * - GET    /api/wishlist              (getWishlist)
 * - POST   /api/wishlist              (addToWishlist)
 * - PUT    /api/wishlist/:id          (updateWishlistItem)
 * - DELETE /api/wishlist/:id          (removeFromWishlist)
 * - GET    /api/wishlist/:id          (getWishlistItem)
 * - GET    /api/wishlist/check/:gameId (checkWishlistStatus)
 * - POST   /api/wishlist/admin/check-releases (triggerWishlistCheck)
 * - GET    /api/wishlist/export       (exportWishlist)
 */

import { Response } from 'express';

// ─── Fixtures ──────────────────────────────────────────────────────

const sampleWishlistItem = {
  id: 1,
  user_id: 10,
  game_id: 20,
  platform_id: 3,
  priority: 'high',
  max_price: 39.99,
  notes: 'Want this!',
  created_at: '2024-06-01',
  save: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  toJSON() { return { ...this, save: undefined, destroy: undefined, toJSON: undefined }; },
};

const sampleGame = {
  id: 20,
  title: 'Chrono Trigger',
  slug: 'chrono-trigger',
  cover_url: null,
  release_status: 'released',
};

const samplePlatform = { id: 3, name: 'SNES', slug: 'snes' };

// ─── Mocks ──────────────────────────────────────────────────────────

const mockWLFindAndCountAll = jest.fn();
const mockWLFindByPk = jest.fn();
const mockWLFindOne = jest.fn();
const mockWLCreate = jest.fn();

const mockGameFindByPk = jest.fn();
const mockPlatformFindByPk = jest.fn();
const mockNotificationCreate = jest.fn();
const mockSequelizeQuery = jest.fn();

jest.mock('../models/Wishlist', () => {
  const mock: any = function () {};
  mock.findAndCountAll = (...a: any[]) => mockWLFindAndCountAll(...a);
  mock.findByPk = (...a: any[]) => mockWLFindByPk(...a);
  mock.findOne = (...a: any[]) => mockWLFindOne(...a);
  mock.create = (...a: any[]) => mockWLCreate(...a);
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

jest.mock('../models/Notification', () => {
  const mock: any = function () {};
  mock.create = (...a: any[]) => mockNotificationCreate(...a);
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
  getWishlist,
  addToWishlist,
  updateWishlistItem,
  removeFromWishlist,
  getWishlistItem,
  checkWishlistStatus,
  triggerWishlistCheck,
  exportWishlist,
  checkWishlistReleases,
} from '../controllers/wishlistController';

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
// GET /api/wishlist
// ═══════════════════════════════════════════════════════════════════

describe('getWishlist', () => {
  it('should return paginated wishlist items', async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();

    mockWLFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleWishlistItem] });

    await getWishlist(req, res);

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

  it('should filter by priority', async () => {
    const req = mockReq({ query: { priority: 'high' } });
    const res = mockRes();

    mockWLFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getWishlist(req, res);

    expect(mockWLFindAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ priority: 'high' }),
      })
    );
  });

  it('should return 401 if not authenticated', async () => {
    const req = mockReq({ user: undefined });
    const res = mockRes();

    await getWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/wishlist
// ═══════════════════════════════════════════════════════════════════

describe('addToWishlist', () => {
  it('should add game to wishlist', async () => {
    const req = mockReq({
      body: { game_id: 20, platform_id: 3, priority: 'high', max_price: 39.99, notes: 'Want!' },
    });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockPlatformFindByPk.mockResolvedValue(samplePlatform);
    mockWLFindOne.mockResolvedValue(null);
    mockWLCreate.mockResolvedValue({ id: 1 });
    mockWLFindByPk.mockResolvedValue(sampleWishlistItem);

    await addToWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockWLCreate).toHaveBeenCalled();
  });

  it('should return 400 if game_id missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await addToWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 404 if game not found', async () => {
    const req = mockReq({ body: { game_id: 999 } });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(null);

    await addToWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 404 if platform not found', async () => {
    const req = mockReq({ body: { game_id: 20, platform_id: 999 } });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockPlatformFindByPk.mockResolvedValue(null);

    await addToWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 409 if duplicate', async () => {
    const req = mockReq({ body: { game_id: 20 } });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockWLFindOne.mockResolvedValue(sampleWishlistItem);

    await addToWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PUT /api/wishlist/:id
// ═══════════════════════════════════════════════════════════════════

describe('updateWishlistItem', () => {
  it('should update wishlist item', async () => {
    const itemInstance = { ...sampleWishlistItem, save: jest.fn().mockResolvedValue(undefined) };
    const req = mockReq({ params: { id: '1' }, body: { priority: 'low', max_price: 19.99 } });
    const res = mockRes();

    mockWLFindOne.mockResolvedValue(itemInstance);
    mockWLFindByPk.mockResolvedValue(sampleWishlistItem);

    await updateWishlistItem(req, res);

    expect(itemInstance.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(itemInstance.priority).toBe('low');
    expect(itemInstance.max_price).toBe(19.99);
  });

  it('should return 404 if not found', async () => {
    const req = mockReq({ params: { id: '999' }, body: { priority: 'low' } });
    const res = mockRes();

    mockWLFindOne.mockResolvedValue(null);

    await updateWishlistItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 400 for invalid ID', async () => {
    const req = mockReq({ params: { id: 'abc' }, body: {} });
    const res = mockRes();

    await updateWishlistItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 404 if platform_id is invalid', async () => {
    const itemInstance = { ...sampleWishlistItem, save: jest.fn() };
    const req = mockReq({ params: { id: '1' }, body: { platform_id: 999 } });
    const res = mockRes();

    mockWLFindOne.mockResolvedValue(itemInstance);
    mockPlatformFindByPk.mockResolvedValue(null);

    await updateWishlistItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Platform not found' })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// DELETE /api/wishlist/:id
// ═══════════════════════════════════════════════════════════════════

describe('removeFromWishlist', () => {
  it('should remove wishlist item', async () => {
    const itemInstance = { ...sampleWishlistItem, destroy: jest.fn().mockResolvedValue(undefined) };
    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    mockWLFindOne.mockResolvedValue(itemInstance);

    await removeFromWishlist(req, res);

    expect(itemInstance.destroy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 404 if not found', async () => {
    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    mockWLFindOne.mockResolvedValue(null);

    await removeFromWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/wishlist/:id
// ═══════════════════════════════════════════════════════════════════

describe('getWishlistItem', () => {
  it('should return a wishlist item with game details', async () => {
    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    mockWLFindOne.mockResolvedValue(sampleWishlistItem);

    await getWishlistItem(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: sampleWishlistItem })
    );
  });

  it('should return 404 if not found', async () => {
    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    mockWLFindOne.mockResolvedValue(null);

    await getWishlistItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/wishlist/check/:gameId
// ═══════════════════════════════════════════════════════════════════

describe('checkWishlistStatus', () => {
  it('should return true if game is in wishlist', async () => {
    const req = mockReq({ params: { gameId: '20' } });
    const res = mockRes();

    mockWLFindOne.mockResolvedValue(sampleWishlistItem);

    await checkWishlistStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ in_wishlist: true }),
      })
    );
  });

  it('should return false if game is not in wishlist', async () => {
    const req = mockReq({ params: { gameId: '99' } });
    const res = mockRes();

    mockWLFindOne.mockResolvedValue(null);

    await checkWishlistStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ in_wishlist: false }),
      })
    );
  });

  it('should return false when unauthenticated', async () => {
    const req = mockReq({ params: { gameId: '20' }, user: undefined });
    const res = mockRes();

    await checkWishlistStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ in_wishlist: false }),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// Wishlist release notifications
// ═══════════════════════════════════════════════════════════════════

describe('checkWishlistReleases', () => {
  it('should notify users about newly released wishlist games', async () => {
    mockSequelizeQuery.mockResolvedValue([
      { wishlist_id: 1, user_id: 10, game_id: 20, game_title: 'Chrono Trigger' },
    ]);
    mockNotificationCreate.mockResolvedValue({});

    const result = await checkWishlistReleases();

    expect(result.notified).toBe(1);
    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        notification_type: 'release',
        title: 'Wishlist game released!',
      })
    );
  });

  it('should return 0 when no games released', async () => {
    mockSequelizeQuery.mockResolvedValue([]);

    const result = await checkWishlistReleases();

    expect(result.notified).toBe(0);
    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });
});

describe('triggerWishlistCheck', () => {
  it('should trigger check and return result', async () => {
    const req = mockReq({ user: { id: 1, email: 'admin@test.com', type: 'admin' } });
    const res = mockRes();

    mockSequelizeQuery.mockResolvedValue([]);

    await triggerWishlistCheck(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ notified: 0 }),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/wishlist/export
// ═══════════════════════════════════════════════════════════════════

describe('exportWishlist', () => {
  it('should export as CSV', async () => {
    const req = mockReq({ query: { format: 'csv' } });
    const res = mockRes();

    mockSequelizeQuery.mockResolvedValue([
      {
        id: 1, game_title: 'Chrono Trigger', platform_name: 'SNES',
        priority: 'high', max_price: '39.99', notes: 'Want this!',
        release_status: 'released', release_date: '1995-03-11', created_at: '2024-06-01',
      },
    ]);

    await exportWishlist(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.status).toHaveBeenCalledWith(200);
    const csv = (res.send as jest.Mock).mock.calls[0][0];
    expect(csv).toContain('Chrono Trigger');
    expect(csv).toContain('Priority');
  });

  it('should export as JSON', async () => {
    const req = mockReq({ query: { format: 'json' } });
    const res = mockRes();

    mockSequelizeQuery.mockResolvedValue([
      {
        id: 1, game_title: 'Chrono Trigger', platform_name: 'SNES',
        priority: 'high', max_price: '39.99', notes: null,
        release_status: 'released', release_date: '1995-03-11', created_at: '2024-06-01',
      },
    ]);

    await exportWishlist(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        total_items: 1,
        wishlist: expect.any(Array),
      })
    );
  });

  it('should return 400 for unsupported format', async () => {
    const req = mockReq({ query: { format: 'xml' } });
    const res = mockRes();

    await exportWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
