import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Games } from './pages/Games';
import { GameDetail } from './pages/GameDetail';
import { Dashboard } from './pages/Dashboard';
import { Collection } from './pages/Collection';
import { Profile } from './pages/Profile';
import { Wishlist } from './pages/Wishlist';
import { useAuth } from './hooks/useAuth';
import { ROUTES } from './utils/constants';
import { Loading } from './components/common/Loading';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
};

// Public Only Route (redirect if authenticated)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.COLLECTION} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.GAMES} element={<Games />} />
            <Route path={ROUTES.GAME_DETAILS} element={<GameDetail />} />

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
        </Layout>
      </AuthProvider>
    </Router >
  );
}

export default App;
