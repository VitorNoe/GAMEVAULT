/**
 * Reviews & Ratings Controller Tests
 *
 * Unit tests for:
 * - POST   /api/reviews           (createReview)
 * - PUT    /api/reviews/:id       (updateReview)
 * - DELETE /api/reviews/:id       (deleteReview)
 * - GET    /api/reviews/:id       (getReviewById)
 * - GET    /api/reviews/game/:id  (getGameReviews)
 * - GET    /api/reviews/user/:id  (getUserReviews)
 * - POST   /api/reviews/:id/like  (likeReview)
 * - DELETE /api/reviews/:id/like  (unlikeReview)
 * - DELETE /api/reviews/admin/:id (adminDeleteReview)
 * - PUT    /api/reviews/admin/:id/flag (adminFlagReview)
 * - GET    /api/reviews/admin/moderation-log (getModerationLog)
 * - POST   /api/reviews/admin/recalculate   (adminRecalculate)
 */

import { Request, Response } from 'express';

// ─── Fixtures ──────────────────────────────────────────────────────────

const sampleReview = {
  id: 1,
  user_id: 10,
  game_id: 20,
  platform_id: 3,
  rating: 8.5,
  review_text: 'Great game!',
  has_spoilers: false,
  hours_played: 40,
  recommends: true,
  likes_count: 5,
  dislikes_count: 1,
  created_at: '2024-06-01',
  updated_at: '2024-06-01',
  save: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  toJSON() { return { ...this, save: undefined, destroy: undefined, toJSON: undefined }; },
  get(field: string) { return (this as any)[field]; },
};

const sampleGame = {
  id: 20,
  title: 'Chrono Trigger',
  slug: 'chrono-trigger',
  cover_url: null,
  average_rating: 8.5,
  total_reviews: 1,
  get(field: string) { return (this as any)[field]; },
};

const sampleUser = {
  id: 10,
  name: 'Test User',
  avatar_url: null,
  get(field: string) { return (this as any)[field]; },
};

const samplePlatform = {
  id: 3,
  name: 'SNES',
};

// ─── Mocks ──────────────────────────────────────────────────────────

const mockReviewFindByPk = jest.fn();
const mockReviewFindOne = jest.fn();
const mockReviewFindAndCountAll = jest.fn();
const mockReviewCreate = jest.fn();
const mockReviewUpdate = jest.fn();

const mockReviewLikeFindOne = jest.fn();
const mockReviewLikeFindAll = jest.fn();
const mockReviewLikeCreate = jest.fn();
const mockReviewLikeDestroy = jest.fn();
const mockReviewLikeCount = jest.fn();

const mockGameFindByPk = jest.fn();
const mockGameFindAll = jest.fn();
const mockGameUpdate = jest.fn();

const mockUserFindByPk = jest.fn();

const mockPlatformFindByPk = jest.fn();

const mockNotificationCreate = jest.fn();

const mockUserActivityCreate = jest.fn();
const mockUserActivityFindAndCountAll = jest.fn();

jest.mock('../models/Review', () => {
  const mock: any = function () {};
  mock.findByPk = (...a: any[]) => mockReviewFindByPk(...a);
  mock.findOne = (...a: any[]) => mockReviewFindOne(...a);
  mock.findAndCountAll = (...a: any[]) => mockReviewFindAndCountAll(...a);
  mock.create = (...a: any[]) => mockReviewCreate(...a);
  mock.update = (...a: any[]) => mockReviewUpdate(...a);
  return { __esModule: true, default: mock };
});

jest.mock('../models/ReviewLike', () => {
  const mock: any = function () {};
  mock.findOne = (...a: any[]) => mockReviewLikeFindOne(...a);
  mock.findAll = (...a: any[]) => mockReviewLikeFindAll(...a);
  mock.create = (...a: any[]) => mockReviewLikeCreate(...a);
  mock.destroy = (...a: any[]) => mockReviewLikeDestroy(...a);
  mock.count = (...a: any[]) => mockReviewLikeCount(...a);
  return { __esModule: true, default: mock };
});

jest.mock('../models/Game', () => {
  const mock: any = function () {};
  mock.findByPk = (...a: any[]) => mockGameFindByPk(...a);
  mock.findAll = (...a: any[]) => mockGameFindAll(...a);
  mock.update = (...a: any[]) => mockGameUpdate(...a);
  return { __esModule: true, default: mock };
});

jest.mock('../models/User', () => {
  const mock: any = function () {};
  mock.findByPk = (...a: any[]) => mockUserFindByPk(...a);
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

jest.mock('../models/UserActivity', () => {
  const mock: any = function () {};
  mock.create = (...a: any[]) => mockUserActivityCreate(...a);
  mock.findAndCountAll = (...a: any[]) => mockUserActivityFindAndCountAll(...a);
  return { __esModule: true, default: mock };
});

jest.mock('../config/database', () => ({ __esModule: true, default: {} }));

// ─── Import controllers after mocks ────────────────────────────────

import {
  createReview,
  updateReview,
  deleteReview,
  getReviewById,
  getGameReviews,
  getUserReviews,
  likeReview,
  unlikeReview,
  adminDeleteReview,
  adminFlagReview,
  getModerationLog,
  adminRecalculate,
  recalculateAllGameRatings,
} from '../controllers/reviewController';

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
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: recalculate helpers return zero reviews
  mockReviewFindOne.mockResolvedValue({ avg: null, cnt: '0' });
  mockGameUpdate.mockResolvedValue([1]);
  mockReviewLikeCount.mockResolvedValue(0);
  mockReviewUpdate.mockResolvedValue([1]);
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/reviews – createReview
// ═══════════════════════════════════════════════════════════════════

describe('createReview', () => {
  it('should create a review successfully', async () => {
    const req = mockReq({
      body: { game_id: 20, rating: 8.5, review_text: 'Great game!', has_spoilers: false },
    });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockReviewFindOne
      .mockResolvedValueOnce(null) // no existing review
      .mockResolvedValueOnce({ avg: '8.50', cnt: '1' }); // recalculate
    mockReviewCreate.mockResolvedValue({ id: 1 });
    mockReviewFindByPk.mockResolvedValue(sampleReview);

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Review created successfully' })
    );
    expect(mockReviewCreate).toHaveBeenCalled();
    expect(mockGameUpdate).toHaveBeenCalled();
  });

  it('should return 400 if game_id or rating missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'game_id and rating are required' })
    );
  });

  it('should return 400 if rating is out of range', async () => {
    const req = mockReq({ body: { game_id: 20, rating: 11 } });
    const res = mockRes();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Rating must be between 0 and 10' })
    );
  });

  it('should return 404 if game not found', async () => {
    const req = mockReq({ body: { game_id: 999, rating: 7 } });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(null);

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Game not found' })
    );
  });

  it('should return 404 if platform not found', async () => {
    const req = mockReq({ body: { game_id: 20, rating: 7, platform_id: 999 } });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockPlatformFindByPk.mockResolvedValue(null);

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Platform not found' })
    );
  });

  it('should return 409 if duplicate review', async () => {
    const req = mockReq({ body: { game_id: 20, rating: 7 } });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockReviewFindOne.mockResolvedValueOnce(sampleReview); // existing

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should return 401 if not authenticated', async () => {
    const req = mockReq({ user: undefined, body: { game_id: 20, rating: 7 } });
    const res = mockRes();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PUT /api/reviews/:id – updateReview
// ═══════════════════════════════════════════════════════════════════

describe('updateReview', () => {
  it('should update own review', async () => {
    const reviewInstance = { ...sampleReview, save: jest.fn().mockResolvedValue(undefined) };
    const req = mockReq({ params: { id: '1' }, body: { rating: 9.0, review_text: 'Updated!' } });
    const res = mockRes();

    mockReviewFindByPk
      .mockResolvedValueOnce(reviewInstance) // find for update
      .mockResolvedValueOnce(sampleReview);  // find for response
    mockReviewFindOne.mockResolvedValue({ avg: '9.00', cnt: '1' }); // recalculate

    await updateReview(req, res);

    expect(reviewInstance.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Review updated successfully' })
    );
  });

  it('should return 403 if not own review', async () => {
    const req = mockReq({ params: { id: '1' }, body: { rating: 5 } });
    req.user.id = 99; // different user
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(sampleReview);

    await updateReview(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 404 if review not found', async () => {
    const req = mockReq({ params: { id: '999' }, body: { rating: 5 } });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(null);

    await updateReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 400 for invalid rating', async () => {
    const reviewInstance = { ...sampleReview };
    const req = mockReq({ params: { id: '1' }, body: { rating: -1 } });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(reviewInstance);

    await updateReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 for invalid review ID', async () => {
    const req = mockReq({ params: { id: 'abc' }, body: { rating: 5 } });
    const res = mockRes();

    await updateReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DELETE /api/reviews/:id – deleteReview
// ═══════════════════════════════════════════════════════════════════

describe('deleteReview', () => {
  it('should delete own review', async () => {
    const reviewInstance = {
      ...sampleReview,
      destroy: jest.fn().mockResolvedValue(undefined),
    };
    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(reviewInstance);
    mockReviewLikeDestroy.mockResolvedValue(3);
    mockReviewFindOne.mockResolvedValue({ avg: null, cnt: '0' }); // recalculate

    await deleteReview(req, res);

    expect(reviewInstance.destroy).toHaveBeenCalled();
    expect(mockReviewLikeDestroy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Review deleted successfully' })
    );
  });

  it('should return 403 if not own review', async () => {
    const req = mockReq({ params: { id: '1' } });
    req.user.id = 99;
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(sampleReview);

    await deleteReview(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 404 if not found', async () => {
    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(null);

    await deleteReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/reviews/:id – getReviewById
// ═══════════════════════════════════════════════════════════════════

describe('getReviewById', () => {
  it('should return review with user like status', async () => {
    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(sampleReview);
    mockReviewLikeFindOne.mockResolvedValue({ like_type: 'like' });

    await getReviewById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          review: sampleReview,
          userLike: 'like',
        }),
      })
    );
  });

  it('should return review without like status for unauthenticated', async () => {
    const req = mockReq({ params: { id: '1' }, user: undefined });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(sampleReview);

    await getReviewById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userLike: null }),
      })
    );
  });

  it('should return 404 for non-existent review', async () => {
    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(null);

    await getReviewById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/reviews/game/:gameId – getGameReviews
// ═══════════════════════════════════════════════════════════════════

describe('getGameReviews', () => {
  it('should return paginated reviews for a game', async () => {
    const reviewRow = { ...sampleReview, toJSON() { return { ...sampleReview }; } };
    const req = mockReq({ params: { gameId: '20' }, query: {} });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockReviewFindAndCountAll.mockResolvedValue({ count: 1, rows: [reviewRow] });
    mockReviewLikeFindAll.mockResolvedValue([]);

    await getGameReviews(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          reviews: expect.any(Array),
          gameRating: expect.objectContaining({ average_rating: 8.5 }),
          pagination: expect.objectContaining({ total: 1 }),
        }),
      })
    );
  });

  it('should return 404 if game not found', async () => {
    const req = mockReq({ params: { gameId: '999' }, query: {} });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(null);

    await getGameReviews(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should include user like statuses when authenticated', async () => {
    const reviewRow = { ...sampleReview, toJSON() { return { ...sampleReview }; } };
    const req = mockReq({ params: { gameId: '20' }, query: {} });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockReviewFindAndCountAll.mockResolvedValue({ count: 1, rows: [reviewRow] });
    mockReviewLikeFindAll.mockResolvedValue([{ review_id: 1, like_type: 'like' }]);

    await getGameReviews(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = (res.json as jest.Mock).mock.calls[0][0].data;
    expect(data.reviews[0].userLike).toBe('like');
  });

  it('should support sort and filter parameters', async () => {
    const req = mockReq({
      params: { gameId: '20' },
      query: { sort: 'rating', order: 'ASC', has_spoilers: 'false', min_rating: '7' },
    });
    const res = mockRes();

    mockGameFindByPk.mockResolvedValue(sampleGame);
    mockReviewFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getGameReviews(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockReviewFindAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [['rating', 'ASC']],
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/reviews/user/:userId – getUserReviews
// ═══════════════════════════════════════════════════════════════════

describe('getUserReviews', () => {
  it('should return paginated reviews by a user', async () => {
    const req = mockReq({ params: { userId: '10' }, query: {} });
    const res = mockRes();

    mockUserFindByPk.mockResolvedValue(sampleUser);
    mockReviewFindAndCountAll.mockResolvedValue({ count: 1, rows: [sampleReview] });

    await getUserReviews(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          reviews: expect.any(Array),
          pagination: expect.objectContaining({ total: 1 }),
        }),
      })
    );
  });

  it('should return 404 if user not found', async () => {
    const req = mockReq({ params: { userId: '999' }, query: {} });
    const res = mockRes();

    mockUserFindByPk.mockResolvedValue(null);

    await getUserReviews(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/reviews/:id/like – likeReview
// ═══════════════════════════════════════════════════════════════════

describe('likeReview', () => {
  it('should create a new like', async () => {
    const review = { ...sampleReview, user_id: 99 }; // different user
    const req = mockReq({ params: { id: '1' }, body: { like_type: 'like' } });
    const res = mockRes();

    mockReviewFindByPk
      .mockResolvedValueOnce(review)                     // find review
      .mockResolvedValueOnce({ id: 1, likes_count: 6, dislikes_count: 1 }); // updated
    mockReviewLikeFindOne.mockResolvedValue(null);       // no existing like
    mockReviewLikeCreate.mockResolvedValue({});
    mockReviewLikeCount.mockResolvedValueOnce(6).mockResolvedValueOnce(1);
    mockUserFindByPk.mockResolvedValue(sampleUser);
    mockNotificationCreate.mockResolvedValue({});

    await likeReview(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockReviewLikeCreate).toHaveBeenCalled();
    expect(mockNotificationCreate).toHaveBeenCalled();
  });

  it('should toggle off existing same-type like', async () => {
    const review = { ...sampleReview, user_id: 99 };
    const existingLike = { like_type: 'like', destroy: jest.fn().mockResolvedValue(undefined) };
    const req = mockReq({ params: { id: '1' }, body: { like_type: 'like' } });
    const res = mockRes();

    mockReviewFindByPk
      .mockResolvedValueOnce(review)
      .mockResolvedValueOnce({ id: 1, likes_count: 4, dislikes_count: 1 });
    mockReviewLikeFindOne.mockResolvedValue(existingLike);
    mockReviewLikeCount.mockResolvedValueOnce(4).mockResolvedValueOnce(1);

    await likeReview(req, res);

    expect(existingLike.destroy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const data = (res.json as jest.Mock).mock.calls[0][0].data;
    expect(data.action).toBe('removed');
  });

  it('should update existing like to different type', async () => {
    const review = { ...sampleReview, user_id: 99 };
    const existingLike = { like_type: 'like', save: jest.fn().mockResolvedValue(undefined) };
    const req = mockReq({ params: { id: '1' }, body: { like_type: 'dislike' } });
    const res = mockRes();

    mockReviewFindByPk
      .mockResolvedValueOnce(review)
      .mockResolvedValueOnce({ id: 1, likes_count: 4, dislikes_count: 2 });
    mockReviewLikeFindOne.mockResolvedValue(existingLike);
    mockReviewLikeCount.mockResolvedValueOnce(4).mockResolvedValueOnce(2);

    await likeReview(req, res);

    expect(existingLike.save).toHaveBeenCalled();
    expect(existingLike.like_type).toBe('dislike');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 400 for invalid like_type', async () => {
    const req = mockReq({ params: { id: '1' }, body: { like_type: 'love' } });
    const res = mockRes();

    await likeReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 when liking own review', async () => {
    const review = { ...sampleReview, user_id: 10 }; // same as req.user.id
    const req = mockReq({ params: { id: '1' }, body: { like_type: 'like' } });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(review);

    await likeReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'You cannot like your own review' })
    );
  });

  it('should return 404 if review not found', async () => {
    const req = mockReq({ params: { id: '999' }, body: { like_type: 'like' } });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(null);

    await likeReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DELETE /api/reviews/:id/like – unlikeReview
// ═══════════════════════════════════════════════════════════════════

describe('unlikeReview', () => {
  it('should remove an existing like', async () => {
    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    mockReviewFindByPk
      .mockResolvedValueOnce(sampleReview)
      .mockResolvedValueOnce({ id: 1, likes_count: 4, dislikes_count: 1 });
    mockReviewLikeDestroy.mockResolvedValue(1);
    mockReviewLikeCount.mockResolvedValueOnce(4).mockResolvedValueOnce(1);

    await unlikeReview(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Like removed successfully' })
    );
  });

  it('should return 404 if like not found', async () => {
    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(sampleReview);
    mockReviewLikeDestroy.mockResolvedValue(0);

    await unlikeReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Like not found' })
    );
  });

  it('should return 404 if review not found', async () => {
    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(null);

    await unlikeReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DELETE /api/reviews/admin/:id – adminDeleteReview
// ═══════════════════════════════════════════════════════════════════

describe('adminDeleteReview', () => {
  it('should delete any review and log moderation action', async () => {
    const reviewInstance = {
      ...sampleReview,
      user_id: 99,
      game: { id: 20, title: 'Chrono Trigger' },
      user: { id: 99, name: 'Author' },
      destroy: jest.fn().mockResolvedValue(undefined),
      toJSON() {
        return {
          ...sampleReview,
          user_id: 99,
          game: this.game,
          user: this.user,
        };
      },
    };
    const req = mockReq({
      params: { id: '1' },
      body: { reason: 'Spam' },
      user: { id: 1, email: 'admin@test.com', type: 'admin' },
    });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(reviewInstance);
    mockReviewLikeDestroy.mockResolvedValue(2);
    mockReviewFindOne.mockResolvedValue({ avg: null, cnt: '0' }); // recalculate
    mockUserActivityCreate.mockResolvedValue({});

    await adminDeleteReview(req, res);

    expect(reviewInstance.destroy).toHaveBeenCalled();
    expect(mockUserActivityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        activity_type: 'review_moderation',
        metadata: expect.objectContaining({ action: 'delete', reason: 'Spam' }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Review deleted by admin' })
    );
  });

  it('should return 404 if review not found', async () => {
    const req = mockReq({
      params: { id: '999' },
      user: { id: 1, email: 'admin@test.com', type: 'admin' },
    });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(null);

    await adminDeleteReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PUT /api/reviews/admin/:id/flag – adminFlagReview
// ═══════════════════════════════════════════════════════════════════

describe('adminFlagReview', () => {
  it('should flag a review and log moderation action', async () => {
    const reviewInstance = {
      ...sampleReview,
      game: { id: 20, title: 'Chrono Trigger' },
      user: { id: 10, name: 'Author' },
    };
    const req = mockReq({
      params: { id: '1' },
      body: { reason: 'Hateful content' },
      user: { id: 1, email: 'admin@test.com', type: 'admin' },
    });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(reviewInstance);
    mockUserActivityCreate.mockResolvedValue({});

    await adminFlagReview(req, res);

    expect(mockUserActivityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        activity_type: 'review_moderation',
        metadata: expect.objectContaining({ action: 'flag', reason: 'Hateful content' }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Review flagged successfully' })
    );
  });

  it('should return 400 if no reason provided', async () => {
    const req = mockReq({
      params: { id: '1' },
      body: {},
      user: { id: 1, email: 'admin@test.com', type: 'admin' },
    });
    const res = mockRes();

    await adminFlagReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 404 if review not found', async () => {
    const req = mockReq({
      params: { id: '1' },
      body: { reason: 'test' },
      user: { id: 1, email: 'admin@test.com', type: 'admin' },
    });
    const res = mockRes();

    mockReviewFindByPk.mockResolvedValue(null);

    await adminFlagReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/reviews/admin/moderation-log – getModerationLog
// ═══════════════════════════════════════════════════════════════════

describe('getModerationLog', () => {
  it('should return paginated moderation logs', async () => {
    const req = mockReq({
      query: {},
      user: { id: 1, email: 'admin@test.com', type: 'admin' },
    });
    const res = mockRes();

    const logEntry = {
      id: 1,
      user_id: 1,
      activity_type: 'review_moderation',
      entity_type: 'review',
      entity_id: 5,
      description: 'Admin deleted review #5',
      metadata: { action: 'delete', reason: 'Spam' },
      created_at: '2024-06-01',
    };
    mockUserActivityFindAndCountAll.mockResolvedValue({ count: 1, rows: [logEntry] });

    await getModerationLog(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          logs: expect.any(Array),
          pagination: expect.objectContaining({ total: 1 }),
        }),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/reviews/admin/recalculate – adminRecalculate
// ═══════════════════════════════════════════════════════════════════

describe('adminRecalculate', () => {
  it('should recalculate all game ratings', async () => {
    const req = mockReq({
      user: { id: 1, email: 'admin@test.com', type: 'admin' },
    });
    const res = mockRes();

    mockGameFindAll.mockResolvedValue([{ id: 20 }, { id: 21 }]);
    mockReviewFindOne
      .mockResolvedValueOnce({ avg: '8.50', cnt: '3' })
      .mockResolvedValueOnce({ avg: '7.00', cnt: '2' });

    await adminRecalculate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockGameUpdate).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Ratings recalculated successfully',
        data: expect.objectContaining({ updated: 2 }),
      })
    );
  });
});
