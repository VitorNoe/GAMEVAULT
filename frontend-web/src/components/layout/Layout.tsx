import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useUserStats } from '../../hooks/useUserStats';
import { ROUTES, APP_NAME } from '../../utils/constants';
import { AuroraBackground } from '../effects/AuroraBackground';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItemType {
  label: string;
  icon: string;
  path: string;
  badgeKey?: 'collection' | 'wishlist' | 'playing' | 'completed' | 'reviews' | 'notifications';
  requiresAuth: boolean;
}

const NAV_ITEMS: NavItemType[] = [
  { label: 'Dashboard', icon: '🏠', path: '/dashboard', requiresAuth: true },
  { label: 'Browse Games', icon: '🎮', path: ROUTES.GAMES, requiresAuth: false },
];

const LIBRARY_ITEMS: NavItemType[] = [
  { label: 'My Collection', icon: '📚', path: ROUTES.COLLECTION, badgeKey: 'collection', requiresAuth: true },
  { label: 'Wishlist', icon: '❤️', path: ROUTES.WISHLIST, badgeKey: 'wishlist', requiresAuth: true },
  { label: 'Playing Now', icon: '⭐', path: '/playing', badgeKey: 'playing', requiresAuth: true },
  { label: 'Completed', icon: '✅', path: '/completed', badgeKey: 'completed', requiresAuth: true },
];

const DISCOVER_ITEMS: NavItemType[] = [
  { label: 'GOTY Awards', icon: '🏆', path: '/awards', requiresAuth: false },
  { label: 'Upcoming Releases', icon: '📅', path: '/upcoming', requiresAuth: false },
  { label: 'Abandonware', icon: '📦', path: '/abandonware', requiresAuth: false },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { stats, formatCount } = useUserStats();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Memoize the badge value getter
  const getBadgeValue = useMemo(() => {
    return (badgeKey?: NavItemType['badgeKey']): string | null => {
      if (!badgeKey || !isAuthenticated) return null;
      const value = stats[badgeKey];
      return value > 0 ? formatCount(value) : null;
    };
  }, [stats, formatCount, isAuthenticated]);

  const NavItem = ({ item }: { item: NavItemType }) => {
    if (item.requiresAuth && !isAuthenticated) return null;

    const badge = getBadgeValue(item.badgeKey);

    return (
      <Link to={item.path}>
        <motion.div
          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="font-medium">{item.label}</span>
          {badge && (
            <span className="ml-auto badge">{badge}</span>
          )}
        </motion.div>
      </Link>
    );
  };

  // Check if it's the home/landing page (for full-width layout)
  const isLandingPage = location.pathname === ROUTES.HOME && !isAuthenticated;

  if (isLandingPage) {
    return (
      <div className="min-h-screen">
        <AuroraBackground />
        {/* Landing Page Header */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 h-[70px] glass z-50 flex items-center justify-between px-8"
        >
          <Link to={ROUTES.HOME}>
            <h1 className="text-2xl font-extrabold gradient-text">{APP_NAME}</h1>
          </Link>

          <div className="flex items-center gap-6">
            <Link to={ROUTES.GAMES} className="text-gray-400 hover:text-white transition-colors">
              Games
            </Link>
            <Link to={ROUTES.LOGIN}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Login
              </motion.button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary"
              >
                Sign Up
              </motion.button>
            </Link>
          </div>
        </motion.nav>

        <main className="pt-[70px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <AuroraBackground />
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: sidebarOpen ? 0 : -260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 w-[260px] h-screen glass z-40 flex flex-col"
      >
        {/* Logo */}
        <div className="p-6">
          <Link to={ROUTES.HOME}>
            <h1 className="text-2xl font-extrabold gradient-text">{APP_NAME}</h1>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {/* Main */}
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 mb-2">
              Main
            </p>
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          {/* Library */}
          {isAuthenticated && (
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 mb-2">
                Library
              </p>
              {LIBRARY_ITEMS.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          )}

          {/* Discover */}
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 mb-2">
              Discover
            </p>
            {DISCOVER_ITEMS.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          {/* Account */}
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 mb-2">
              Account
            </p>
            {isAuthenticated ? (
              <>
                <Link to={ROUTES.PROFILE}>
                  <motion.div className="nav-item" whileHover={{ x: 4 }}>
                    <span className="text-xl">👤</span>
                    <span className="font-medium">Profile</span>
                  </motion.div>
                </Link>
                {isAdmin && (
                  <Link to={ROUTES.ADMIN}>
                    <motion.div className={`nav-item ${isActive(ROUTES.ADMIN) ? 'active' : ''}`} whileHover={{ x: 4 }}>
                      <span className="text-xl">🛡️</span>
                      <span className="font-medium">Admin</span>
                    </motion.div>
                  </Link>
                )}
                <motion.div
                  className="nav-item cursor-pointer"
                  whileHover={{ x: 4 }}
                  onClick={handleLogout}
                >
                  <span className="text-xl">🚪</span>
                  <span className="font-medium">Logout</span>
                </motion.div>
              </>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>
                  <motion.div className="nav-item" whileHover={{ x: 4 }}>
                    <span className="text-xl">🔐</span>
                    <span className="font-medium">Login</span>
                  </motion.div>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <motion.div className="nav-item" whileHover={{ x: 4 }}>
                    <span className="text-xl">✨</span>
                    <span className="font-medium">Sign Up</span>
                  </motion.div>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-[260px]' : 'ml-0'}`}>
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass sticky top-0 z-30 h-[70px] flex items-center justify-between px-6"
        >
          {/* Toggle Sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="icon-btn mr-4"
          >
            <span className="text-lg">{sidebarOpen ? '◀' : '▶'}</span>
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search games, platforms, or genres..."
              className="input pl-12"
            />
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-4 ml-4">
            {isAuthenticated && (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="icon-btn relative cursor-pointer"
                >
                  <span className="text-lg">🔔</span>
                  {stats.notifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                      {stats.notifications > 99 ? '99+' : stats.notifications}
                    </span>
                  )}
                </motion.div>

                <Link to={ROUTES.PROFILE}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-pink flex items-center justify-center font-bold text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-white font-medium">{user?.name || 'User'}</span>
                  </motion.div>
                </Link>
              </>
            )}
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
