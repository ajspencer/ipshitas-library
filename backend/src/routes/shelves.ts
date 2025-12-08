import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/shelves
 * List all custom shelves
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const shelves = await prisma.shelf.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });

    const transformed = shelves.map((shelf) => ({
      id: shelf.id,
      name: shelf.name,
      createdAt: shelf.createdAt.toISOString(),
      bookCount: shelf._count.books,
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Failed to fetch shelves:', error);
    res.status(500).json({ error: 'Failed to fetch shelves' });
  }
});

/**
 * POST /api/shelves
 * Create a new shelf
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Shelf name is required' });
    }

    // Check if shelf with same name exists
    const existing = await prisma.shelf.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return res.status(409).json({ error: 'A shelf with this name already exists' });
    }

    const shelf = await prisma.shelf.create({
      data: { name: name.trim() },
    });

    res.status(201).json({
      id: shelf.id,
      name: shelf.name,
      createdAt: shelf.createdAt.toISOString(),
      bookCount: 0,
    });
  } catch (error) {
    console.error('Failed to create shelf:', error);
    res.status(500).json({ error: 'Failed to create shelf' });
  }
});

/**
 * PUT /api/shelves/:id
 * Update a shelf
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Shelf name is required' });
    }

    // Check if shelf exists
    const existing = await prisma.shelf.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Shelf not found' });
    }

    // Check if another shelf has the same name
    const duplicate = await prisma.shelf.findFirst({
      where: { name: name.trim(), NOT: { id } },
    });
    if (duplicate) {
      return res.status(409).json({ error: 'A shelf with this name already exists' });
    }

    const shelf = await prisma.shelf.update({
      where: { id },
      data: { name: name.trim() },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });

    res.json({
      id: shelf.id,
      name: shelf.name,
      createdAt: shelf.createdAt.toISOString(),
      bookCount: shelf._count.books,
    });
  } catch (error) {
    console.error('Failed to update shelf:', error);
    res.status(500).json({ error: 'Failed to update shelf' });
  }
});

/**
 * DELETE /api/shelves/:id
 * Delete a shelf (books are not deleted, just unassigned from shelf)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if shelf exists
    const existing = await prisma.shelf.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Shelf not found' });
    }

    // Delete shelf (books will have shelfId set to null due to onDelete: SetNull)
    await prisma.shelf.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete shelf:', error);
    res.status(500).json({ error: 'Failed to delete shelf' });
  }
});

export { router as shelvesRouter };
