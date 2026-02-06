import React, { Suspense, lazy, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { useAuth } from './hooks/useAuth';
import { ROUTES } from './utils/constants';
import { Loading } from './components/common/Loading';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Games = lazy(() => import('./pages/Games').then(m => ({ default: m.Games })));
const GameDetail = lazy(() => import('./pages/GameDetail').then(m => ({ default: m.GameDetail })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Collection = lazy(() => import('./pages/Collection').then(m => ({ default: m.Collection })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Wishlist = lazy(() => import('./pages/Wishlist').then(m => ({ default: m.Wishlist })));
const PlayingNow = lazy(() => import('./pages/PlayingNow').then(m => ({ default: m.PlayingNow })));
const CompletedGames = lazy(() => import('./pages/CompletedGames').then(m => ({ default: m.CompletedGames })));
const GotyAwards = lazy(() => import('./pages/GotyAwards').then(m => ({ default: m.GotyAwards })));
const UpcomingReleases = lazy(() => import('./pages/UpcomingReleases').then(m => ({ default: m.UpcomingReleases })));
const Abandonware = lazy(() => import('./pages/Abandonware').then(m => ({ default: m.Abandonware })));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
});

ProtectedRoute.displayName = 'ProtectedRoute';

// Public Only Route (redirect if authenticated)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.COLLECTION} replace />;
  }

  return <>{children}</>;
});

PublicOnlyRoute.displayName = 'PublicOnlyRoute';

// Page loading fallback
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loading />
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              {/* Public Routes */}
              <Route path={ROUTES.HOME} element={<Home />} />
              <Route path={ROUTES.GAMES} element={<Games />} />
              <Route path={ROUTES.GAME_DETAILS} element={<GameDetail />} />
              <Route path={ROUTES.GOTY_AWARDS} element={<GotyAwards />} />
              <Route path={ROUTES.UPCOMING} element={<UpcomingReleases />} />
              <Route path={ROUTES.ABANDONWARE} element={<Abandonware />} />

              {/* Public Only Routes */}
              <Route
                path={ROUTES.LOGIN}
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path={ROUTES.REGISTER}
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.COLLECTION}
                element={
                  <ProtectedRoute>
                    <Collection />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.WISHLIST}
                element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.PLAYING}
                element={
                  <ProtectedRoute>
                    <PlayingNow />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.COMPLETED}
                element={
                  <ProtectedRoute>
                    <CompletedGames />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.PROFILE}
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.SETTINGS}
                element={
                  <ProtectedRoute>
                    <div className="text-center py-12">
                      <h1 className="text-3xl font-bold">Settings</h1>
                      <p className="text-gray-600 mt-2">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* 404 Not Found */}
              <Route
                path="*"
                element={
                  <div className="text-center py-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-4">Page not found</p>
                    <a href={ROUTES.HOME} className="text-blue-600 hover:underline">
                      Go back home
                    </a>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </Layout>
      </AuthProvider>
    </Router >
  );
}

export default App;
