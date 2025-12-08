import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/profile
 * Get the profile data
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    let profile = await prisma.profile.findUnique({
      where: { id: 'default' },
    });

    // Create default profile if it doesn't exist
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: 'default',
          name: 'Ipshita',
          libraryName: "Ipshita's Library",
          bio: "I measure my life in terms of the impact I create. I care deeply about freedom of speech – a freedom core to the pursuit of truth. Barack Obama and Alexei Navalny are my idols.",
          avatar: '📚',
        },
      });
    }

    res.json({
      name: profile.name,
      libraryName: profile.libraryName,
      bio: profile.bio,
      avatar: profile.avatar,
    });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/profile
 * Update the profile
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const { name, libraryName, bio, avatar } = req.body;

    const profile = await prisma.profile.upsert({
      where: { id: 'default' },
      update: {
        ...(name !== undefined && { name }),
        ...(libraryName !== undefined && { libraryName }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
      create: {
        id: 'default',
        name: name || 'Ipshita',
        libraryName: libraryName || "Ipshita's Library",
        bio: bio || '',
        avatar: avatar || '📚',
      },
    });

    res.json({
      name: profile.name,
      libraryName: profile.libraryName,
      bio: profile.bio,
      avatar: profile.avatar,
    });
  } catch (error) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export { router as profileRouter };

