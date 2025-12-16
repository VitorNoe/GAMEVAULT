import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES, APP_NAME } from '../utils/constants';
import { Button } from '../components/common/Button';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="text-center">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">
        Welcome to {APP_NAME}
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Complete platform for cataloging, managing, and preserving digital games.
        Organize your collection across all platforms and discover new games.
      </p>

      <div className="flex gap-4 justify-center mb-12">
        {isAuthenticated ? (
          <>
            <Link to={ROUTES.COLLECTION}>
              <Button size="lg">My Collection</Button>
            </Link>
            <Link to={ROUTES.GAMES}>
              <Button size="lg" variant="secondary">Browse Games</Button>
            </Link>
          </>
        ) : (
          <>
            <Link to={ROUTES.REGISTER}>
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button size="lg" variant="secondary">Login</Button>
            </Link>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">🎮</div>
          <h3 className="text-xl font-semibold mb-2">Organize Your Collection</h3>
          <p className="text-gray-600">
            Track games across all platforms with detailed status and notes
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold mb-2">Discover GOTY Winners</h3>
          <p className="text-gray-600">
            Explore award-winning games and upcoming releases
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">Preserve Gaming History</h3>
          <p className="text-gray-600">
            Support abandonware preservation and vote for re-releases
          </p>
        </div>
      </div>
    </div>
  );
};
