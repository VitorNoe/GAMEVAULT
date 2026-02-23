/**
 * RAWG External API Controller
 *
 * Endpoints:
 *  GET  /api/external/rawg/search?q=...&page=...&page_size=...
 *  POST /api/external/rawg/import/:rawgId
 *  GET  /api/external/rawg/lookup/:rawgId       (preview before import)
 *  POST /api/external/rawg/sync/:gameId          (manual re-sync one game)
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import {
  searchRawg,
  getRawgGameDetail,
  getRawgScreenshots,
  mapRawgToGameFields,
  extractCompanies,
  extractGenres,
  RawgGameDetail,
} from '../services/rawgService';
import {
  Game, Developer, Publisher, Genre,
  GameGenre, GamePlatform, Platform,
  GameStatusHistory,
} from '../models';
import config from '../config/app';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function ensureApiKey(res: Response): boolean {
  if (!config.rawgApiKey) {
    res.status(503).json({
      success: false,
      message: 'RAWG API key not configured. Set RAWG_API_KEY in environment.',
    });
    return false;
  }
  return true;
}

/**
 * Find or create a Developer by slug, returning its id.
 */
async function findOrCreateDeveloper(name: string, slug: string): Promise<number> {
  const [dev] = await Developer.findOrCreate({
    where: { slug },
    defaults: { name, slug, status: 'active' },
  });
  return dev.id;
}

/**
 * Find or create a Publisher by slug, returning its id.
 */
async function findOrCreatePublisher(name: string, slug: string): Promise<number> {
  const [pub] = await Publisher.findOrCreate({
    where: { slug },
    defaults: { name, slug, status: 'active' },
  });
  return pub.id;
}

/**
 * Find or create Genres by slug, returning ids.
 */
async function findOrCreateGenres(genres: Array<{ name: string; slug: string }>): Promise<number[]> {
  const ids: number[] = [];
  for (const g of genres) {
    const [genre] = await Genre.findOrCreate({
      where: { slug: g.slug },
      defaults: { name: g.name, slug: g.slug },
    });
    ids.push(genre.id);
  }
  return ids;
}

/**
 * Try to match RAWG platform names to local Platform records.
 * Returns matched platform ids.
 */
async function matchPlatforms(
  rawgPlatforms: RawgGameDetail['platforms'],
): Promise<Array<{ platform_id: number; platform_release_date?: string }>> {
  if (!rawgPlatforms || rawgPlatforms.length === 0) return [];

  const result: Array<{ platform_id: number; platform_release_date?: string }> = [];
  for (const rp of rawgPlatforms) {
    const slug = rp.platform.slug;
    const local = await Platform.findOne({ where: { slug } });
    if (local) {
      result.push({
        platform_id: local.id,
        ...(rp.released_at ? { platform_release_date: rp.released_at } : {}),
      });
    }
  }
  return result;
}

// ──────────────────────────────────────────────
// GET /api/external/rawg/search
// ──────────────────────────────────────────────

export const rawgSearch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!ensureApiKey(res)) return;

    const query = (req.query.q as string || '').trim();
    if (!query) {
      res.status(400).json({ success: false, message: 'Query parameter "q" is required.' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(40, Math.max(1, parseInt(req.query.page_size as string) || 20));

    const data = await searchRawg(query, page, pageSize);

    // Enrich results with local import status
    const rawgIds = data.results.map(r => r.id);
    const existingGames = await Game.findAll({
      where: { rawg_id: rawgIds },
      attributes: ['id', 'rawg_id', 'title'],
      raw: true,
    });
    const importedMap = new Map(existingGames.map((g: any) => [g.rawg_id, g.id]));

    const enriched = data.results.map(r => ({
      rawg_id: r.id,
      name: r.name,
      slug: r.slug,
      released: r.released,
      background_image: r.background_image,
      metacritic: r.metacritic,
      rating: r.rating,
      ratings_count: r.ratings_count,
      platforms: r.platforms?.map(p => p.platform.name) || [],
      genres: r.genres?.map(g => g.name) || [],
      already_imported: importedMap.has(r.id),
      local_game_id: importedMap.get(r.id) || null,
    }));

    res.status(200).json({
      success: true,
      data: {
        count: data.count,
        page,
        page_size: pageSize,
        results: enriched,
      },
    });
  } catch (error: any) {
    console.error('RAWG search error:', error.message);
    const status = error.response?.status === 429 ? 429 : 500;
    res.status(status).json({
      success: false,
      message: status === 429
        ? 'RAWG API rate limit exceeded. Please try again later.'
        : 'Error searching RAWG API.',
    });
  }
};

// ──────────────────────────────────────────────
// GET /api/external/rawg/lookup/:rawgId
// ──────────────────────────────────────────────

export const rawgLookup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!ensureApiKey(res)) return;

    const rawgId = parseInt(req.params.rawgId, 10);
    if (isNaN(rawgId) || rawgId <= 0) {
      res.status(400).json({ success: false, message: 'Invalid RAWG ID.' });
      return;
    }

    const detail = await getRawgGameDetail(rawgId);
    const mapped = mapRawgToGameFields(detail);
    const companies = extractCompanies(detail);
    const genres = extractGenres(detail);

    // Check if already imported
    const existing = await Game.findOne({ where: { rawg_id: rawgId }, attributes: ['id', 'title'] });

    res.status(200).json({
      success: true,
      data: {
        rawg_detail: detail,
        mapped_fields: mapped,
        companies,
        genres,
        platforms: detail.platforms?.map(p => ({
          name: p.platform.name,
          slug: p.platform.slug,
          released_at: p.released_at,
        })) || [],
        already_imported: !!existing,
        local_game_id: existing?.id || null,
      },
    });
  } catch (error: any) {
    console.error('RAWG lookup error:', error.message);
    const status = error.response?.status === 429 ? 429 : 500;
    res.status(status).json({
      success: false,
      message: status === 429
        ? 'RAWG API rate limit exceeded. Please try again later.'
        : 'Error fetching RAWG game details.',
    });
  }
};

// ──────────────────────────────────────────────
// POST /api/external/rawg/import/:rawgId
// ──────────────────────────────────────────────

export const rawgImport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!ensureApiKey(res)) return;

    const rawgId = parseInt(req.params.rawgId, 10);
    if (isNaN(rawgId) || rawgId <= 0) {
      res.status(400).json({ success: false, message: 'Invalid RAWG ID.' });
      return;
    }

    // Check if already imported
    const existing = await Game.findOne({ where: { rawg_id: rawgId } });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Game already imported as "${existing.title}" (local ID: ${existing.id}).`,
        data: { local_game_id: existing.id },
      });
      return;
    }

    // Fetch full details from RAWG
    const detail = await getRawgGameDetail(rawgId);
    const gameFields = mapRawgToGameFields(detail);

    // Resolve developer
    const companies = extractCompanies(detail);
    if (companies.developers.length > 0) {
      const dev = companies.developers[0];
      gameFields.developer_id = await findOrCreateDeveloper(dev.name, dev.slug);
    }

    // Resolve publisher
    if (companies.publishers.length > 0) {
      const pub = companies.publishers[0];
      gameFields.publisher_id = await findOrCreatePublisher(pub.name, pub.slug);
    }

    // Allow body overrides (admin can tweak before import)
    const overridable = ['title', 'slug', 'description', 'release_status', 'availability_status', 'age_rating'];
    for (const field of overridable) {
      if (req.body[field] !== undefined) {
        gameFields[field] = req.body[field];
      }
    }

    // Ensure unique slug
    let slugBase = gameFields.slug;
    let slugSuffix = 0;
    while (await Game.findOne({ where: { slug: gameFields.slug } })) {
      slugSuffix++;
      gameFields.slug = `${slugBase}-${slugSuffix}`;
    }

    // Create the game
    const game = await Game.create(gameFields as any);

    // Link genres
    const rawgGenres = extractGenres(detail);
    if (rawgGenres.length > 0) {
      const genreIds = await findOrCreateGenres(rawgGenres);
      const genreRecords = genreIds.map(gid => ({ game_id: game.id, genre_id: gid }));
      await GameGenre.bulkCreate(genreRecords, { ignoreDuplicates: true });
    }

    // Link platforms
    const platformMatches = await matchPlatforms(detail.platforms);
    if (platformMatches.length > 0) {
      const platRecords = platformMatches.map(pm => ({
        game_id: game.id,
        platform_id: pm.platform_id,
        platform_release_date: pm.platform_release_date || null,
        exclusivity: 'none' as const,
      }));
      await GamePlatform.bulkCreate(platRecords as any, { ignoreDuplicates: true });
    }

    // Record status history
    await GameStatusHistory.create({
      game_id: game.id,
      new_release_status: game.release_status,
      new_availability_status: game.availability_status,
      change_reason: `Imported from RAWG (rawg_id: ${rawgId})`,
      changed_by: req.user?.id,
    });

    // Reload with associations
    const fullGame = await Game.findByPk(game.id, {
      include: [
        { model: Developer, as: 'developer', attributes: ['id', 'name', 'slug'] },
        { model: Publisher, as: 'publisher', attributes: ['id', 'name', 'slug'] },
        { model: Genre, as: 'genres', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
        { model: Platform, as: 'platforms', attributes: ['id', 'name', 'slug'], through: { attributes: ['platform_release_date'] } },
      ],
    });

    res.status(201).json({
      success: true,
      message: `Game "${game.title}" imported successfully from RAWG.`,
      data: {
        game: fullGame,
        rawg_id: rawgId,
        genres_linked: rawgGenres.length,
        platforms_linked: platformMatches.length,
      },
    });
  } catch (error: any) {
    console.error('RAWG import error:', error.message);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({
        success: false,
        message: 'A game with this slug already exists.',
      });
      return;
    }
    const status = error.response?.status === 429 ? 429 : 500;
    res.status(status).json({
      success: false,
      message: status === 429
        ? 'RAWG API rate limit exceeded. Please try again later.'
        : 'Error importing game from RAWG.',
    });
  }
};

// ──────────────────────────────────────────────
// POST /api/external/rawg/sync/:gameId
// ──────────────────────────────────────────────

export const rawgSyncOne = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!ensureApiKey(res)) return;

    const gameId = parseInt(req.params.gameId, 10);
    if (isNaN(gameId) || gameId <= 0) {
      res.status(400).json({ success: false, message: 'Invalid game ID.' });
      return;
    }

    const game = await Game.findByPk(gameId);
    if (!game) {
      res.status(404).json({ success: false, message: 'Game not found.' });
      return;
    }
    if (!game.rawg_id) {
      res.status(400).json({ success: false, message: 'This game has no rawg_id. It was not imported from RAWG.' });
      return;
    }

    // Fetch latest data from RAWG
    const detail = await getRawgGameDetail(game.rawg_id);
    const changes: string[] = [];

    // Update fields that may have changed
    if (detail.metacritic !== null && detail.metacritic !== game.metacritic_score) {
      changes.push(`metacritic: ${game.metacritic_score} → ${detail.metacritic}`);
      game.metacritic_score = detail.metacritic;
    }
    if (detail.rating && detail.rating !== Number(game.average_rating)) {
      changes.push(`average_rating: ${game.average_rating} → ${detail.rating}`);
      game.average_rating = detail.rating;
    }
    if (detail.ratings_count && detail.ratings_count !== game.total_reviews) {
      changes.push(`total_reviews: ${game.total_reviews} → ${detail.ratings_count}`);
      game.total_reviews = detail.ratings_count;
    }
    if (detail.background_image && detail.background_image !== game.cover_url) {
      changes.push(`cover_url updated`);
      game.cover_url = detail.background_image;
    }
    if (detail.background_image_additional && detail.background_image_additional !== game.banner_url) {
      changes.push(`banner_url updated`);
      game.banner_url = detail.background_image_additional;
    }
    if (detail.description_raw && detail.description_raw !== game.description) {
      changes.push(`description updated`);
      game.description = detail.description_raw;
    }

    // Release status sync
    const prevReleaseStatus = game.release_status;
    if (detail.released && !detail.tba) {
      const rd = new Date(detail.released);
      if (rd <= new Date() && game.release_status !== 'released') {
        game.release_status = 'released';
        game.release_date = new Date(detail.released) as any;
        changes.push(`release_status: ${prevReleaseStatus} → released`);
      }
    }

    if (changes.length > 0) {
      await game.save();

      // Record release status change if applicable
      if (game.release_status !== prevReleaseStatus) {
        await GameStatusHistory.create({
          game_id: game.id,
          previous_release_status: prevReleaseStatus,
          new_release_status: game.release_status,
          change_reason: `RAWG sync: status updated (rawg_id: ${game.rawg_id})`,
          changed_by: req.user?.id,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: changes.length > 0
        ? `Synced ${changes.length} field(s) from RAWG.`
        : 'No changes detected from RAWG.',
      data: {
        game_id: game.id,
        rawg_id: game.rawg_id,
        changes,
        synced_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('RAWG sync error:', error.message);
    const status = error.response?.status === 429 ? 429 : 500;
    res.status(status).json({
      success: false,
      message: status === 429
        ? 'RAWG API rate limit exceeded. Please try again later.'
        : 'Error syncing game from RAWG.',
    });
  }
};
