import { Router, Request, Response } from 'express';
import prisma from '../db.js';

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
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear + 1, 0, 1);

      const booksReadThisYear = await prisma.book.count({
        where: {
          status: 'read',
          dateAdded: {
            gte: startOfYear,
            lt: endOfYear,
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
    console.error('Error fetching reading goal:', error);
    res.status(500).json({ error: 'Failed to fetch reading goal' });
  }
});

/**
 * PUT /api/reading-goal
 * Update the reading goal target
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const { target, year } = req.body;
    const goalYear = year || new Date().getFullYear();

    if (typeof target !== 'number' || target < 0) {
      return res.status(400).json({ error: 'Valid target number is required' });
    }

    const goal = await prisma.readingGoal.upsert({
      where: { year: goalYear },
      update: { target },
      create: {
        year: goalYear,
        target,
        current: 0,
      },
    });

    res.json({
      year: goal.year,
      target: goal.target,
      current: goal.current,
    });
  } catch (error) {
    console.error('Error updating reading goal:', error);
    res.status(500).json({ error: 'Failed to update reading goal' });
  }
});

/**
 * POST /api/reading-goal/sync
 * Sync the current count with actual books read
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);

    // Count books marked as read this year
    const booksReadThisYear = await prisma.book.count({
      where: {
        status: 'read',
        dateAdded: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
    });

    const goal = await prisma.readingGoal.upsert({
      where: { year: currentYear },
      update: { current: booksReadThisYear },
      create: {
        year: currentYear,
        target: 24,
        current: booksReadThisYear,
      },
    });

    res.json({
      year: goal.year,
      target: goal.target,
      current: goal.current,
    });
  } catch (error) {
    console.error('Error syncing reading goal:', error);
    res.status(500).json({ error: 'Failed to sync reading goal' });
  }
});

export { router as goalsRouter };

