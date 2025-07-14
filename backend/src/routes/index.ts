// backend/src/routes/index.ts

import { Router } from 'express';
import equationsRouter from './equations';
import usersRouter from './users';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || '1.0.0',
    service: 'MetroCity Equation Engine'
  });
});

// API versioning
router.use('/v1/equations', equationsRouter);
router.use('/v1/users', usersRouter);

// Default version (current)
router.use('/equations', equationsRouter);
router.use('/users', usersRouter);

export default router;