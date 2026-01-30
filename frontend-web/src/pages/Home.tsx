import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { ROUTES, APP_NAME } from '../utils/constants';

const sections = [
  { id: 0, title: 'Hero' },
  { id: 1, title: 'Features' },
  { id: 2, title: 'Platforms' },
  { id: 3, title: 'Technology' },
  { id: 4, title: 'Get Started' },
];

const features = [
  {
    icon: '🎮',
    title: 'Collection Management',
    desc: 'Organize your games by platform, status and format. Track complete statistics of your library.',
  },
  {
    icon: '🏆',
    title: 'GOTY Hall of Fame',
    desc: 'Discover Game of the Year winners from all major awards worldwide.',
  },
  {
    icon: '📅',
    title: 'Upcoming Releases',
    desc: 'Track games in development with countdown timers and release notifications.',
  },
  {
    icon: '📦',
    title: 'Historical Preservation',
    desc: 'Abandonware catalog and voting system for classic game re-releases.',
  },
  {
    icon: '⭐',
    title: 'Reviews & Ratings',
    desc: 'Rate games, write reviews and share opinions with the community.',
  },
  {
    icon: '🔔',
    title: 'Smart Notifications',
    desc: 'Receive alerts for releases, updates and re-releases from your wishlist.',
  },
];

const platforms = [
  { icon: '🎮', name: 'PlayStation 5 & PS4' },
  { icon: '🎮', name: 'Xbox Series X|S & One' },
  { icon: '🎮', name: 'Nintendo Switch' },
  { icon: '💻', name: 'PC (Steam, Epic, GOG)' },
  { icon: '📱', name: 'Mobile (iOS & Android)' },
  { icon: '🕹️', name: 'Retro & Classic Consoles' },
];

const techStack = {
  backend: ['Node.js', 'Express', 'TypeScript', 'PostgreSQL', 'JWT Auth', 'REST API', 'Sequelize ORM'],
  frontend: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'React Router', 'Axios'],
  devops: ['Docker', 'Git', 'VS Code', 'GitHub Actions'],
};

const stats = [
  { number: '15+', label: 'Supported Platforms' },
  { number: '1000+', label: 'Games Cataloged' },
  { number: 'GOTY', label: 'Awards Tracked' },
  { number: '24/7', label: 'Full Access' },
];

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentSection, setCurrentSection] = useState(0);

  const goToSection = useCallback((index: number) => {
    if (index >= 0 && index < sections.length) {
      setCurrentSection(index);
    }
  }, []);

  const nextSection = useCallback(() => {
    if (currentSection < sections.length - 1) {
      setCurrentSection((prev) => prev + 1);
    }
  }, [currentSection]);

  const prevSection = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
    }
  }, [currentSection]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSection();
      if (e.key === 'ArrowLeft') prevSection();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSection, prevSection]);

  // Touch/swipe support
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 50) nextSection();
      if (touchEndX - touchStartX > 50) prevSection();
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [nextSection, prevSection]);

  // If authenticated, show simplified dashboard redirect
  if (isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[80vh] flex flex-col items-center justify-center text-center"
      >
        <h1 className="text-5xl font-extrabold gradient-text-full mb-6">
          Welcome Back to {APP_NAME}
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl">
          Your gaming universe awaits. Check your collection, discover new games, and track your progress.
        </p>
        <div className="flex gap-4">
          <Link to={ROUTES.COLLECTION}>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-lg"
            >
              My Collection
            </motion.button>
          </Link>
          <Link to={ROUTES.GAMES}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary text-lg"
            >
              Browse Games
            </motion.button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-dark-200">
      {/* Navigation Dots */}
      <div className="fixed top-1/2 right-8 -translate-y-1/2 z-50 flex flex-col gap-3">
        {sections.map((section) => (
          <motion.button
            key={section.id}
            onClick={() => goToSection(section.id)}
            whileHover={{ scale: 1.2 }}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSection === section.id
              ? 'bg-primary-400 scale-125'
              : 'bg-primary-400/30 hover:bg-primary-400/50'
              }`}
            title={section.title}
          />
        ))}
      </div>

      {/* Arrow Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={prevSection}
          disabled={currentSection === 0}
          className={`icon-btn ${currentSection === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          ←
        </motion.button>
        <span className="text-gray-400 text-sm">
          {currentSection + 1} / {sections.length}
        </span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={nextSection}
          disabled={currentSection === sections.length - 1}
          className={`icon-btn ${currentSection === sections.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          →
        </motion.button>
      </div>

      {/* Horizontal Scrolling Container */}
      <motion.div
        className="flex h-full"
        animate={{ x: `-${currentSection * 100}vw` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Section 1: Hero */}
        <section className="w-screen h-full flex-shrink-0 flex items-center justify-center px-8">
          <div className="text-center max-w-5xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-7xl font-black mb-6 gradient-text-full leading-tight"
            >
              Organize Your Gaming Universe
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
            >
              Complete platform to catalog, manage and preserve your digital game collection across all platforms
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -5, borderColor: 'rgba(167, 139, 250, 1)' }}
                  className="stat-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <p className="text-3xl font-extrabold text-primary-400 mb-1">{stat.number}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Section 2: Features */}
        <section className="w-screen h-full flex-shrink-0 flex items-center justify-center px-8">
          <div className="max-w-6xl w-full">
            <motion.h2
              className="text-4xl md:text-5xl font-extrabold text-center mb-12 gradient-text"
            >
              Key Features
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8, borderColor: 'rgba(167, 139, 250, 1)' }}
                  transition={{ delay: index * 0.1 }}
                  className="feature-card"
                >
                  <span className="text-4xl mb-4 block">{feature.icon}</span>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Platforms */}
        <section className="w-screen h-full flex-shrink-0 flex items-center justify-center px-8">
          <div className="max-w-5xl w-full flex flex-col md:flex-row gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex-1 glass-card p-8 flex items-center justify-center"
            >
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-9xl"
                >
                  🎮
                </motion.div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-primary-500/20 rounded-full blur-md" />
              </div>
            </motion.div>
            <div className="flex-1">
              <motion.h2
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="text-4xl font-extrabold mb-8 gradient-text"
              >
                All Platforms in One Place
              </motion.h2>
              <div className="space-y-3">
                {platforms.map((platform, index) => (
                  <motion.div
                    key={platform.name}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 10, color: '#a78bfa' }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 py-3 border-b border-primary-500/20 cursor-pointer text-gray-300"
                  >
                    <span className="text-2xl">{platform.icon}</span>
                    <span className="font-medium">{platform.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Technology */}
        <section className="w-screen h-full flex-shrink-0 flex items-center justify-center px-8">
          <div className="max-w-5xl w-full">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-extrabold text-center mb-12 gradient-text"
            >
              Technology Stack
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-primary-400 mb-4">Backend & Database</h3>
                <div className="flex flex-wrap gap-3">
                  {techStack.backend.map((tech) => (
                    <motion.span
                      key={tech}
                      whileHover={{ y: -3, background: 'rgba(139, 92, 246, 0.2)' }}
                      className="px-4 py-2 rounded-full text-sm font-semibold glass-card cursor-pointer"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>

                <h3 className="text-2xl font-bold text-primary-400 mb-4 mt-8">Web Frontend</h3>
                <div className="flex flex-wrap gap-3">
                  {techStack.frontend.map((tech) => (
                    <motion.span
                      key={tech}
                      whileHover={{ y: -3, background: 'rgba(139, 92, 246, 0.2)' }}
                      className="px-4 py-2 rounded-full text-sm font-semibold glass-card cursor-pointer"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary-400 mb-4">DevOps & Tools</h3>
                <div className="flex flex-wrap gap-3">
                  {techStack.devops.map((tech) => (
                    <motion.span
                      key={tech}
                      whileHover={{ y: -3, background: 'rgba(139, 92, 246, 0.2)' }}
                      className="px-4 py-2 rounded-full text-sm font-semibold glass-card cursor-pointer"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: CTA */}
        <section className="w-screen h-full flex-shrink-0 flex items-center justify-center px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="max-w-3xl w-full text-center p-12 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
              border: '2px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <h2 className="text-5xl font-black mb-6 gradient-text-full">Ready to Get Started?</h2>
            <p className="text-xl text-gray-400 mb-8">
              Join the community and start organizing your game collection today
            </p>
            <div className="flex gap-4 justify-center">
              <Link to={ROUTES.REGISTER}>
                <motion.button
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-lg"
                >
                  Create Free Account
                </motion.button>
              </Link>
              <Link to={ROUTES.GAMES}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary text-lg"
                >
                  View Demo
                </motion.button>
              </Link>
            </div>
            <p className="mt-8 pt-6 border-t border-primary-500/30 text-gray-500 text-sm">
              Open Source • Made with ❤️ for Gamers • © 2026 {APP_NAME}
            </p>
          </motion.div>
        </section>
      </motion.div>
    </div>
  );
};
