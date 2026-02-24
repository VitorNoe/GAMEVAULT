import PreservationSource from '../models/PreservationSource';
import GamePreservation from '../models/GamePreservation';
import Game from '../models/Game';
import { Op } from 'sequelize';

// ─── Preservation Sources ────────────────────────────────────────────

export async function listPreservationSources(filters: {
  source_type?: string;
  search?: string;
}): Promise<PreservationSource[]> {
  const where: Record<string, unknown> = {};

  if (filters.source_type) {
    where.source_type = filters.source_type;
  }
  if (filters.search) {
    where.name = { [Op.iLike]: `%${filters.search}%` };
  }

  return PreservationSource.findAll({
    where,
    order: [['name', 'ASC']],
  });
}

export async function getPreservationSourceById(id: number): Promise<PreservationSource | null> {
  return PreservationSource.findByPk(id, {
    include: [
      {
        model: Game,
        as: 'games',
        through: { attributes: ['available', 'specific_url', 'notes'] },
        attributes: ['id', 'title', 'slug', 'cover_url', 'release_date', 'availability_status'],
      },
    ],
  });
}

export async function createPreservationSource(data: {
  name: string;
  slug: string;
  url: string;
  source_type: 'museum' | 'archive' | 'organization';
  logo_url?: string;
  description?: string;
}): Promise<PreservationSource> {
  return PreservationSource.create(data);
}

export async function updatePreservationSource(
  id: number,
  data: Partial<{
    name: string;
    slug: string;
    url: string;
    source_type: 'museum' | 'archive' | 'organization';
    logo_url: string;
    description: string;
  }>,
): Promise<PreservationSource | null> {
  const source = await PreservationSource.findByPk(id);
  if (!source) return null;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      (source as any)[key] = value;
    }
  });
  await source.save();
  return source;
}

export async function deletePreservationSource(id: number): Promise<boolean> {
  const source = await PreservationSource.findByPk(id);
  if (!source) return false;
  await source.destroy();
  return true;
}

// ─── Game ↔ Preservation link ────────────────────────────────────────

export async function getGamePreservation(gameId: number): Promise<GamePreservation[]> {
  return GamePreservation.findAll({
    where: { game_id: gameId },
    include: [
      {
        model: PreservationSource,
        as: 'source',
        attributes: ['id', 'name', 'slug', 'url', 'source_type', 'logo_url'],
      },
    ],
  });
}

export async function linkGameToPreservationSource(data: {
  game_id: number;
  source_id: number;
  available?: boolean;
  specific_url?: string;
  notes?: string;
}): Promise<GamePreservation> {
  const [record, created] = await GamePreservation.findOrCreate({
    where: { game_id: data.game_id, source_id: data.source_id },
    defaults: {
      game_id: data.game_id,
      source_id: data.source_id,
      available: data.available ?? true,
      specific_url: data.specific_url,
      notes: data.notes,
    },
  });

  if (!created) {
    if (data.available !== undefined) record.available = data.available;
    if (data.specific_url !== undefined) record.specific_url = data.specific_url;
    if (data.notes !== undefined) record.notes = data.notes;
    await record.save();
  }

  return record;
}

export async function unlinkGameFromPreservationSource(
  gameId: number,
  sourceId: number,
): Promise<boolean> {
  const deleted = await GamePreservation.destroy({
    where: { game_id: gameId, source_id: sourceId },
  });
  return deleted > 0;
}
