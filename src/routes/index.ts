import { Router } from 'express';
import userRoutes from './user.routes';
import brandRoutes from './brand.routes';
import perfumeRoutes from './perfume.routes';
import { userController } from '../controllers/user.controller';

const router = Router();

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount resource routes
router.use('/users', userRoutes);
router.use('/brands', brandRoutes);
router.use('/perfumes', perfumeRoutes);

// Direct alias for retoken (/api/retoken as well as /api/users/retoken)
router.post('/retoken', (req, res, next) => userController.retoken(req, res, next));

export default router;
