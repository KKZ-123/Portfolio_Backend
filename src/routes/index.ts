import { Router } from 'express';
import userRoutes from './user.routes';

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

export default router;
