import { Op, fn, col, literal } from 'sequelize';
import sequelize from '../config/database';
import User from '../models/User';
import Game from '../models/Game';
import Review from '../models/Review';
import UserActivity from '../models/UserActivity';
import RereleaseRequest from '../models/RereleaseRequest';
import RereleaseVote from '../models/RereleaseVote';
import Media from '../models/Media';

// ─── Dashboard overview ──────────────────────────────────────────────

export interface DashboardStats {
  users: {
    total: number;
    admins: number;
    banned: number;
    verified: number;
    newThisMonth: number;
  };
  games: {
    total: number;
    published: number;
    earlyAccess: number;
    abandonware: number;
  };
  reviews: {
    total: number;
    flagged: number;
    removed: number;
    averageRating: number;
  };
  media: {
    totalFiles: number;
    totalSizeBytes: number;
  };
  rereleases: {
    activeRequests: number;
    fulfilledRequests: number;
    totalVotes: number;
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Run all queries in parallel
  const [
    totalUsers,
    adminUsers,
    bannedUsers,
    verifiedUsers,
    newUsersThisMonth,
    totalGames,
    publishedGames,
    earlyAccessGames,
    abandonwareGames,
    totalReviews,
    flaggedReviews,
    removedReviews,
    avgRatingResult,
    totalMedia,
    mediaSizeResult,
    activeRereleases,
    fulfilledRereleases,
    totalVotesResult,
  ] = await Promise.all([
    User.count(),
    User.count({ where: { user_type: 'admin' } as any }),
    User.count({ where: { is_banned: true } }),
    User.count({ where: { email_verified: true } }),
    User.count({ where: { created_at: { [Op.gte]: startOfMonth } } }),
    Game.count(),
    Game.count({ where: { release_status: 'released' } }),
    Game.count({ where: { is_early_access: true } }),
    Game.count({ where: { availability_status: 'abandonware' } }),
    Review.count(),
    Review.count({ where: { moderation_status: 'flagged' } }),
    Review.count({ where: { moderation_status: 'removed' } }),
    Review.findOne({ attributes: [[fn('AVG', col('rating')), 'avg']], raw: true }) as Promise<any>,
    Media.count(),
    Media.findOne({ attributes: [[fn('SUM', col('file_size')), 'total']], raw: true }) as Promise<any>,
    RereleaseRequest.count({ where: { status: 'active' } }),
    RereleaseRequest.count({ where: { status: 'fulfilled' } }),
    RereleaseVote.findOne({ attributes: [[fn('COUNT', col('id')), 'total']], raw: true }) as Promise<any>,
  ]);

  return {
    users: {
      total: totalUsers,
      admins: adminUsers,
      banned: bannedUsers,
      verified: verifiedUsers,
      newThisMonth: newUsersThisMonth,
    },
    games: {
      total: totalGames,
      published: publishedGames,
      earlyAccess: earlyAccessGames,
      abandonware: abandonwareGames,
    },
    reviews: {
      total: totalReviews,
      flagged: flaggedReviews,
      removed: removedReviews,
      averageRating: avgRatingResult?.avg ? parseFloat(Number(avgRatingResult.avg).toFixed(2)) : 0,
    },
    media: {
      totalFiles: totalMedia,
      totalSizeBytes: mediaSizeResult?.total ? parseInt(mediaSizeResult.total, 10) : 0,
    },
    rereleases: {
      activeRequests: activeRereleases,
      fulfilledRequests: fulfilledRereleases,
      totalVotes: totalVotesResult?.total ? parseInt(totalVotesResult.total, 10) : 0,
    },
  };
}

// ─── Top games report ────────────────────────────────────────────────

export interface TopGameEntry {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  average_rating: number;
  total_reviews: number;
}

export async function getTopGames(limit: number = 10): Promise<TopGameEntry[]> {
  const games = await Game.findAll({
    attributes: ['id', 'title', 'slug', 'cover_url', 'average_rating', 'total_reviews'],
    where: {
      total_reviews: { [Op.gt]: 0 },
    },
    order: [
      ['average_rating', 'DESC'],
      ['total_reviews', 'DESC'],
    ],
    limit,
    raw: true,
  });

  return games as unknown as TopGameEntry[];
}

// ─── Most reviewed games ─────────────────────────────────────────────

export async function getMostReviewedGames(limit: number = 10): Promise<TopGameEntry[]> {
  const games = await Game.findAll({
    attributes: ['id', 'title', 'slug', 'cover_url', 'average_rating', 'total_reviews'],
    where: {
      total_reviews: { [Op.gt]: 0 },
    },
    order: [['total_reviews', 'DESC']],
    limit,
    raw: true,
  });

  return games as unknown as TopGameEntry[];
}

// ─── Most active users ──────────────────────────────────────────────

export interface ActiveUserEntry {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  review_count: number;
  activity_count: number;
}

export async function getMostActiveUsers(limit: number = 10): Promise<ActiveUserEntry[]> {
  // Users with most reviews
  const results = await sequelize.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.avatar_url,
      COUNT(DISTINCT r.id) AS review_count,
      COUNT(DISTINCT ua.id) AS activity_count
    FROM users u
    LEFT JOIN reviews r ON r.user_id = u.id AND r.moderation_status != 'removed'
    LEFT JOIN user_activity ua ON ua.user_id = u.id
    WHERE u.is_banned = false
    GROUP BY u.id
    ORDER BY review_count DESC, activity_count DESC
    LIMIT :limit
  `, {
    replacements: { limit },
    type: 'SELECT' as any,
  });

  return results as unknown as ActiveUserEntry[];
}

// ─── Rerelease requests summary ─────────────────────────────────────

export interface RereleaseRequestSummary {
  id: number;
  game_id: number;
  game_title: string;
  total_votes: number;
  status: string;
  created_at: Date;
}

export async function getRereleaseRequestsSummary(
  limit: number = 20,
): Promise<RereleaseRequestSummary[]> {
  const results = await sequelize.query(`
    SELECT
      rr.id,
      rr.game_id,
      g.title AS game_title,
      rr.total_votes,
      rr.status,
      rr.created_at
    FROM rerelease_requests rr
    JOIN games g ON g.id = rr.game_id
    ORDER BY rr.total_votes DESC, rr.created_at DESC
    LIMIT :limit
  `, {
    replacements: { limit },
    type: 'SELECT' as any,
  });

  return results as unknown as RereleaseRequestSummary[];
}

// ─── User registration trend (last 12 months) ───────────────────────

export interface RegistrationTrend {
  month: string;   // YYYY-MM
  count: number;
}

export async function getUserRegistrationTrend(): Promise<RegistrationTrend[]> {
  const results = await sequelize.query(`
    SELECT
      TO_CHAR(created_at, 'YYYY-MM') AS month,
      COUNT(*) AS count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY month
    ORDER BY month ASC
  `, {
    type: 'SELECT' as any,
  });

  return results as unknown as RegistrationTrend[];
}

// ─── Review trends (last 12 months) ─────────────────────────────────

export interface ReviewTrend {
  month: string;
  count: number;
  avg_rating: number;
}

export async function getReviewTrend(): Promise<ReviewTrend[]> {
  const results = await sequelize.query(`
    SELECT
      TO_CHAR(created_at, 'YYYY-MM') AS month,
      COUNT(*) AS count,
      ROUND(AVG(rating)::numeric, 2) AS avg_rating
    FROM reviews
    WHERE created_at >= NOW() - INTERVAL '12 months'
      AND moderation_status != 'removed'
    GROUP BY month
    ORDER BY month ASC
  `, {
    type: 'SELECT' as any,
  });

  return results as unknown as ReviewTrend[];
}
