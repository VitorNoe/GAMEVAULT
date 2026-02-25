import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import gameRoutes from './gameRoutes';
import platformRoutes from './platformRoutes';
import collectionRoutes from './collectionRoutes';
import rawgRoutes from './rawgRoutes';
import reviewRoutes from './reviewRoutes';
import wishlistRoutes from './wishlistRoutes';
import preservationRoutes from './preservationRoutes';
import rereleaseRoutes from './rereleaseRoutes';
import notificationRoutes from './notificationRoutes';
import mediaRoutes from './mediaRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

// Health check endpoint
/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: API health check
 *     description: Returns 200 when the API server is running.
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: GameVault API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
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
router.use('/preservation', preservationRoutes);
router.use('/rereleases', rereleaseRoutes);
router.use('/notifications', notificationRoutes);
router.use('/media', mediaRoutes);
router.use('/admin', adminRoutes);

export default router;
