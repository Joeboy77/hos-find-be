import { Router } from 'express';
import { contentController } from '../controllers/contentController';
import { uploadSingle, uploadMultiple } from '../middleware/upload';
import { authenticateAdmin } from '../middleware/adminAuth';
const router = Router();
router.get('/categories', contentController.getCategories);
router.get('/categories/:id', contentController.getCategoryById);
router.get('/properties', contentController.getProperties);
router.get('/properties/featured', contentController.getFeaturedProperties);
router.get('/properties/region/:region', contentController.getPropertiesByRegion);
router.get('/properties/category/:categoryId', contentController.getPropertiesByCategory);
router.get('/properties/type/:type', contentController.getPropertiesByType);
router.get('/properties/search', contentController.searchProperties);

// Room Type Routes (must come before /properties/:id to avoid conflicts)
router.get('/room-types/:id', contentController.getRoomTypeById);
router.get('/properties/:propertyId/room-types', contentController.getRoomTypesByProperty);

// Property Routes
router.get('/properties/:id', contentController.getPropertyById);
router.post('/admin/room-types', authenticateAdmin, contentController.createRoomType);
router.put('/admin/room-types/:id', authenticateAdmin, contentController.updateRoomType);
router.delete('/admin/room-types/:id', authenticateAdmin, contentController.deleteRoomType);

// Admin Routes
router.post('/admin/categories', authenticateAdmin, uploadSingle, contentController.createCategory);
router.put('/admin/categories/:id', authenticateAdmin, uploadSingle, contentController.updateCategory);
router.delete('/admin/categories/:id', authenticateAdmin, contentController.deleteCategory);
router.post('/admin/properties', authenticateAdmin, uploadMultiple, contentController.createProperty);
router.put('/admin/properties/:id', authenticateAdmin, uploadMultiple, contentController.updateProperty);
router.delete('/admin/properties/:id', authenticateAdmin, contentController.deleteProperty);
export default router; 