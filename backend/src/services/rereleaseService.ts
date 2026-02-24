import RereleaseRequest from '../models/RereleaseRequest';
import RereleaseVote from '../models/RereleaseVote';
import Game from '../models/Game';
import User from '../models/User';
import Notification from '../models/Notification';
import sequelize from '../config/database';
import { Op } from 'sequelize';

// ─── Re-release Request CRUD ─────────────────────────────────────────

export async function createRereleaseRequest(gameId: number): Promise<RereleaseRequest> {
  // Check game exists
  const game = await Game.findByPk(gameId);
  if (!game) throw Object.assign(new Error('Game not found'), { status: 404 });

  // One active request per game
  const existing = await RereleaseRequest.findOne({
    where: { game_id: gameId, status: { [Op.ne]: 'archived' } },
  });
  if (existing) throw Object.assign(new Error('An active re-release request already exists for this game'), { status: 409 });

  return RereleaseRequest.create({ game_id: gameId });
}

export async function getRereleaseRequestById(id: number): Promise<RereleaseRequest | null> {
  return RereleaseRequest.findByPk(id, {
    include: [
      { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url', 'release_date', 'availability_status'] },
      {
        model: RereleaseVote,
        as: 'votes',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] }],
      },
    ],
  });
}

export async function listRereleaseRequests(filters: {
  status?: string;
  page: number;
  limit: number;
  offset: number;
}): Promise<{ rows: RereleaseRequest[]; count: number }> {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;

  return RereleaseRequest.findAndCountAll({
    where,
    include: [
      { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url', 'release_date', 'availability_status'] },
    ],
    order: [['total_votes', 'DESC'], ['created_at', 'ASC']],
    limit: filters.limit,
    offset: filters.offset,
    distinct: true,
  });
}

export async function updateRereleaseRequest(
  id: number,
  data: Partial<{ status: string; fulfilled_date: string }>,
): Promise<RereleaseRequest | null> {
  const request = await RereleaseRequest.findByPk(id);
  if (!request) return null;

  if (data.status !== undefined) request.status = data.status as any;
  if (data.fulfilled_date !== undefined) request.fulfilled_date = new Date(data.fulfilled_date);
  await request.save();
  return request;
}

export async function deleteRereleaseRequest(id: number): Promise<boolean> {
  const request = await RereleaseRequest.findByPk(id);
  if (!request) return false;

  // Remove votes first, then request
  await RereleaseVote.destroy({ where: { request_id: id } });
  await request.destroy();
  return true;
}

// ─── Voting ──────────────────────────────────────────────────────────

export async function voteForRerelease(
  gameId: number,
  userId: number,
  comment?: string,
): Promise<{ vote: RereleaseVote; created: boolean }> {
  // Find or create request for this game
  let request = await RereleaseRequest.findOne({
    where: { game_id: gameId, status: 'active' },
  });

  if (!request) {
    // Auto-create an active request when first user votes
    const game = await Game.findByPk(gameId);
    if (!game) throw Object.assign(new Error('Game not found'), { status: 404 });
    request = await RereleaseRequest.create({ game_id: gameId });
  }

  // Per-user deduplication
  const existing = await RereleaseVote.findOne({
    where: { request_id: request.id, user_id: userId },
  });

  if (existing) {
    // Update comment if provided, but don't create duplicate vote
    if (comment !== undefined) {
      existing.comment = comment;
      await existing.save();
    }
    return { vote: existing, created: false };
  }

  // Create new vote inside a transaction for consistency
  const vote = await sequelize.transaction(async (t) => {
    const v = await RereleaseVote.create(
      { request_id: request!.id, user_id: userId, comment },
      { transaction: t },
    );

    // Increment vote count
    await request!.increment('total_votes', { by: 1, transaction: t });

    return v;
  });

  return { vote, created: true };
}

export async function removeVote(
  gameId: number,
  userId: number,
): Promise<boolean> {
  const request = await RereleaseRequest.findOne({
    where: { game_id: gameId, status: 'active' },
  });
  if (!request) return false;

  const deleted = await sequelize.transaction(async (t) => {
    const count = await RereleaseVote.destroy({
      where: { request_id: request.id, user_id: userId },
      transaction: t,
    });

    if (count > 0) {
      await request.decrement('total_votes', { by: 1, transaction: t });
    }
    return count > 0;
  });

  return deleted;
}

// ─── Most Voted ──────────────────────────────────────────────────────

export async function getMostVotedRequests(limit: number = 20): Promise<RereleaseRequest[]> {
  return RereleaseRequest.findAll({
    where: { status: 'active' },
    include: [
      { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url', 'release_date', 'availability_status'] },
    ],
    order: [['total_votes', 'DESC'], ['created_at', 'ASC']],
    limit,
  });
}

// ─── Admin: Fulfill & Notify ─────────────────────────────────────────

export async function fulfillRequest(
  requestId: number,
  adminId: number,
): Promise<RereleaseRequest> {
  const request = await RereleaseRequest.findByPk(requestId, {
    include: [
      { model: Game, as: 'game', attributes: ['id', 'title', 'slug'] },
      { model: RereleaseVote, as: 'votes', attributes: ['user_id'] },
    ],
  });

  if (!request) throw Object.assign(new Error('Re-release request not found'), { status: 404 });
  if (request.status === 'fulfilled') throw Object.assign(new Error('Request already fulfilled'), { status: 409 });

  // Mark fulfilled
  request.status = 'fulfilled';
  request.fulfilled_date = new Date();
  await request.save();

  // Notify all voters
  const game = (request as any).game;
  const votes: RereleaseVote[] = (request as any).votes || [];
  const voterIds = votes.map((v: RereleaseVote) => v.user_id);

  if (voterIds.length > 0 && game) {
    const notifications = voterIds.map((uid: number) => ({
      user_id: uid,
      notification_type: 'rerelease' as const,
      game_id: game.id,
      title: 'Re-release Request Fulfilled!',
      message: `Great news! "${game.title}" has been re-released. Your vote helped make this happen!`,
    }));

    await Notification.bulkCreate(notifications);
  }

  return request;
}

export async function archiveRequest(requestId: number): Promise<RereleaseRequest> {
  const request = await RereleaseRequest.findByPk(requestId);
  if (!request) throw Object.assign(new Error('Re-release request not found'), { status: 404 });

  request.status = 'archived';
  await request.save();
  return request;
}

// ─── Admin: Update game availability & notify voters ─────────────────

export async function updateGameAvailabilityStatus(
  gameId: number,
  newStatus: string,
  adminId: number,
): Promise<Game> {
  const game = await Game.findByPk(gameId);
  if (!game) throw Object.assign(new Error('Game not found'), { status: 404 });

  const oldStatus = (game as any).availability_status;
  (game as any).availability_status = newStatus;
  await game.save();

  // If the game became available, notify voters on any active re-release request
  if (newStatus === 'available' && oldStatus !== 'available') {
    const request = await RereleaseRequest.findOne({
      where: { game_id: gameId, status: 'active' },
      include: [{ model: RereleaseVote, as: 'votes', attributes: ['user_id'] }],
    });

    if (request) {
      const votes: RereleaseVote[] = (request as any).votes || [];
      const voterIds = votes.map((v: RereleaseVote) => v.user_id);

      if (voterIds.length > 0) {
        const notifications = voterIds.map((uid: number) => ({
          user_id: uid,
          notification_type: 'status_change' as const,
          game_id: gameId,
          title: 'Game Availability Changed',
          message: `"${(game as any).title}" is now available! The availability status has changed from "${oldStatus}" to "${newStatus}".`,
        }));

        await Notification.bulkCreate(notifications);
      }

      // Auto-fulfill the request
      request.status = 'fulfilled';
      request.fulfilled_date = new Date();
      await request.save();
    }
  }

  return game;
}
