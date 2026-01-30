import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gameService } from '../services/gameService';
import { Game } from '../types/game.types';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Button } from '../components/common/Button';
import { RELEASE_STATUS_LABELS } from '../utils/constants';

export const Games: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = ['All', 'Released', 'Coming Soon', 'Early Access'];

  const fetchGames = async (pageNum: number) => {
    try {
      setLoading(true);
      setError('');
      const response = await gameService.getAllGames({ page: pageNum, limit: 20 });
      setGames(response.data?.games || []);
      setTotalPages(response.data?.pagination.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames(page);
  }, [page]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchGames(1);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await gameService.searchGames(searchQuery, { page: 1, limit: 20 });
      setGames(response.data?.games || []);
      setTotalPages(response.data?.pagination.totalPages || 1);
      setPage(1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && games.length === 0) return <Loading />;

  return (
    <div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-extrabold gradient-text mb-2">Games Catalog</h1>
        <p className="text-gray-400">Discover and explore thousands of games across all platforms</p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games by title..."
              className="input pl-12"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {filters.map((filter) => (
            <motion.button
              key={filter}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveFilter(filter.toLowerCase())}
              className={`filter-btn ${activeFilter === filter.toLowerCase() ? 'active' : ''}`}
            >
              {filter}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <ErrorMessage message={error} onRetry={() => fetchGames(page)} />
        </motion.div>
      )}

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
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
                  <h3 className="font-bold text-lg mb-2 text-white line-clamp-2">
                    {game.title}
                  </h3>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>
                      {game.release_date
                        ? new Date(game.release_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short'
                        })
                        : game.release_year || 'TBA'}
                    </span>
                    {game.average_rating && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        ⭐ {game.average_rating.toFixed(1)}
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <span className="text-6xl mb-4 block">🎮</span>
          <p className="text-gray-400 text-lg">No games found</p>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 flex justify-center items-center gap-4"
        >
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ← Previous
          </Button>
          <span className="text-gray-400 font-medium">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </Button>
        </motion.div>
      )}
    </div>
  );
};
