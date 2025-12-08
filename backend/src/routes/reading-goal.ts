import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/reading-goal
 * Get the current year's reading goal
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();

    let goal = await prisma.readingGoal.findUnique({
      where: { year: currentYear },
    });

    // If no goal exists for current year, create a default one
    if (!goal) {
      // Count books read this year
      const booksReadThisYear = await prisma.book.count({
        where: {
          status: 'read',
          dateAdded: {
            gte: new Date(`${currentYear}-01-01`),
            lt: new Date(`${currentYear + 1}-01-01`),
          },
        },
      });

      goal = await prisma.readingGoal.create({
        data: {
          year: currentYear,
          target: 24, // Default target
          current: booksReadThisYear,
        },
      });
    }

    res.json({
      year: goal.year,
      target: goal.target,
      current: goal.current,
    });
  } catch (error) {
    console.error('Failed to fetch reading goal:', error);
    res.status(500).json({ error: 'Failed to fetch reading goal' });
  }
});

/**
 * PUT /api/reading-goal
 * Update the current year's reading goal
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const { target } = req.body;
    const currentYear = new Date().getFullYear();

    if (target === undefined || typeof target !== 'number' || target < 0) {
      return res.status(400).json({ error: 'Valid target number is required' });
    }

    // Get current count of books read this year
    const booksReadThisYear = await prisma.book.count({
      where: {
        status: 'read',
        dateAdded: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`),
        },
      },
    });

    const goal = await prisma.readingGoal.upsert({
      where: { year: currentYear },
      update: { target, current: booksReadThisYear },
      create: { year: currentYear, target, current: booksReadThisYear },
    });

    res.json({
      year: goal.year,
      target: goal.target,
      current: goal.current,
    });
  } catch (error) {
    console.error('Failed to update reading goal:', error);
    res.status(500).json({ error: 'Failed to update reading goal' });
  }
});

/**
 * POST /api/reading-goal/sync
 * Sync the reading goal count with actual books read
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();

    // Count all books marked as read
    const totalBooksRead = await prisma.book.count({
      where: { status: 'read' },
    });

    const goal = await prisma.readingGoal.upsert({
      where: { year: currentYear },
      update: { current: totalBooksRead },
      create: { year: currentYear, target: 24, current: totalBooksRead },
    });

    res.json({
      year: goal.year,
      target: goal.target,
      current: goal.current,
    });
  } catch (error) {
    console.error('Failed to sync reading goal:', error);
    res.status(500).json({ error: 'Failed to sync reading goal' });
  }
});

export { router as readingGoalRouter };

