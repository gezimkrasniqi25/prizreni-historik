import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import * as pub from '../controllers/publicController.js';
import * as user from '../controllers/userController.js';
import * as adminM from '../controllers/adminMonumentController.js';
import * as adminX from '../controllers/adminManageController.js';
import { authenticate, optionalAuth, requireRole, requireVerified } from '../middleware/auth.js';
import {
  emailLimiter, loginLimiter, registerLimiter, statsLimiter, uploadLimiter, validate, writeLimiter,
} from '../middleware/security.js';
import { imageUpload, modelUpload } from '../middleware/upload.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ------------------------------------------------------------ authentication
const a = Router();
a.post('/register', registerLimiter, validate(auth.registerSchema), auth.register);
a.post('/verify-email', validate(auth.tokenSchema), auth.verifyEmail);
a.post('/resend-verification', emailLimiter, validate(auth.emailOnlySchema), auth.resendVerification);
a.post('/login', loginLimiter, validate(auth.loginSchema), auth.login);
a.post('/logout', auth.logout);
a.get('/me', authenticate, auth.me);
a.post('/forgot-password', emailLimiter, validate(auth.emailOnlySchema), auth.forgotPassword);
a.post('/reset-password', emailLimiter, validate(auth.resetSchema), auth.resetPassword);
router.use('/auth', a);

// ------------------------------------------------------------- public content
router.get('/monuments', pub.getMonuments);
router.get('/monuments/:slug', pub.getMonument);
router.get('/monuments/:slug/reviews', pub.getReviews);
router.get('/monuments/:slug/comments', pub.getComments);
router.post('/monuments/:slug/reviews', authenticate, requireVerified, writeLimiter, validate(pub.reviewSchema), pub.upsertReview);
router.delete('/monuments/:slug/reviews', authenticate, pub.deleteOwnReview);
router.post('/monuments/:slug/comments', authenticate, requireVerified, writeLimiter, validate(pub.commentSchema), pub.addComment);
router.delete('/comments/:commentId', authenticate, pub.deleteComment);
router.get('/content', pub.getContent);
router.post('/stats/visit', statsLimiter, optionalAuth, validate(pub.visitSchema), pub.trackVisit);

// ------------------------------------------------------------ personal panel
const me = Router();
me.use(authenticate);
me.put('/profile', validate(user.profileSchema), user.updateProfile);
me.put('/password', validate(user.passwordSchema), user.changePassword);
me.get('/state', user.getState);
me.get('/favorites', user.getFavorites);
me.put('/favorites/:monumentId', user.addFavorite);
me.delete('/favorites/:monumentId', user.removeFavorite);
me.get('/wishlist', user.getWishlist);
me.put('/wishlist/:monumentId', validate(user.wishlistSchema), user.upsertWishlist);
me.delete('/wishlist/:monumentId', user.removeWishlist);
me.get('/activity', user.getMyActivity);
router.use('/me', me);

// -------------------------------------------------------------------- admin
const admin = Router();
admin.use(authenticate);

// admin + editor: content management
const staff = requireRole('admin', 'editor');
admin.get('/monuments', staff, adminM.adminList);
admin.get('/monuments/:id', staff, adminM.adminGet);
admin.post('/monuments', staff, validate(adminM.monumentSchema), adminM.createMonument);
admin.put('/monuments/:id', staff, validate(adminM.monumentSchema), adminM.updateMonument);
admin.delete('/monuments/:id', staff, adminM.deleteMonument);

admin.post('/monuments/:id/images', staff, uploadLimiter, imageUpload.array('images', 12), adminM.uploadImages);
admin.patch('/images/:imageId', staff, validate(adminM.imageSchema), adminM.updateImage);
admin.delete('/images/:imageId', staff, adminM.deleteImage);

admin.post('/monuments/:id/models', staff, uploadLimiter, modelUpload.single('model'), validate(adminM.modelMetaSchema), adminM.uploadModel);
admin.patch('/models/:modelId', staff, adminM.toggleModel);
admin.delete('/models/:modelId', staff, adminM.deleteModel);

admin.get('/comments', staff, adminX.getModeration);
admin.patch('/comments/:id', staff, validate(adminX.moderateSchema), adminX.moderateItem('comments'));
admin.delete('/comments/:id', staff, adminX.deleteItem('comments'));
admin.patch('/reviews/:id', staff, validate(adminX.moderateSchema), adminX.moderateItem('reviews'));
admin.delete('/reviews/:id', staff, adminX.deleteItem('reviews'));

admin.get('/content', staff, adminX.getAdminContent);
admin.put('/content', staff, validate(adminX.contentSchema), adminX.saveContent);
admin.get('/items', staff, adminX.listItems);
admin.post('/items', staff, validate(adminX.itemSchema), adminX.createItem);
admin.put('/items/:id', staff, validate(adminX.itemSchema), adminX.updateItem);
admin.delete('/items/:id', staff, adminX.deleteCulturalItem);

// admin only: users and statistics
const adminOnly = requireRole('admin');
admin.get('/users', adminOnly, adminX.getUsers);
admin.patch('/users/:id', adminOnly, validate(adminX.userUpdateSchema), adminX.updateUser);
admin.delete('/users/:id', adminOnly, adminX.deleteUser);
admin.get('/stats', adminOnly, adminX.getStats);

router.use('/admin', admin);

export default router;
