import { Request, Response } from 'express';
import { Op, literal, fn, col, WhereOptions, Includeable, Order } from 'sequelize';
import sequelize from '../config/database';
import {
  Game, Platform, Genre, Award, Developer, Publisher,
  GamePlatform, GameGenre, GameAward, Review, RereleaseRequest,
} from '../models';
import {
  getPaginationParams,
  getPaginationResult,
  parseId,
  sanitizeSearchQuery,
  updateObjectFields,
} from '../utils/helpers';
import { catalogCache } from '../utils/cache';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Parse a comma-separated list of integers from a query param. */
const parseIntList = (raw: unknown): number[] => {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && n > 0);
};

/** Parse a comma-separated list of strings. */
const parseStringList = (raw: unknown): string[] => {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 0);
};

/** Build a stable cache key from the request query. */
const buildCacheKey = (req: Request): string => {
  const sorted = Object.entries(req.query)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `catalog:${sorted}`;
};

// ──────────────────────────────────────────────
// GET /api/games   –   Full catalog endpoint
// ──────────────────────────────────────────────

/**
 * Get all games with search, filters, sorting & pagination.
 *
 * Query params:
 *   search            – full-text search on title/description/synopsis
 *   platforms         – comma-separated platform IDs
 *   genres            – comma-separated genre IDs
 *   year_from / year_to – release year range
 *   release_status    – comma-separated release status values
 *   availability_status – comma-separated availability status values
 *   awards            – if truthy, only games with awards
 *   rating_min / rating_max – average_rating range (0-10)
 *   developer_id      – filter by developer
 *   publisher_id      – filter by publisher
 *   sort              – relevance | release_date | name | rating | most_voted | metacritic | newest
 *   order             – asc | desc  (default depends on sort)
 *   page / limit      – pagination (default limit=20, max 100)
 *   view              – grid | list | table (informational, controls response fields)
 */
export const getAllGames = async (req: Request, res: Response): Promise<void> => {
  try {
    // ── Check cache ──
    const cacheKey = buildCacheKey(req);
    const cached = catalogCache.get<object>(cacheKey);
    if (cached) {
      res.status(200).json(cached);
      return;
    }

    const { page, limit, offset } = getPaginationParams(req);

    // ── Build WHERE clause ──
    const where: WhereOptions<any> = {};

    // Full-text search
    const search = req.query.search || req.query.q;
    if (search) {
      const q = sanitizeSearchQuery(search as string);
      if (q) {
        where[Op.or as any] = [
          { title: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } },
          { synopsis: { [Op.iLike]: `%${q}%` } },
        ];
      }
    }

    // Status filters (accept comma-separated)
    const releaseStatuses = parseStringList(req.query.release_status);
    if (releaseStatuses.length === 1) {
      where.release_status = releaseStatuses[0];
    } else if (releaseStatuses.length > 1) {
      where.release_status = { [Op.in]: releaseStatuses } as any;
    }

    const availabilityStatuses = parseStringList(req.query.availability_status);
    if (availabilityStatuses.length === 1) {
      where.availability_status = availabilityStatuses[0];
    } else if (availabilityStatuses.length > 1) {
      where.availability_status = { [Op.in]: availabilityStatuses } as any;
    }

    // Year range
    const yearFrom = parseInt(req.query.year_from as string);
    const yearTo = parseInt(req.query.year_to as string);
    if (!isNaN(yearFrom) && !isNaN(yearTo)) {
      where.release_year = { [Op.between]: [yearFrom, yearTo] } as any;
    } else if (!isNaN(yearFrom)) {
      where.release_year = { [Op.gte]: yearFrom } as any;
    } else if (!isNaN(yearTo)) {
      where.release_year = { [Op.lte]: yearTo } as any;
    }
    // Legacy: single year param
    const yearExact = parseInt(req.query.year as string);
    if (!isNaN(yearExact) && !where.release_year) {
      where.release_year = yearExact;
    }

    // Rating range (0-10)
    const ratingMin = parseFloat(req.query.rating_min as string);
    const ratingMax = parseFloat(req.query.rating_max as string);
    if (!isNaN(ratingMin) && !isNaN(ratingMax)) {
      where.average_rating = { [Op.between]: [ratingMin, ratingMax] } as any;
    } else if (!isNaN(ratingMin)) {
      where.average_rating = { [Op.gte]: ratingMin } as any;
    } else if (!isNaN(ratingMax)) {
      where.average_rating = { [Op.lte]: ratingMax } as any;
    }

    // Developer / Publisher
    const devId = parseInt(req.query.developer_id as string);
    if (!isNaN(devId)) where.developer_id = devId;
    const pubId = parseInt(req.query.publisher_id as string);
    if (!isNaN(pubId)) where.publisher_id = pubId;

    // ── Build INCLUDE for related filters ──
    const include: Includeable[] = [];

    // Platform filter
    const platformIds = parseIntList(req.query.platforms);
    include.push({
      model: Platform,
      as: 'platforms',
      attributes: ['id', 'name', 'slug', 'type'],
      through: {
        attributes: ['platform_release_date', 'exclusivity'],
      },
      ...(platformIds.length > 0 && { where: { id: { [Op.in]: platformIds } } }),
    });

    // Genre filter
    const genreIds = parseIntList(req.query.genres);
    include.push({
      model: Genre,
      as: 'genres',
      attributes: ['id', 'name', 'slug'],
      through: { attributes: [] },
      ...(genreIds.length > 0 && { where: { id: { [Op.in]: genreIds } } }),
    });

    // Award filter – only include if specifically requested
    const wantAwards = req.query.awards === 'true' || req.query.awards === '1';
    include.push({
      model: Award,
      as: 'awards',
      attributes: ['id', 'name', 'slug', 'year', 'category'],
      through: { attributes: [] },
      ...(wantAwards && { required: true }),
    });

    // Developer & Publisher are always useful
    include.push(
      { model: Developer, as: 'developer', attributes: ['id', 'name', 'slug'] },
      { model: Publisher, as: 'publisher', attributes: ['id', 'name', 'slug'] },
    );

    // ── Sorting ──
    const sortParam = (req.query.sort as string || '').toLowerCase();
    const orderDir = ((req.query.order as string) || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let order: Order;
    switch (sortParam) {
      case 'name':
        order = [['title', orderDir === 'DESC' ? 'DESC' : 'ASC']];
        break;
      case 'release_date':
        order = [['release_date', orderDir], ['title', 'ASC']];
        break;
      case 'rating':
        order = [['average_rating', orderDir], ['total_reviews', 'DESC']];
        break;
      case 'metacritic':
        order = [['metacritic_score', orderDir], ['title', 'ASC']];
        break;
      case 'most_voted':
        order = [
          [literal('(SELECT COALESCE(rr.total_votes, 0) FROM rerelease_requests rr WHERE rr.game_id = "Game".id)'), orderDir],
          ['title', 'ASC'],
        ];
        break;
      case 'newest':
        order = [['created_at', 'DESC']];
        break;
      case 'relevance':
      default:
        if (search) {
          // When sorting by relevance with a search term, avoid using a raw SQL literal
          // built from user input. Fall back to a safe, deterministic ordering.
          order = [
            ['metacritic_score', 'DESC NULLS LAST'],
            ['title', 'ASC'],
          ];
        } else {
          order = [['release_date', 'DESC NULLS LAST'], ['title', 'ASC']];
        }
        break;
    }

    // ── Execute query ──
    // Split count + findAll to avoid PostgreSQL GROUP BY error with
    // findAndCountAll when multiple belongsToMany includes are present.
    const hasRelationFilter = platformIds.length > 0 || genreIds.length > 0 || wantAwards;

    // Build a minimal include list containing only the filtering associations
    const countInclude: Includeable[] = [];
    if (platformIds.length > 0) {
      countInclude.push({
        model: Platform, as: 'platforms', attributes: [],
        through: { attributes: [] },
        where: { id: { [Op.in]: platformIds } },
      });
    }
    if (genreIds.length > 0) {
      countInclude.push({
        model: Genre, as: 'genres', attributes: [],
        through: { attributes: [] },
        where: { id: { [Op.in]: genreIds } },
      });
    }
    if (wantAwards) {
      countInclude.push({
        model: Award, as: 'awards', attributes: [],
        through: { attributes: [] },
        required: true,
      });
    }

    const count = await Game.count({
      where,
      ...(countInclude.length > 0 && { include: countInclude }),
      distinct: true,
      col: 'id',
    });

    const games = await Game.findAll({
      where,
      include,
      order,
      limit,
      offset,
      subQuery: !hasRelationFilter,
    });

    // ── Compute aggregated review data for the page ──
    const gameIds = games.map(g => g.id);
    let reviewAggMap: Record<number, { avg_rating: number; review_count: number }> = {};
    if (gameIds.length > 0) {
      const reviewAggs = await Review.findAll({
        attributes: [
          'game_id',
          [fn('AVG', col('rating')), 'avg_rating'],
          [fn('COUNT', col('id')), 'review_count'],
        ],
        where: { game_id: { [Op.in]: gameIds } },
        group: ['game_id'],
        raw: true,
      }) as any[];
      reviewAggMap = Object.fromEntries(
        reviewAggs.map((r: any) => [r.game_id, {
          avg_rating: parseFloat(Number(r.avg_rating).toFixed(2)),
          review_count: parseInt(r.review_count, 10),
        }])
      );
    }

    const view = (req.query.view as string || 'grid').toLowerCase();

    // ── Shape response ──
    const gamesData = games.map(game => {
      const g = game.toJSON() as any;
      const agg = reviewAggMap[g.id] || { avg_rating: null, review_count: 0 };

      const base: any = {
        id: g.id,
        title: g.title,
        slug: g.slug,
        cover_url: g.cover_url,
        release_year: g.release_year,
        release_date: g.release_date,
        release_status: g.release_status,
        availability_status: g.availability_status,
        age_rating: g.age_rating,
        metacritic_score: g.metacritic_score,
        average_rating: agg.avg_rating ?? g.average_rating,
        total_reviews: agg.review_count || g.total_reviews || 0,
        developer: g.developer,
        publisher: g.publisher,
        platforms: (g.platforms || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          type: p.type,
          platform_release_date: p.GamePlatform?.platform_release_date ?? null,
          exclusivity: p.GamePlatform?.exclusivity ?? 'none',
        })),
        genres: g.genres || [],
      };

      if (view === 'list' || view === 'table') {
        base.description = g.description;
        base.synopsis = g.synopsis;
        base.banner_url = g.banner_url;
        base.trailer_url = g.trailer_url;
        base.awards = g.awards || [];
        base.is_early_access = g.is_early_access;
        base.was_rereleased = g.was_rereleased;
      }

      if (view === 'table') {
        base.discontinuation_date = g.discontinuation_date;
        base.official_abandonment_date = g.official_abandonment_date;
        base.rerelease_date = g.rerelease_date;
        base.abandonment_reason = g.abandonment_reason;
        base.development_percentage = g.development_percentage;
        base.rawg_id = g.rawg_id;
        base.created_at = g.created_at;
        base.updated_at = g.updated_at;
      }

      return base;
    });

    const response = {
      success: true,
      data: {
        games: gamesData,
        pagination: getPaginationResult(count, page, limit),
        filters_applied: {
          search: search || null,
          platforms: platformIds.length > 0 ? platformIds : null,
          genres: genreIds.length > 0 ? genreIds : null,
          year_from: !isNaN(yearFrom) ? yearFrom : null,
          year_to: !isNaN(yearTo) ? yearTo : null,
          release_status: releaseStatuses.length > 0 ? releaseStatuses : null,
          availability_status: availabilityStatuses.length > 0 ? availabilityStatuses : null,
          awards: wantAwards || null,
          rating_min: !isNaN(ratingMin) ? ratingMin : null,
          rating_max: !isNaN(ratingMax) ? ratingMax : null,
          sort: sortParam || 'relevance',
          view,
        },
      },
    };

    catalogCache.set(cacheKey, response, 60);
    res.status(200).json(response);
  } catch (error) {
    console.error('Get all games error:', error);
    res.status(500).json({ success: false, message: 'Error fetching games.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/games/:id  – Single game detail
// ──────────────────────────────────────────────

export const getGameById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid game ID.' });
      return;
    }

    const cacheKey = `game:${id}`;
    const cached = catalogCache.get<object>(cacheKey);
    if (cached) {
      res.status(200).json(cached);
      return;
    }

    const game = await Game.findByPk(id, {
      include: [
        {
          model: Platform, as: 'platforms',
          attributes: ['id', 'name', 'slug', 'type', 'manufacturer', 'generation', 'release_year'],
          through: { attributes: ['platform_release_date', 'exclusivity'] },
        },
        { model: Genre, as: 'genres', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
        { model: Award, as: 'awards', attributes: ['id', 'name', 'slug', 'year', 'category', 'relevance'], through: { attributes: [] } },
        { model: Developer, as: 'developer', attributes: ['id', 'name', 'slug', 'status'] },
        { model: Publisher, as: 'publisher', attributes: ['id', 'name', 'slug', 'status'] },
      ],
    });

    if (!game) {
      res.status(404).json({ success: false, message: 'Game not found.' });
      return;
    }

    const reviewAgg = await Review.findOne({
      attributes: [
        [fn('AVG', col('rating')), 'avg_rating'],
        [fn('COUNT', col('id')), 'review_count'],
      ],
      where: { game_id: id },
      raw: true,
    }) as any;

    const g = game.toJSON() as any;
    const result = {
      ...g,
      average_rating: reviewAgg?.avg_rating ? parseFloat(Number(reviewAgg.avg_rating).toFixed(2)) : g.average_rating,
      total_reviews: reviewAgg?.review_count ? parseInt(reviewAgg.review_count, 10) : g.total_reviews || 0,
      platforms: (g.platforms || []).map((p: any) => ({
        ...p,
        platform_release_date: p.GamePlatform?.platform_release_date ?? null,
        exclusivity: p.GamePlatform?.exclusivity ?? 'none',
        GamePlatform: undefined,
      })),
    };

    const response = { success: true, data: { game: result } };
    catalogCache.set(cacheKey, response, 120);
    res.status(200).json(response);
  } catch (error) {
    console.error('Get game by ID error:', error);
    res.status(500).json({ success: false, message: 'Error fetching game.' });
  }
};

// ──────────────────────────────────────────────
// POST /api/games  – Create game (admin)
// ──────────────────────────────────────────────

export const createGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title, slug, description, synopsis, release_year, release_date,
      cover_url, banner_url, trailer_url, developer_id, publisher_id,
      release_status, availability_status, age_rating, rawg_id, metacritic_score,
    } = req.body;

    const existingGame = await Game.findOne({ where: { slug } });
    if (existingGame) {
      res.status(400).json({ success: false, message: 'A game with this slug already exists.' });
      return;
    }

    const game = await Game.create({
      title, slug, description, synopsis, release_year, release_date,
      cover_url, banner_url, trailer_url, developer_id, publisher_id,
      release_status: release_status || 'released',
      availability_status: availability_status || 'available',
      age_rating, rawg_id, metacritic_score,
    });

    // Handle platform associations if provided
    const { platforms } = req.body;
    if (Array.isArray(platforms) && platforms.length > 0) {
      const records = platforms.map((p: any) => ({
        game_id: game.id,
        platform_id: parseInt(p.platform_id),
        platform_release_date: p.platform_release_date || null,
        exclusivity: p.exclusivity || 'none',
      }));
      await GamePlatform.bulkCreate(records);
    }

    catalogCache.invalidatePrefix('catalog:');

    res.status(201).json({ success: true, message: 'Game created successfully.', data: { game } });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ success: false, message: 'Error creating game.' });
  }
};

// ──────────────────────────────────────────────
// PUT /api/games/:id  – Update game (admin)
// ──────────────────────────────────────────────

export const updateGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid game ID.' });
      return;
    }

    const game = await Game.findByPk(id);
    if (!game) {
      res.status(404).json({ success: false, message: 'Game not found.' });
      return;
    }

    const updateFields = [
      'title', 'description', 'synopsis', 'release_year', 'release_date',
      'cover_url', 'banner_url', 'trailer_url', 'developer_id', 'publisher_id',
      'release_status', 'availability_status', 'discontinuation_date',
      'official_abandonment_date', 'rerelease_date', 'abandonment_reason',
      'development_percentage', 'age_rating', 'is_early_access', 'was_rereleased',
      'rawg_id', 'metacritic_score',
    ];
    updateObjectFields(game, req.body, updateFields);
    await game.save();

    // Handle platform associations if provided
    const { platforms } = req.body;
    if (Array.isArray(platforms)) {
      await GamePlatform.destroy({ where: { game_id: id } });
      if (platforms.length > 0) {
        const records = platforms.map((p: any) => ({
          game_id: id,
          platform_id: parseInt(p.platform_id),
          platform_release_date: p.platform_release_date || null,
          exclusivity: p.exclusivity || 'none',
        }));
        await GamePlatform.bulkCreate(records);
      }
    }

    catalogCache.invalidatePrefix('catalog:');
    catalogCache.del(`game:${id}`);

    res.status(200).json({ success: true, message: 'Game updated successfully.', data: { game } });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ success: false, message: 'Error updating game.' });
  }
};

// ──────────────────────────────────────────────
// DELETE /api/games/:id  – Delete game (admin)
// ──────────────────────────────────────────────

export const deleteGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const game = await Game.findByPk(id);
    if (!game) {
      res.status(404).json({ success: false, message: 'Game not found.' });
      return;
    }

    await game.destroy();
    catalogCache.invalidatePrefix('catalog:');
    catalogCache.del(`game:${id}`);

    res.status(200).json({ success: true, message: 'Game deleted successfully.' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ success: false, message: 'Error deleting game.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/games/search  – Lightweight search
// ──────────────────────────────────────────────

export const searchGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q) {
      res.status(400).json({ success: false, message: 'Search query is required.' });
      return;
    }

    const { page, limit, offset } = getPaginationParams(req);
    const sanitized = sanitizeSearchQuery(q as string);

    const { count, rows: games } = await Game.findAndCountAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${sanitized}%` } },
          { description: { [Op.iLike]: `%${sanitized}%` } },
        ],
      },
      attributes: ['id', 'title', 'slug', 'cover_url', 'release_year', 'metacritic_score', 'average_rating'],
      include: [
        { model: Developer, as: 'developer', attributes: ['id', 'name'] },
      ],
      limit,
      offset,
      order: [
        [literal('CASE WHEN LOWER("Game"."title") = LOWER(:exactTitle) THEN 0 WHEN LOWER("Game"."title") LIKE LOWER(:prefixTitle) THEN 1 ELSE 2 END'), 'ASC'],
        ['title', 'ASC'],
      ],
      bind: {
        exactTitle: sanitized,
        prefixTitle: `${sanitized}%`,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        games,
        pagination: getPaginationResult(count, page, limit),
      },
    });
  } catch (error) {
    console.error('Search games error:', error);
    res.status(500).json({ success: false, message: 'Error searching games.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/games/upcoming-releases
// ──────────────────────────────────────────────

export const getUpcomingReleases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const today = new Date().toISOString().split('T')[0];

    const { count, rows: games } = await Game.findAndCountAll({
      where: {
        [Op.or]: [
          { release_status: { [Op.in]: ['coming_soon', 'in_development'] } },
          { release_date: { [Op.gt]: today }, release_status: 'released' },
        ],
      },
      include: [
        { model: Developer, as: 'developer', attributes: ['id', 'name', 'slug'] },
        { model: Platform, as: 'platforms', attributes: ['id', 'name', 'slug'], through: { attributes: ['platform_release_date'] } },
      ],
      limit,
      offset,
      order: [['release_date', 'ASC']],
      distinct: true,
    });

    res.status(200).json({
      success: true,
      data: { games, pagination: getPaginationResult(count, page, limit) },
    });
  } catch (error) {
    console.error('Get upcoming releases error:', error);
    res.status(500).json({ success: false, message: 'Error fetching upcoming releases.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/games/abandonware
// ──────────────────────────────────────────────

export const getAbandonwareGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);

    const { count, rows: games } = await Game.findAndCountAll({
      where: { availability_status: 'abandonware' },
      include: [
        { model: Developer, as: 'developer', attributes: ['id', 'name', 'slug'] },
        { model: Platform, as: 'platforms', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
      ],
      limit,
      offset,
      order: [['title', 'ASC']],
      distinct: true,
    });

    res.status(200).json({
      success: true,
      data: { games, pagination: getPaginationResult(count, page, limit) },
    });
  } catch (error) {
    console.error('Get abandonware games error:', error);
    res.status(500).json({ success: false, message: 'Error fetching abandonware games.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/games/goty  – Games that won awards
// ──────────────────────────────────────────────

export const getGotyGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);

    const { count, rows: games } = await Game.findAndCountAll({
      include: [
        {
          model: Award, as: 'awards', required: true,
          attributes: ['id', 'name', 'year', 'category'],
          through: { attributes: [] },
        },
        { model: Developer, as: 'developer', attributes: ['id', 'name', 'slug'] },
      ],
      limit,
      offset,
      order: [['release_year', 'DESC']],
      distinct: true,
      subQuery: false,
    });

    res.status(200).json({
      success: true,
      data: { games, pagination: getPaginationResult(count, page, limit) },
    });
  } catch (error) {
    console.error('Get GOTY games error:', error);
    res.status(500).json({ success: false, message: 'Error fetching GOTY games.' });
  }
};
