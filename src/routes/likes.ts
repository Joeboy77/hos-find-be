import { Router } from 'express';
import { likeController } from '../controllers/likeController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

// Test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Likes router is working' });
});

// Test route to verify likeController import
router.get('/test-controller', (req, res) => {
  res.json({ 
    message: 'LikeController test',
    hasController: !!likeController,
    methods: Object.keys(likeController)
  });
});

// Public routes (no authentication required)
router.get('/properties/:propertyId/likes/count', likeController.getPropertyLikeCount);

// Protected routes (authentication required)
router.use(authenticateToken);

// Like a property
router.post('/properties/:propertyId/like', likeController.likeProperty);

// Unlike a property
router.delete('/properties/:propertyId/like', likeController.unlikeProperty);

// Get user's liked properties
router.get('/user/likes', likeController.getUserLikes);

// Get user's total like count
router.get('/user/likes/count', likeController.getUserLikeCount);

// Check if user has liked a specific property
router.get('/properties/:propertyId/liked', likeController.checkIfLiked);

export default router; 