import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gameService } from '../services/gameService';
import { Game } from '../types/game.types';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Pagination } from '../components/common/Pagination';
import { FiltersPanel } from '../components/games/FiltersPanel';
import { RELEASE_STATUS_LABELS } from '../utils/constants';

interface FiltersState {
  search?: string;
  release_status?: string;
  availability_status?: string;
  year?: number | '';
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export const Games: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGames, setTotalGames] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout>();

  const [filters, setFilters] = useState<FiltersState>({
    search: searchParams.get('search') || '',
    release_status: searchParams.get('release_status') || '',
    availability_status: searchParams.get('availability_status') || '',
    year: searchParams.get('year') ? Number(searchParams.get('year')) : '',
    sort: searchParams.get('sort') || '',
    order: (searchParams.get('order') as 'ASC' | 'DESC') || 'DESC',
  });

  const fetchGames = useCallback(async (pageNum: number, currentFilters: FiltersState) => {
    try {
      setLoading(true);
      setError('');

      const params: Record<string, any> = { page: pageNum, limit: 20 };
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.release_status) params.release_status = currentFilters.release_status;
      if (currentFilters.availability_status) params.availability_status = currentFilters.availability_status;
      if (currentFilters.year) params.year = currentFilters.year;
      if (currentFilters.sort) params.sort = currentFilters.sort;
      if (currentFilters.order) params.order = currentFilters.order;

      let response;
      if (currentFilters.search) {
        response = await gameService.searchGames(currentFilters.search, params);
      } else {
        response = await gameService.getAllGames(params);
      }

      setGames(response.data?.games || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setTotalGames(response.data?.pagination?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (page > 1) params.page = String(page);
    if (filters.search) params.search = filters.search;
    if (filters.release_status) params.release_status = filters.release_status;
    if (filters.availability_status) params.availability_status = filters.availability_status;
    if (filters.year) params.year = String(filters.year);
    if (filters.sort) params.sort = filters.sort;
    if (filters.order && filters.order !== 'DESC') params.order = filters.order;
    setSearchParams(params, { replace: true });
  }, [page, filters, setSearchParams]);

  // Debounced fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGames(page, filters);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [page, filters, fetchGames]);

  const handleFilterChange = (newFilters: FiltersState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && games.length === 0) return <Loading />;

  return (
    <div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-4xl font-extrabold gradient-text mb-2">Games Catalog</h1>
        <p className="text-gray-400">
          Discover and explore {totalGames > 0 ? `${totalGames.toLocaleString()} games` : 'games'} across all platforms
        </p>
      </motion.div>

      {/* Filters */}
      <FiltersPanel filters={filters} onFilterChange={handleFilterChange} />

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <ErrorMessage message={error} onRetry={() => fetchGames(page, filters)} />
        </motion.div>
      )}

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Link to={`/games/${game.id}`}>
              <motion.div
                whileHover={{ y: -8, borderColor: 'rgba(167, 139, 250, 1)' }}
                className="game-card h-full"
              >
                <div className="relative h-64 overflow-hidden">
                  {game.cover_url ? (
                    <img
                      src={game.cover_url}
                      alt={game.title}
                      className="w-full h-full object-cover transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://placehold.co/300x400/1f2937/a78bfa?text=${encodeURIComponent(game.title.substring(0, 15))}`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600/30 to-accent-pink/30 text-white text-center p-4">
                      <span className="text-lg font-semibold">{game.title}</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-black/70 backdrop-blur-sm text-primary-400">
                      {RELEASE_STATUS_LABELS[game.release_status]}
                    </span>
                  </div>

                  {/* Metacritic Score */}
                  {game.metacritic_score && (
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded text-white text-sm font-bold ${game.metacritic_score >= 90 ? 'bg-green-600' :
                        game.metacritic_score >= 75 ? 'bg-yellow-500' :
                          game.metacritic_score >= 50 ? 'bg-orange-500' : 'bg-red-600'
                      }`}>
                      {game.metacritic_score}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 text-white line-clamp-2">{game.title}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>
                      {game.release_date
                        ? new Date(game.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                        : game.release_year || 'TBA'}
                    </span>
                    {game.average_rating && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        ⭐ {Number(game.average_rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>

      {games.length === 0 && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <span className="text-6xl mb-4 block">🎮</span>
          <p className="text-gray-400 text-lg">No games found</p>
          {(filters.search || filters.release_status || filters.availability_status || filters.year) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => handleFilterChange({ search: '', release_status: '', availability_status: '', year: '', sort: '', order: 'DESC' })}
              className="mt-4 text-primary-400 hover:text-primary-300 font-medium"
            >
              Clear all filters
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};
