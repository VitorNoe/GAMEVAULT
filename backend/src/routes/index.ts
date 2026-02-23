import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import gameRoutes from './gameRoutes';
import platformRoutes from './platformRoutes';
import collectionRoutes from './collectionRoutes';
import rawgRoutes from './rawgRoutes';
import reviewRoutes from './reviewRoutes';
import wishlistRoutes from './wishlistRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'GameVault API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/games', gameRoutes);
router.use('/platforms', platformRoutes);
router.use('/collection', collectionRoutes);
router.use('/external/rawg', rawgRoutes);
router.use('/reviews', reviewRoutes);
router.use('/wishlist', wishlistRoutes);

export default router;
