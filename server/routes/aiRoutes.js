import express from 'express';
import { generateArticle, generateBlogTitle, generateImage, getPublishedCreations, getUserCreations, removeBackground, removeObject, reviewResume, toggleCreationLike } from '../controllers/aiController.js';
import { auth } from '../middlewares/auth.js';
import upload from '../middlewares/multerConfig.js';

const aiRouter = express.Router();

aiRouter.get('/creations', auth, getUserCreations);
aiRouter.get('/community-creations', auth, getPublishedCreations);
aiRouter.post('/community-creations/:id/like', auth, toggleCreationLike);
aiRouter.post('/generate-article', auth, generateArticle);
aiRouter.post('/generate-blog-title', auth, generateBlogTitle);
aiRouter.post('/generate-image', auth, generateImage);
aiRouter.post('/remove-background', auth, upload.single('image'), removeBackground);
aiRouter.post('/remove-object', auth, upload.single('image'), removeObject);
aiRouter.post('/review-resume', auth, upload.single('pdf'), reviewResume);

export default aiRouter;
