import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useUserStats } from '../../hooks/useUserStats';
import { ROUTES, APP_NAME } from '../../utils/constants';
import { AuroraBackground } from '../effects/AuroraBackground';
import {
  AppNotification,
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../utils/notifications';

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
  { label: 'Hall of Fame', icon: '🏆', path: '/awards', requiresAuth: false },
  { label: 'Upcoming Releases', icon: '📅', path: '/upcoming', requiresAuth: false },
  { label: 'Abandonware Museum', icon: '🏛️', path: '/abandonware', requiresAuth: false },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { stats, formatCount } = useUserStats();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const refreshNotifications = useCallback(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadNotifications(0);
      return;
    }

    setNotifications(getNotifications());
    setUnreadNotifications(getUnreadNotificationsCount());
  }, [isAuthenticated]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      refreshNotifications();
    };

    window.addEventListener('notifications-updated', handleNotificationsUpdated);
    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdated);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!notificationsRef.current) return;

      if (!notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isNotificationsOpen]);

  const openNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }

    setIsNotificationsOpen(false);
    navigate(notification.route || ROUTES.PROFILE);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const totalNotificationCount = stats.notifications + unreadNotifications;

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
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">🔍</span>
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
                <div className="relative" ref={notificationsRef}>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    className="icon-btn relative cursor-pointer"
                    onClick={openNotifications}
                    aria-label="Open notifications"
                    aria-expanded={isNotificationsOpen}
                  >
                    <span className="text-lg">🔔</span>
                    {totalNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                        {totalNotificationCount > 99 ? '99+' : totalNotificationCount}
                      </span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 mt-2 w-80 glass-card rounded-xl p-3 shadow-xl z-50"
                        style={{ top: '100%' }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-white">Notifications</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{notifications.length} total</span>
                            {unreadNotifications > 0 && (
                              <button
                                type="button"
                                onClick={markAllNotificationsAsRead}
                                className="text-xs text-cyan-300 hover:text-cyan-200 transition-colors"
                              >
                                Mark all as read
                              </button>
                            )}
                          </div>
                        </div>

                        {notifications.length === 0 ? (
                          <p className="text-sm text-gray-400">No notifications yet.</p>
                        ) : (
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {notifications.map((notification) => (
                              <button
                                type="button"
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className="w-full p-2 rounded-lg text-left transition-colors hover:bg-white/10"
                                style={{
                                  background: notification.read
                                    ? 'rgba(255, 255, 255, 0.04)'
                                    : 'rgba(6, 182, 212, 0.12)',
                                  border: notification.read
                                    ? '1px solid rgba(255, 255, 255, 0.08)'
                                    : '1px solid rgba(6, 182, 212, 0.35)',
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  {!notification.read && (
                                    <span className="w-2 h-2 rounded-full bg-cyan-300 flex-shrink-0" />
                                  )}
                                  <p className="text-sm text-white">{notification.message}</p>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleString('en-US')}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

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
