import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gameService } from '../services/gameService';
import { Game } from '../types/game.types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Button } from '../components/common/Button';
import { RELEASE_STATUS_LABELS, AVAILABILITY_STATUS_LABELS } from '../utils/constants';

export const Games: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

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
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Games Catalog</h1>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit">Search</Button>
        </form>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={() => fetchGames(page)} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game) => (
          <Link key={game.id} to={`/games/${game.id}`}>
            <Card hoverable padding="none" className="h-full">
              {game.cover_url && (
                <img
                  src={game.cover_url}
                  alt={game.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {game.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="info" size="sm">
                    {RELEASE_STATUS_LABELS[game.release_status]}
                  </Badge>
                  {game.availability_status === 'abandonware' && (
                    <Badge variant="warning" size="sm">Abandonware</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{game.release_year || 'TBA'}</span>
                  {game.average_rating && (
                    <span className="flex items-center">
                      ⭐ {game.average_rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {games.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">No games found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
